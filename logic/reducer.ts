
import { GameState, ActionType, GameAction, TimeSlot, GameStatus, SubjectId, LogEntry, ItemId, RelationshipId, EventTriggerType } from '../types';
import { SUBJECTS, PASSING_SCORE } from '../data/subjects';
import { LOG_MESSAGES, ALL_EVENTS } from '../data/events';
import { ITEMS } from '../data/items';
import { clamp, chance, formatDelta, joinMessages } from '../utils/common';
import { getNextTimeSlot } from './time';
import { selectEvent, applyEventEffect, recordEventOccurrence } from './eventManager';

const INIT_RELATIONSHIPS = {
  [RelationshipId.PROFESSOR]: 20,
  [RelationshipId.SENIOR]: 20,
  [RelationshipId.FRIEND]: 30,
};

const INIT_KNOWLEDGE = {
  [SubjectId.MATH]: 0,
  [SubjectId.ALGO]: 0,
  [SubjectId.CIRCUIT]: 0,
  [SubjectId.HUMANITIES]: 0,
};

const RANDOM_EVENT_PROBABILITY = 35; // 毎ターン発生確率

export const INITIAL_STATE: GameState = {
  day: 1,
  timeSlot: TimeSlot.MORNING,
  hp: 100,
  maxHp: 100,
  sanity: 100,
  maxSanity: 100,
  caffeine: 0,
  knowledge: { ...INIT_KNOWLEDGE },
  relationships: { ...INIT_RELATIONSHIPS },
  inventory: {
    [ItemId.HIGH_CACAO_CHOCO]: 1,
  },
  logs: [{
    id: 'init',
    text: LOG_MESSAGES.start,
    type: 'system',
    timestamp: 'DAY 1 08:00'
  }],
  status: GameStatus.PLAYING,
  turnCount: 0,
  eventHistory: [],
  eventStats: {},
  statsHistory: [],
};

