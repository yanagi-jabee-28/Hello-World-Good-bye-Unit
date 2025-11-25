
import { GameState, ActionType, GameAction, TimeSlot, GameStatus, SubjectId, RelationshipId, ItemId, GameEventEffect } from '../types';
import { LOG_MESSAGES } from '../data/events';
import { clamp, chance, joinMessages, formatDelta } from '../utils/common';
import { getNextTimeSlot } from './time';
import { executeEvent, applyEventEffect } from './eventManager';
import { SUBJECTS } from '../data/subjects';
import { ITEMS } from '../data/items';
import { pushLog } from './stateHelpers';
import { CAFFEINE_DECAY, CAFFEINE_THRESHOLDS, EVENT_CONSTANTS } from '../config/gameConstants';
import { evaluateExam } from './examEvaluation';

// Handlers
import { handleStudy } from './handlers/study';
import { handleRest, handleEscapism } from './handlers/rest';
import { handleWork } from './handlers/work';
import { handleAskProfessor, handleAskSenior, handleRelyFriend } from './handlers/social';
import { handleBuyItem, handleUseItem } from './handlers/items';

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

export const INITIAL_STATE: GameState = {
  day: 1,
  timeSlot: TimeSlot.MORNING,
  money: 2000, 
  hp: 100,
  maxHp: 100,
  sanity: 100,
  maxSanity: 100,
  caffeine: 0,
  knowledge: { ...INIT_KNOWLEDGE },
  relationships: { ...INIT_RELATIONSHIPS },
  inventory: {
    [ItemId.BLACK_COFFEE]: 1,
    [ItemId.CAFE_LATTE]: 0,
    [ItemId.HIGH_CACAO_CHOCO]: 1,
    [ItemId.HOT_EYE_MASK]: 0,
  },
  activeBuffs: [],
  logs: [{
    id: 'init',
    text: LOG_MESSAGES.start,
    type: 'system',
    timestamp: 'DAY 1 08:00'
  }],
  status: GameStatus.PLAYING,
  turnCount: 0,
  lastSocialTurn: 0,
  eventHistory: [],
  eventStats: {},
  statsHistory: [],
  flags: {
    sleepDebt: 0,
    lastSleepQuality: 1.0,
    caffeineDependent: false,
    hasPastPapers: false,
    madnessStack: 0,
    examRisk: false,
  },
  pendingEvent: null,
};

const RELATIONSHIP_NAMES: Record<RelationshipId, string> = {
  [RelationshipId.PROFESSOR]: '教授友好度',
  [RelationshipId.SENIOR]: '先輩友好度',
  [RelationshipId.FRIEND]: '友人友好度',
};

// Helper to process effect and create log string
const processEffect = (state: GameState, effect: GameEventEffect): string[] => {
  const messages: string[] = [];
  
  if (effect.hp) {
    state.hp = clamp(state.hp + effect.hp, 0, state.maxHp);
    messages.push(formatDelta('HP', effect.hp) || '');
  }
  if (effect.sanity) {
    state.sanity = clamp(state.sanity + effect.sanity, 0, state.maxSanity);
    messages.push(formatDelta('SAN', effect.sanity) || '');
  }
  if (effect.caffeine) {
    state.caffeine = clamp(state.caffeine + effect.caffeine, 0, 200);
    messages.push(formatDelta('カフェイン', effect.caffeine) || '');
  }
  if (effect.knowledge) {
    Object.entries(effect.knowledge).forEach(([key, val]) => {
      if (val) {
        const sId = key as SubjectId;
        state.knowledge[sId] = clamp(state.knowledge[sId] + val, 0, 100);
        const subjectName = SUBJECTS[sId].name;
        messages.push(formatDelta(subjectName, val) || '');
      }
    });
  }
  if (effect.relationships) {
    Object.entries(effect.relationships).forEach(([key, val]) => {
      if (val) {
        const rId = key as RelationshipId;
        state.relationships[rId] = clamp(state.relationships[rId] + val, 0, 100);
        const relName = RELATIONSHIP_NAMES[rId];
        messages.push(formatDelta(relName, val) || '');
      }
    });
  }
  if (effect.inventory) {
    Object.entries(effect.inventory).forEach(([key, val]) => {
      if (val) {
        const iId = key as ItemId;
        const current = state.inventory[iId] || 0;
        state.inventory[iId] = current + val;
        const item = ITEMS[iId];
        messages.push(`${item.name}${val > 0 ? '入手' : '消費'}`);
      }
    });
  }
  if (effect.money) {
    const actualChange = state.money + effect.money < 0 ? -state.money : effect.money;
    state.money += actualChange;
    messages.push(`資金${actualChange > 0 ? '+' : ''}¥${actualChange.toLocaleString()}`);
  }

  return messages.filter(m => m !== '');
};

