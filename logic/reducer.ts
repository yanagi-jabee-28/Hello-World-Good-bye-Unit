import { GameState, ActionType, GameAction, TimeSlot, GameStatus, SubjectId, LogEntry, ItemId, RelationshipId } from '../types';
import { SUBJECTS, PASSING_SCORE } from '../data/subjects';
import { LOG_MESSAGES, RANDOM_EVENTS } from '../data/events';
import { ITEMS } from '../data/items';
import { clamp, chance, formatDelta, joinMessages } from '../utils/common';
import { getNextTimeSlot } from './time';

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

const EVENT_HISTORY_LIMIT = 4; // 直近4つのイベントを記憶して重複を防ぐ
const EVENT_PROBABILITY = 30; // イベント発生確率(%) - カオス度アップ

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
};

export const gameReducer = (state: GameState, action: GameAction): GameState => {
  if (action.type === ActionType.RESTART) {
    // 学力引き継ぎロジック (50%継承)
    const inheritedKnowledge = { ...INIT_KNOWLEDGE };
    let inherited = false;
    
    // 前回の学力がある場合、半分を引き継ぐ
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
      eventHistory: [],
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
      let friendRelDelta = 0;
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
        friendRelDelta = 2;
        sanityRecov += 5;
        baseLog = "【ランチ】友人と学食で無駄話をしてリフレッシュした。";
        logType = 'success';
      } else {
        baseLog = LOG_MESSAGES.rest_short;
      }

      newState.hp = clamp(newState.hp + hpRecov, 0, newState.maxHp);
      newState.sanity = clamp(newState.sanity + sanityRecov, 0, newState.maxSanity);
      newState.caffeine = clamp(newState.caffeine + caffeineDrop, 0, 200);
      if (friendRelDelta) newState.relationships[RelationshipId.FRIEND] = clamp(newState.relationships[RelationshipId.FRIEND] + friendRelDelta, 0, 100);

      const details = joinMessages([
        formatDelta('HP', hpRecov),
        formatDelta('SAN', sanityRecov),
        formatDelta('カフェイン', caffeineDrop),
        formatDelta('友人友好度', friendRelDelta)
      ], ', ');

      addLog(`${baseLog}\n(${details})`, logType);
      break;
    }

    case ActionType.ESCAPISM: {
      const sanDelta = 25;
      const hpDelta = -5;
      const friendRelDelta = 5;
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
      newState.relationships[RelationshipId.FRIEND] = clamp(newState.relationships[RelationshipId.FRIEND] + friendRelDelta, 0, 100);
      if (profRelDelta) newState.relationships[RelationshipId.PROFESSOR] = clamp(newState.relationships[RelationshipId.PROFESSOR] + profRelDelta, 0, 100);

      const details = joinMessages([
        formatDelta('SAN', sanDelta),
        formatDelta('HP', hpDelta),
        formatDelta('友人友好度', friendRelDelta),
        formatDelta('教授友好度', profRelDelta)
      ], ', ');

      addLog(`${baseLog}\n(${details})`, logType);
      break;
    }

    case ActionType.CONSUME_CAFFEINE: {
      const cafDelta = 50;
      const sanDelta = -10; // SANは減る
      const hpDelta = 10;   // HPは増える(元気の前借り)
      
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
      const hpDelta = -5;
      let profRelDelta = 0;
      let knowledgeDelta = 0;
      let subjectName = "";
      let baseLog = "";
      let logType: LogEntry['type'] = 'info';

      const successChance = 40 + (newState.relationships[RelationshipId.PROFESSOR] / 2);
      
      if (chance(successChance)) {
         const subIds = Object.values(SubjectId);
         const target = subIds[Math.floor(Math.random() * subIds.length)];
         subjectName = SUBJECTS[target].name;
         
         knowledgeDelta = 10;
         profRelDelta = 10;
         
         newState.knowledge[target] = clamp(newState.knowledge[target] + knowledgeDelta, 0, 100);
         baseLog = LOG_MESSAGES.prof_success;
         logType = 'success';
      } else {
         profRelDelta = 2;
         baseLog = LOG_MESSAGES.prof_fail;
         logType = 'warning';
      }
      
      newState.relationships[RelationshipId.PROFESSOR] = clamp(newState.relationships[RelationshipId.PROFESSOR] + profRelDelta, 0, 100);
      newState.hp = clamp(newState.hp + hpDelta, 0, newState.maxHp);

      const details = joinMessages([
        formatDelta('HP', hpDelta),
        formatDelta('教授友好度', profRelDelta),
        knowledgeDelta > 0 ? `${subjectName}+${knowledgeDelta}` : null
      ], ', ');

      addLog(`${baseLog}\n(${details})`, logType);
      break;
    }

    case ActionType.ASK_SENIOR: {
      const hpDelta = -5;
      let seniorRelDelta = 0;
      let knowledgeDelta = 0;
      let subjectName = "";
      let itemGained = null;
      let baseLog = "";
      let logType: LogEntry['type'] = 'info';

      const successChance = 50 + (newState.relationships[RelationshipId.SENIOR] / 2);
      
      if (chance(successChance)) {
        const subIds = Object.values(SubjectId);
        const target = subIds[Math.floor(Math.random() * subIds.length)];
        subjectName = SUBJECTS[target].name;
        
        knowledgeDelta = 5;
        seniorRelDelta = 10;
        newState.knowledge[target] = clamp(newState.knowledge[target] + knowledgeDelta, 0, 100);
        baseLog = LOG_MESSAGES.senior_success;
        logType = 'success';
        
        if (chance(30)) {
           const items = [ItemId.HIGH_CACAO_CHOCO, ItemId.REFERENCE_BOOK, ItemId.USB_MEMORY];
           const item = items[Math.floor(Math.random() * items.length)];
           newState.inventory = {
             ...newState.inventory,
             [item]: (newState.inventory[item] || 0) + 1
           };
           itemGained = ITEMS[item].name;
        }
      } else {
        baseLog = LOG_MESSAGES.senior_busy;
      }
      
      newState.relationships[RelationshipId.SENIOR] = clamp(newState.relationships[RelationshipId.SENIOR] + seniorRelDelta, 0, 100);
      newState.hp = clamp(newState.hp + hpDelta, 0, newState.maxHp);

      const details = joinMessages([
        formatDelta('HP', hpDelta),
        formatDelta('先輩友好度', seniorRelDelta),
        knowledgeDelta > 0 ? `${subjectName}+${knowledgeDelta}` : null,
        itemGained ? `アイテム入手: ${itemGained}` : null
      ], ', ');

      addLog(details ? `${baseLog}\n(${details})` : baseLog, logType);
      break;
    }

    case ActionType.RELY_FRIEND: {
      let sanDelta = 0;
      let friendRelDelta = 10;
      let hpDelta = 0;
      let knowledgeDelta = 0;
      let subjectName = "";
      let baseLog = "";
      let logType: LogEntry['type'] = 'info';

      newState.relationships[RelationshipId.FRIEND] = clamp(newState.relationships[RelationshipId.FRIEND] + friendRelDelta, 0, 100);

      if (chance(50)) {
        sanDelta = 15;
        const subIds = Object.values(SubjectId);
        const target = subIds[Math.floor(Math.random() * subIds.length)];
        subjectName = SUBJECTS[target].name;
        knowledgeDelta = 5;
        
        newState.knowledge[target] = clamp(newState.knowledge[target] + knowledgeDelta, 0, 100);
        baseLog = LOG_MESSAGES.friend_share;
        logType = 'success';
      } else {
        sanDelta = 15;
        hpDelta = -5;
        baseLog = LOG_MESSAGES.friend_play;
        logType = 'warning';
      }
      
      newState.sanity = clamp(newState.sanity + sanDelta, 0, newState.maxSanity);
      newState.hp = clamp(newState.hp + hpDelta, 0, newState.maxHp);

      const details = joinMessages([
        formatDelta('SAN', sanDelta),
        formatDelta('HP', hpDelta),
        formatDelta('友人友好度', friendRelDelta),
        knowledgeDelta > 0 ? `${subjectName}+${knowledgeDelta}` : null
      ], ', ');

      addLog(`${baseLog}\n(${details})`, logType);
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

    // --- Logic for Random Events with Weighted Probability ---
    if (chance(EVENT_PROBABILITY)) {
      const currentAvgKnowledge = Object.values(newState.knowledge).reduce((a, b) => a + b, 0) / 4;
      const history = newState.eventHistory || [];
      
      // Status flags for crisis detection
      const isLowHp = newState.hp < 40;
      const isLowSanity = newState.sanity < 40;
      const isCrisis = isLowHp || isLowSanity;
      const isLowScore = currentAvgKnowledge < 60; // 赤点危機
      const isCaffeinated = newState.caffeine > 50;

      // 1. Filter possible events by TimeSlot, Score, History
      const validEvents = RANDOM_EVENTS.filter(e => {
        const isTimeValid = !e.allowedTimeSlots || e.allowedTimeSlots.includes(newState.timeSlot);
        const isMinScoreValid = e.minAvgScore === undefined || currentAvgKnowledge >= e.minAvgScore;
        const isMaxScoreValid = e.maxAvgScore === undefined || currentAvgKnowledge <= e.maxAvgScore;
        const isNotDuplicate = !history.includes(e.id);
        return isTimeValid && isMinScoreValid && isMaxScoreValid && isNotDuplicate;
      });

      // 2. Calculate Weight for each event
      const weightedPool = validEvents.map(evt => {
        let weight = 10; // Base weight

        // Crisis Recovery Boost
        if (isCrisis && evt.category === 'health_recovery') {
          weight += 40; // Greatly increase chance of recovery items/events
        }

        // Study Catch-up Boost
        if (isLowScore && evt.category === 'study_boost') {
          weight += 50; // Greatly increase chance of study helpers
        }
        
        // Caffeine Blocks Drowsiness
        if (isCaffeinated && evt.category === 'drowsiness') {
          weight = 0; // Completely block drowsiness events
        } else if (evt.category === 'drowsiness') {
           // Increase drowsiness chance if NOT caffeinated at night/afternoon
           if (newState.timeSlot === TimeSlot.NIGHT || newState.timeSlot === TimeSlot.AFTERNOON) {
              weight += 20;
           }
        }

        return { evt, weight };
      }).filter(item => item.weight > 0);

      // 3. Weighted Selection
      const totalWeight = weightedPool.reduce((sum, item) => sum + item.weight, 0);
      
      if (totalWeight > 0) {
        let randomVal = Math.random() * totalWeight;
        let selectedEvent = null;
        
        for (const item of weightedPool) {
          randomVal -= item.weight;
          if (randomVal <= 0) {
            selectedEvent = item.evt;
            break;
          }
        }
        
        // Fallback just in case
        if (!selectedEvent && weightedPool.length > 0) selectedEvent = weightedPool[0].evt;

        if (selectedEvent) {
          const evt = selectedEvent;
          // Update history
          newState.eventHistory = [evt.id, ...history].slice(0, EVENT_HISTORY_LIMIT);

          const messages = [];
          if (evt.effect) {
            if (evt.effect.hp) {
               newState.hp = clamp(newState.hp + evt.effect.hp, 0, newState.maxHp);
               messages.push(formatDelta('HP', evt.effect.hp));
            }
            if (evt.effect.sanity) {
               newState.sanity = clamp(newState.sanity + evt.effect.sanity, 0, newState.maxSanity);
               messages.push(formatDelta('SAN', evt.effect.sanity));
            }
            if (evt.effect.caffeine) {
               newState.caffeine = clamp(newState.caffeine + evt.effect.caffeine, 0, 200);
               messages.push(formatDelta('カフェイン', evt.effect.caffeine));
            }
            if (evt.effect.knowledge) {
               Object.entries(evt.effect.knowledge).forEach(([subjId, delta]) => {
                  const sId = subjId as SubjectId;
                  const val = delta as number;
                  newState.knowledge[sId] = clamp(newState.knowledge[sId] + (val || 0), 0, 100);
                  messages.push(formatDelta(SUBJECTS[sId].name, val || 0));
               });
            }
            if (evt.effect.relationships) {
               Object.entries(evt.effect.relationships).forEach(([relId, delta]) => {
                  const rId = relId as RelationshipId;
                  const val = delta as number;
                  newState.relationships[rId] = clamp(newState.relationships[rId] + (val || 0), 0, 100);
                  const label = rId === RelationshipId.PROFESSOR ? '教授' : rId === RelationshipId.SENIOR ? '先輩' : '友人';
                  messages.push(formatDelta(`${label}友好度`, val || 0));
               });
            }
            if (evt.effect.inventory) {
               // Implement inventory changes if any event uses it
            }
          }
          
          const logType = evt.type === 'good' ? 'success' : evt.type === 'bad' ? 'danger' : 'info';
          const details = joinMessages(messages, ', ');
          addLog(details ? `${evt.text}\n(${details})` : evt.text, logType);
        }
      }
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