export const gameReducer = (state: GameState, action: GameAction): GameState => {
  if (action.type === ActionType.RESTART) {
    // 学力引き継ぎロジック (50%継承)
    const inheritedKnowledge = { ...INIT_KNOWLEDGE };
    let inherited = false;
    
    (Object.keys(state.knowledge) as SubjectId[]).forEach((id) => {
      if (state.knowledge[id] > 0) {
        inheritedKnowledge[id] = Math.floor(state.knowledge[id] / 2);
        inherited = true;
      }
    });

    const restartLogText = inherited 
      ? `${LOG_MESSAGES.start}\n【記憶継承】前回の学習データの50%を復元しました。`
      : LOG_MESSAGES.start;

    return {
      ...INITIAL_STATE,
      knowledge: inheritedKnowledge,
      relationships: { ...INIT_RELATIONSHIPS },
      inventory: { ...INITIAL_STATE.inventory },
      logs: [{
        id: Math.random().toString(36).substr(2, 9),
        text: restartLogText,
        type: 'system',
        timestamp: 'DAY 1 08:00'
      }]
    };
  }

  if (state.status !== GameStatus.PLAYING) {
    return state;
  }

  let newState = { ...state };
  newState.knowledge = { ...state.knowledge };
  newState.relationships = { ...state.relationships };
  newState.inventory = { ...state.inventory };
  newState.eventStats = { ...state.eventStats };
  
  let logs = [...state.logs];
  
  const addLog = (text: string, type: LogEntry['type'] = 'info') => {
    logs.push({
      id: Math.random().toString(36).substr(2, 9),
      text,
      type,
      timestamp: `DAY ${newState.day} ${newState.timeSlot}`
    });
  };

  let timeAdvanced = true;

  // ヘルパー：イベント処理
  const executeEvent = (currentState: GameState, trigger: EventTriggerType, fallbackText?: string): GameState => {
     const event = selectEvent(currentState, ALL_EVENTS, trigger);
     
     if (event) {
        const { newState: appliedState, messages } = applyEventEffect(currentState, event);
        const details = joinMessages(messages, ', ');
        const logType = event.type === 'good' ? 'success' : event.type === 'bad' ? 'danger' : 'info';
        addLog(details ? `${event.text}\n(${details})` : event.text, logType);
        return appliedState;
     } else if (fallbackText) {
        addLog(fallbackText, 'info');
        return currentState;
     }
     return currentState;
  };

  const calculateStudyEffect = (subjectId: SubjectId) => {
    const subject = SUBJECTS[subjectId];
    const currentScore = newState.knowledge[subjectId];
    
    let efficiency = 1.0;
    let hpCost = 10;
    let sanityCost = 5;
    let baseLog = "";
    let logType: LogEntry['type'] = 'info';
    let profRelDelta = 0;
    let seniorRelDelta = 0;

    if (state.timeSlot === TimeSlot.MORNING) {
      efficiency = 1.2;
      baseLog = LOG_MESSAGES.study_morning_bonus(subject.name);
    } else if (state.timeSlot === TimeSlot.AM) {
      profRelDelta = 2;
      baseLog = `【講義出席】${subject.name}の講義を真面目に受講した。`;
      logType = 'success';
    } else if (state.timeSlot === TimeSlot.NOON) {
      if (state.caffeine > 50) {
        baseLog = LOG_MESSAGES.study_caffeine_awake(subject.name);
      } else {
        efficiency = 0.7;
        baseLog = LOG_MESSAGES.study_noon_drowsy(subject.name);
        logType = 'warning';
      }
    } else if (state.timeSlot === TimeSlot.AFTERNOON) {
      profRelDelta = 2;
      hpCost = 15;
      baseLog = LOG_MESSAGES.study_afternoon_fight(subject.name);
      logType = 'warning';
    } else if (state.timeSlot === TimeSlot.AFTER_SCHOOL) {
      efficiency = 1.3;
      baseLog = LOG_MESSAGES.study_after_school_focus(subject.name);
    } else if (state.timeSlot === TimeSlot.NIGHT) {
      efficiency = 0.9;
      baseLog = LOG_MESSAGES.study_night_tired(subject.name);
    } else if (state.timeSlot === TimeSlot.LATE_NIGHT) {
      seniorRelDelta = 1;
      if (chance(30 + (state.sanity / 2))) {
         efficiency = 2.0;
         baseLog = LOG_MESSAGES.study_late_night_zone(subject.name);
         logType = 'success';
      } else {
         efficiency = 0.1;
         sanityCost = 15;
         baseLog = LOG_MESSAGES.study_late_night_fail(subject.name);
         logType = 'danger';
      }
    }

    if (state.caffeine > 50) efficiency += 0.25;
    
    if (state.caffeine > 120) {
      baseLog += `\n${LOG_MESSAGES.study_jitter}`;
      logType = 'danger';
      sanityCost += 10;
      hpCost += 8;
    }

    let progressionMultiplier = 1.0;
    if (currentScore < 40) {
      progressionMultiplier = 1.2; 
    } else if (currentScore < 60) {
      progressionMultiplier = 1.0;
    } else if (currentScore < 80) {
      progressionMultiplier = 0.6;
    } else {
      progressionMultiplier = 0.3;
    }

    let knowledgeGain = Math.floor(5 * efficiency * subject.difficulty * progressionMultiplier);
    if (knowledgeGain === 0 && efficiency > 0.5) knowledgeGain = 1;

    return { hpCost, sanityCost, knowledgeGain, profRelDelta, seniorRelDelta, baseLog, logType };
  };

  switch (action.type) {
    case ActionType.STUDY: {
      const { hpCost, sanityCost, knowledgeGain, profRelDelta, seniorRelDelta, baseLog, logType } = calculateStudyEffect(action.payload);
      
      newState.hp = clamp(newState.hp - hpCost, 0, newState.maxHp);
      newState.sanity = clamp(newState.sanity - sanityCost, 0, newState.maxSanity);
      newState.knowledge[action.payload] = clamp(newState.knowledge[action.payload] + knowledgeGain, 0, 100);
      if (profRelDelta) newState.relationships[RelationshipId.PROFESSOR] = clamp(newState.relationships[RelationshipId.PROFESSOR] + profRelDelta, 0, 100);
      if (seniorRelDelta) newState.relationships[RelationshipId.SENIOR] = clamp(newState.relationships[RelationshipId.SENIOR] + seniorRelDelta, 0, 100);

      const details = joinMessages([
        formatDelta(SUBJECTS[action.payload].name, knowledgeGain),
        formatDelta('HP', -hpCost),
        formatDelta('SAN', -sanityCost),
        formatDelta('教授友好度', profRelDelta),
        formatDelta('先輩友好度', seniorRelDelta)
      ], ', ');

      addLog(`${baseLog}\n(${details})`, logType);
      break;
    }

    case ActionType.REST: {
      let hpRecov = 20;
      let sanityRecov = 10;
      let caffeineDrop = -20;
      let baseLog = "";
      let logType: LogEntry['type'] = 'info';

      if (state.caffeine > 80) {
        hpRecov = 5;
        sanityRecov = -5; 
        baseLog = LOG_MESSAGES.rest_caffeine_fail;
        logType = 'danger';
      } else if (state.timeSlot === TimeSlot.LATE_NIGHT) {
        hpRecov = 40;
        sanityRecov = 20;
        baseLog = LOG_MESSAGES.rest_success;
        logType = 'success';
      } else if (state.timeSlot === TimeSlot.NOON) {
        sanityRecov += 5;
        baseLog = "【ランチ】学食で少しリラックスした。";
      } else {
        baseLog = LOG_MESSAGES.rest_short;
      }

      newState.hp = clamp(newState.hp + hpRecov, 0, newState.maxHp);
      newState.sanity = clamp(newState.sanity + sanityRecov, 0, newState.maxSanity);
      newState.caffeine = clamp(newState.caffeine + caffeineDrop, 0, 200);

      const details = joinMessages([
        formatDelta('HP', hpRecov),
        formatDelta('SAN', sanityRecov),
        formatDelta('カフェイン', caffeineDrop)
      ], ', ');

      addLog(`${baseLog}\n(${details})`, logType);
      break;
    }

    case ActionType.ESCAPISM: {
      const sanDelta = 25;
      const hpDelta = -5;
      let profRelDelta = 0;
      let baseLog = "";
      let logType: LogEntry['type'] = 'info';

      if (state.timeSlot === TimeSlot.AM || state.timeSlot === TimeSlot.AFTERNOON) {
        profRelDelta = -5;
        baseLog = "【サボり】講義をサボってゲーセンへ。背徳感がスパイスだ。";
        logType = 'warning';
      } else {
        baseLog = "【現実逃避】全てを忘れて没頭した。明日から本気出す。";
      }

      newState.sanity = clamp(newState.sanity + sanDelta, 0, newState.maxSanity);
      newState.hp = clamp(newState.hp + hpDelta, 0, newState.maxHp);
      if (profRelDelta) newState.relationships[RelationshipId.PROFESSOR] = clamp(newState.relationships[RelationshipId.PROFESSOR] + profRelDelta, 0, 100);

      const details = joinMessages([
        formatDelta('SAN', sanDelta),
        formatDelta('HP', hpDelta),
        formatDelta('教授友好度', profRelDelta)
      ], ', ');

      addLog(`${baseLog}\n(${details})`, logType);
      break;
    }

    case ActionType.CONSUME_CAFFEINE: {
      const cafDelta = 50;
      const sanDelta = -10; 
      const hpDelta = 10; 
      
      newState.caffeine = clamp(newState.caffeine + cafDelta, 0, 200);
      newState.sanity = clamp(newState.sanity + sanDelta, 0, newState.maxSanity);
      newState.hp = clamp(newState.hp + hpDelta, 0, newState.maxHp);
      
      const details = joinMessages([
         formatDelta('カフェイン', cafDelta),
         formatDelta('SAN', sanDelta),
         formatDelta('HP', hpDelta)
      ], ', ');

      addLog(`${LOG_MESSAGES.caffeine_ingest}\n(${details})`, 'warning');
      timeAdvanced = false;
      break;
    }

    case ActionType.ASK_PROFESSOR: {
      // イベントシステムへ委譲。失敗時のデフォルト処理はイベント定義内にBadイベントとして含める
      newState = executeEvent(newState, 'action_professor', "教授室は留守のようだ。");
      // ランダム科目の学習効果補正（イベントEffectsで特定科目が指定されていない場合用）
      if (newState.relationships[RelationshipId.PROFESSOR] > state.relationships[RelationshipId.PROFESSOR]) {
          // 友好度が上がっていれば、ランダムに学習効果を付与（簡易的な実装）
          // 本来はGameEventのEffectで完結させるのが望ましいが、科目ランダム性を維持するためここに残す
          const subIds = Object.values(SubjectId);
          const target = subIds[Math.floor(Math.random() * subIds.length)];
          newState.knowledge[target] = clamp(newState.knowledge[target] + 5, 0, 100);
          // ログは別途出す必要はないが、わかりやすくするためにはイベントテキストを工夫する
      }
      break;
    }

    case ActionType.ASK_SENIOR: {
      newState = executeEvent(newState, 'action_senior', "先輩は見当たらなかった。");
      break;
    }

    case ActionType.RELY_FRIEND: {
      newState = executeEvent(newState, 'action_friend', "友人は忙しいようだ。");
      break;
    }

    case ActionType.USE_ITEM: {
      const itemId = action.payload;
      if ((newState.inventory[itemId] || 0) > 0) {
        newState.inventory[itemId] = (newState.inventory[itemId] || 0) - 1;
        timeAdvanced = false;
        let details = "";
        let baseLog = "";
        let logType: LogEntry['type'] = 'info';

        switch (itemId) {
          case ItemId.HIGH_CACAO_CHOCO: {
            const hpDelta = 10;
            const sanDelta = 10;
            const cafDelta = -10;
            newState.hp = clamp(newState.hp + hpDelta, 0, newState.maxHp);
            newState.sanity = clamp(newState.sanity + sanDelta, 0, newState.maxSanity);
            newState.caffeine = clamp(newState.caffeine + cafDelta, 0, 200);
            baseLog = `【アイテム使用】${ITEMS[itemId].name}を食べた。苦味が染みる。`;
            logType = 'success';
            details = joinMessages([formatDelta('HP', hpDelta), formatDelta('SAN', sanDelta), formatDelta('カフェイン', cafDelta)], ', ');
            break;
          }
          case ItemId.SMART_DRUG: {
            const sanDelta = 40;
            const hpDelta = -15;
            const cafDelta = 50;
            newState.sanity = clamp(newState.sanity + sanDelta, 0, newState.maxSanity);
            newState.hp = clamp(newState.hp + hpDelta, 0, newState.maxHp);
            newState.caffeine = clamp(newState.caffeine + cafDelta, 0, 200);
            baseLog = `【アイテム使用】${ITEMS[itemId].name}を飲んだ。視界がクリアになるが、動悸がする。`;
            logType = 'warning';
            details = joinMessages([formatDelta('SAN', sanDelta), formatDelta('HP', hpDelta), formatDelta('カフェイン', cafDelta)], ', ');
            break;
          }
          case ItemId.REFERENCE_BOOK: {
            const lowestSub = Object.values(SubjectId).reduce((a, b) => newState.knowledge[a] < newState.knowledge[b] ? a : b);
            const kDelta = 15;
            newState.knowledge[lowestSub] = clamp(newState.knowledge[lowestSub] + kDelta, 0, 100);
            baseLog = `【アイテム使用】${ITEMS[itemId].name}を読破。${SUBJECTS[lowestSub].name}の理解が深まった。`;
            logType = 'success';
            details = `${SUBJECTS[lowestSub].name}+${kDelta}`;
            break;
          }
          case ItemId.USB_MEMORY: {
             if (chance(70)) {
                const target = Object.values(SubjectId)[Math.floor(Math.random() * 4)];
                const kDelta = 20;
                newState.knowledge[target] = clamp(newState.knowledge[target] + kDelta, 0, 100);
                baseLog = `【アイテム解析】${ITEMS[itemId].name}から${SUBJECTS[target].name}の過去問を発掘！神はいた。`;
                logType = 'success';
                details = `${SUBJECTS[target].name}+${kDelta}`;
             } else {
                const sanDelta = -20;
                newState.sanity += sanDelta;
                baseLog = `【アイテム解析】${ITEMS[itemId].name}の中身は...ウィルスだった。PCが汚染された。`;
                logType = 'danger';
                details = formatDelta('SAN', sanDelta) || "";
             }
             break;
          }
        }
        addLog(`${baseLog}\n(${details})`, logType);
      }
      break;
    }
  }

  if (timeAdvanced) {
    const cafDecay = -15; 
    newState.caffeine = clamp(newState.caffeine + cafDecay, 0, 200);
    
    const { slot, isNextDay } = getNextTimeSlot(state.timeSlot);
    newState.timeSlot = slot;
    if (isNextDay) {
      newState.day += 1;
      addLog(`=== DAY ${newState.day} START ===`, 'system');
    }
    newState.turnCount += 1;

    // Record Stats History for Analytics
    newState.statsHistory = [
      ...newState.statsHistory,
      {
        hp: newState.hp,
        sanity: newState.sanity,
        caffeine: newState.caffeine,
        turn: newState.turnCount
      }
    ];

    // --- Random Event Trigger ---
    if (chance(RANDOM_EVENT_PROBABILITY)) {
       newState = executeEvent(newState, 'turn_end');
    }
  }

  if (newState.day > 7) {
    const allPassed = Object.values(newState.knowledge).every(score => score >= PASSING_SCORE);
    newState.status = allPassed ? GameStatus.VICTORY : GameStatus.FAILURE;
    if (newState.status === GameStatus.VICTORY) addLog(LOG_MESSAGES.victory, 'success');
    else addLog(LOG_MESSAGES.failure, 'danger');
  } else if (newState.hp <= 0) {
    newState.status = GameStatus.GAME_OVER_HP;
    addLog(LOG_MESSAGES.hp_gameover, 'danger');
  } else if (newState.sanity <= 0) {
    newState.status = GameStatus.GAME_OVER_SANITY;
    addLog(LOG_MESSAGES.madness_gameover, 'danger');
  }

  newState.logs = logs;
  return newState;
};