export const gameReducer = (state: GameState, action: GameAction): GameState => {
  // セーブデータのロード
  if (action.type === ActionType.LOAD_STATE) {
    // ロードされたステートをそのまま適用するが、
    // バージョン違いなどでフィールドが足りない場合の保険としてINITIAL_STATEとマージする
    const loadedState = action.payload;
    return { 
      ...INITIAL_STATE, 
      ...loadedState,
      // ログもロードするが、システムメッセージを追加
      logs: [
        ...loadedState.logs,
        {
          id: Math.random().toString(36).substr(2, 9),
          text: "【SYSTEM】セーブデータをロードしました。",
          type: 'system',
          timestamp: `DAY ${loadedState.day} ${loadedState.timeSlot}`
        }
      ]
    };
  }

  // 完全リセット（Factory Reset）
  if (action.type === ActionType.FULL_RESET) {
    return {
      ...INITIAL_STATE,
      knowledge: { ...INIT_KNOWLEDGE },
      relationships: { ...INIT_RELATIONSHIPS },
      inventory: { ...INITIAL_STATE.inventory },
      // 完全に新しいログ
      logs: [{
        id: Math.random().toString(36).substr(2, 9),
        text: LOG_MESSAGES.start,
        type: 'system',
        timestamp: 'DAY 1 08:00'
      }],
      // 状態の完全初期化
      activeBuffs: [],
      eventHistory: [],
      eventStats: {},
      statsHistory: [],
      flags: {
        sleepDebt: 0,
        lastSleepQuality: 1.0,
        caffeineDependent: false,
        hasPastPapers: false,
        madnessStack: 0,
        examRisk: false,
      },
      pendingEvent: null
    };
  }

  // 強くてニューゲーム（手動ソフトリセット）
  if (action.type === ActionType.SOFT_RESET) {
    const inheritedKnowledge = { ...INIT_KNOWLEDGE };
    let inherited = false;
    
    (Object.keys(state.knowledge) as SubjectId[]).forEach((id) => {
      if (state.knowledge[id] > 0) {
        inheritedKnowledge[id] = Math.floor(state.knowledge[id] / 2);
        inherited = true;
      }
    });

    const resetLogText = inherited 
      ? `${LOG_MESSAGES.start}\n【強くてニューゲーム】現在の状態から学習データを50%継承し、DAY 1へループしました。`
      : LOG_MESSAGES.start;

    return {
      ...INITIAL_STATE,
      knowledge: inheritedKnowledge,
      relationships: { ...INIT_RELATIONSHIPS },
      inventory: { ...INITIAL_STATE.inventory },
      logs: [{
        id: Math.random().toString(36).substr(2, 9),
        text: resetLogText,
        type: 'system',
        timestamp: 'DAY 1 08:00'
      }],
      // フラグ等は初期化
      activeBuffs: [],
      eventHistory: [],
      eventStats: {},
      statsHistory: [],
      flags: {
        sleepDebt: 0,
        lastSleepQuality: 1.0,
        caffeineDependent: false,
        hasPastPapers: false,
        madnessStack: 0,
        examRisk: false,
      },
      pendingEvent: null
    };
  }

  // ニューゲーム（手動ハードリスタート）
  if (action.type === ActionType.HARD_RESTART) {
    return {
      ...INITIAL_STATE,
      knowledge: { ...INIT_KNOWLEDGE },
      relationships: { ...INIT_RELATIONSHIPS },
      inventory: { ...INITIAL_STATE.inventory },
      logs: [{
        id: Math.random().toString(36).substr(2, 9),
        text: `${LOG_MESSAGES.start}\n【再履修】周回を諦め、新たな気持ちでDAY 1から開始します。（継承なし）`,
        type: 'system',
        timestamp: 'DAY 1 08:00'
      }],
      // 状態の完全初期化
      activeBuffs: [],
      eventHistory: [],
      eventStats: {},
      statsHistory: [],
      flags: {
        sleepDebt: 0,
        lastSleepQuality: 1.0,
        caffeineDependent: false,
        hasPastPapers: false,
        madnessStack: 0,
        examRisk: false,
      },
      pendingEvent: null
    };
  }

  if (action.type === ActionType.RESTART) {
    const inheritedKnowledge = { ...INIT_KNOWLEDGE };
    let inherited = false;
    
    (Object.keys(state.knowledge) as SubjectId[]).forEach((id) => {
      if (state.knowledge[id] > 0) {
        inheritedKnowledge[id] = Math.floor(state.knowledge[id] / 2);
        inherited = true;
      }
    });

    const restartLogText = inherited 
      ? `${LOG_MESSAGES.start}\n【強くてニューゲーム】前回の学習データの50%を復元しました。`
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
  // Deep copy for mutability safety in handlers
  newState.knowledge = { ...state.knowledge };
  newState.relationships = { ...state.relationships };
  newState.inventory = { ...state.inventory };
  newState.eventStats = { ...state.eventStats };
  newState.activeBuffs = [...state.activeBuffs];
  newState.logs = [...state.logs];
  newState.flags = { ...state.flags };
  
  // 分岐イベント選択の処理
  if (action.type === ActionType.RESOLVE_EVENT) {
    const { optionId } = action.payload;
    const event = newState.pendingEvent;
    
    if (event && event.options) {
      const option = event.options.find(o => o.id === optionId);
      if (option) {
        // 成功判定
        const isSuccess = Math.random() * 100 < option.successRate;
        
        if (isSuccess) {
          // 成功時
          const effect = option.successEffect;
          const details = effect ? processEffect(newState, effect) : [];
          pushLog(newState, `${event.text}\n\n▶ 選択: ${option.label}\n${option.successLog}\n(${details.join(', ')})`, 'success');

          // Chain Trigger (ランダムイベント抽選へ)
          if (option.chainTrigger) {
             newState = executeEvent(newState, option.chainTrigger, "特に何も起きなかった...");
          }

        } else {
          // 失敗時
          const effect = option.failureEffect || option.successEffect; // 失敗効果がない場合は成功効果を使う（または何も起きない）
          const details = effect ? processEffect(newState, effect) : [];
          pushLog(newState, `${event.text}\n\n▶ 選択: ${option.label}\n${option.failureLog || "失敗..."}\n(${details.join(', ')})`, 'danger');
        }
      }
    }

    newState.pendingEvent = null;
    // イベント解決後は時間経過しない（イベント発生時に既に時間が進む処理の途中で止まっているか、あるいはイベント自体が時間を消費するかは設計によるが、
    // 現状の設計ではイベントはアクションの「結果」として発生するため、ここでは時間を進めない）
    return newState;
  }

  // pendingEventがある場合、他のアクションはブロックする（UI側で制御すべきだが念のため）
  if (newState.pendingEvent) {
    return state;
  }

  let timeAdvanced = true;

  switch (action.type) {
    case ActionType.STUDY:
      newState = handleStudy(newState, action.payload);
      if (newState.sanity < 30) {
        newState.flags.madnessStack = Math.min(4, newState.flags.madnessStack + 1);
      }
      break;
    case ActionType.REST:
      newState = handleRest(newState);
      break;
    case ActionType.WORK:
      newState = handleWork(newState);
      break;
    case ActionType.ESCAPISM:
      newState = handleEscapism(newState);
      break;
    case ActionType.ASK_PROFESSOR:
      newState = handleAskProfessor(newState);
      newState.lastSocialTurn = newState.turnCount; 
      break;
    case ActionType.ASK_SENIOR:
      newState = handleAskSenior(newState);
      newState.lastSocialTurn = newState.turnCount; 
      break;
    case ActionType.RELY_FRIEND:
      newState = handleRelyFriend(newState);
      newState.lastSocialTurn = newState.turnCount; 
      break;
    case ActionType.BUY_ITEM:
      newState = handleBuyItem(newState, action.payload);
      timeAdvanced = false;
      break;
    case ActionType.USE_ITEM:
      newState = handleUseItem(newState, action.payload);
      timeAdvanced = false;
      break;
  }

  if (timeAdvanced) {
    // --- Hidden Mechanics Update ---
    if (action.type !== ActionType.REST) {
      let debtIncrease = 0.2; // Base
      if (newState.timeSlot === TimeSlot.LATE_NIGHT) {
        debtIncrease = 1.0; // 深夜活動は負債大
      }
      newState.flags.sleepDebt += debtIncrease;
    }

    if (action.type === ActionType.REST || action.type === ActionType.ESCAPISM) {
        if (newState.flags.madnessStack > 0) {
             newState.flags.madnessStack = Math.max(0, newState.flags.madnessStack - 1);
        }
    }

    if (newState.caffeine >= CAFFEINE_THRESHOLDS.TOXICITY) {
       if (chance(10)) newState.flags.caffeineDependent = true;
    }

    newState.activeBuffs.forEach(buff => {
      if (buff.type === 'SANITY_DRAIN') {
         newState.sanity = clamp(newState.sanity - buff.value, 0, newState.maxSanity);
      }
    });

    newState.activeBuffs = newState.activeBuffs
      .map(b => ({ ...b, duration: b.duration - 1 }))
      .filter(b => b.duration > 0);

    newState.caffeine = clamp(newState.caffeine - CAFFEINE_DECAY, 0, 200);
    
    if (newState.caffeine >= CAFFEINE_THRESHOLDS.ZONE) {
       const isOverdose = newState.caffeine >= CAFFEINE_THRESHOLDS.TOXICITY;
       const toxicHp = isOverdose ? 12 : 3; 
       const toxicSan = isOverdose ? 6 : 1; 
       
       newState.hp = clamp(newState.hp - toxicHp, 0, newState.maxHp);
       newState.sanity = clamp(newState.sanity - toxicSan, 0, newState.maxSanity);
    }

    const turnsSinceSocial = newState.turnCount - newState.lastSocialTurn;
    if (turnsSinceSocial > EVENT_CONSTANTS.ISOLATION_THRESHOLD) {
      const lonelinessDmg = EVENT_CONSTANTS.ISOLATION_DAMAGE;
      newState.sanity = clamp(newState.sanity - lonelinessDmg, 0, newState.maxSanity);
      pushLog(newState, `【孤独】誰とも話さず${turnsSinceSocial}ターン経過。社会からの隔絶が精神を蝕む。(SAN-${lonelinessDmg})`, 'warning');
    }

    const { slot, isNextDay } = getNextTimeSlot(state.timeSlot);
    newState.timeSlot = slot;
    if (isNextDay) {
      newState.day += 1;
      pushLog(newState, `=== DAY ${newState.day} START ===`, 'system');
    }
    newState.turnCount += 1;

    newState.statsHistory = [
      ...newState.statsHistory,
      {
        hp: newState.hp,
        sanity: newState.sanity,
        caffeine: newState.caffeine,
        turn: newState.turnCount,
        money: newState.money
      }
    ];

    if (chance(EVENT_CONSTANTS.RANDOM_PROBABILITY)) {
       newState = executeEvent(newState, 'turn_end');
    }
  }

  // Check Game Over Conditions
  if (newState.day > 7) {
    const metrics = evaluateExam(newState);
    newState.status = metrics.passed ? GameStatus.VICTORY : GameStatus.FAILURE;
    if (newState.status === GameStatus.VICTORY) pushLog(newState, LOG_MESSAGES.victory, 'success');
    else pushLog(newState, LOG_MESSAGES.failure, 'danger');
  } else if (newState.hp <= 0) {
    newState.status = GameStatus.GAME_OVER_HP;
    pushLog(newState, LOG_MESSAGES.hp_gameover, 'danger');
  } else if (newState.sanity <= 0) {
    newState.status = GameStatus.GAME_OVER_SANITY;
    pushLog(newState, LOG_MESSAGES.madness_gameover, 'danger');
  }

  return newState;
};
