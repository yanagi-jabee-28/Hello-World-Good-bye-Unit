
import { GameState, ActionType, GameAction, TimeSlot, GameStatus, SubjectId, RelationshipId, ItemId } from '../types';
import { LOG_MESSAGES } from '../data/events';
import { clamp, chance } from '../utils/common';
import { getNextTimeSlot } from './time';
import { executeEvent } from './eventManager';
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
  }
};

export const gameReducer = (state: GameState, action: GameAction): GameState => {
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
  
  let timeAdvanced = true;

  switch (action.type) {
    case ActionType.STUDY:
      newState = handleStudy(newState, action.payload);
      // 勉強すると狂気スタックがたまりやすい(SAN値が低い場合)
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
      newState.lastSocialTurn = newState.turnCount; // 更新
      break;
    case ActionType.ASK_SENIOR:
      newState = handleAskSenior(newState);
      newState.lastSocialTurn = newState.turnCount; // 更新
      break;
    case ActionType.RELY_FRIEND:
      newState = handleRelyFriend(newState);
      newState.lastSocialTurn = newState.turnCount; // 更新
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
    
    // 1. Sleep Debt Accumulation
    // REST以外のアクションで時間が進むと、わずかに負債がたまる
    // 特に深夜に行動すると負債が増えやすい
    if (action.type !== ActionType.REST) {
      let debtIncrease = 0.2; // Base
      if (newState.timeSlot === TimeSlot.LATE_NIGHT) {
        debtIncrease = 1.0; // 深夜活動は負債大
      }
      newState.flags.sleepDebt += debtIncrease;
    }

    // 2. Madness Reduction (REST or ESCAPISM heals madness)
    if (action.type === ActionType.REST || action.type === ActionType.ESCAPISM) {
        if (newState.flags.madnessStack > 0) {
             newState.flags.madnessStack = Math.max(0, newState.flags.madnessStack - 1);
        }
    }

    // 3. Caffeine Dependence
    // カフェイン中毒状態で一定期間過ごすと依存症フラグ
    if (newState.caffeine >= CAFFEINE_THRESHOLDS.TOXICITY) {
       if (chance(10)) newState.flags.caffeineDependent = true;
    }

    // --- End Hidden Mechanics ---

    // Buff Effects
    newState.activeBuffs.forEach(buff => {
      if (buff.type === 'SANITY_DRAIN') {
         newState.sanity = clamp(newState.sanity - buff.value, 0, newState.maxSanity);
      }
    });

    // Clean up buffs
    newState.activeBuffs = newState.activeBuffs
      .map(b => ({ ...b, duration: b.duration - 1 }))
      .filter(b => b.duration > 0);

    // Caffeine Decay logic
    newState.caffeine = clamp(newState.caffeine - CAFFEINE_DECAY, 0, 200);
    
    // Slip Damage from High Caffeine
    if (newState.caffeine >= CAFFEINE_THRESHOLDS.ZONE) {
       const isOverdose = newState.caffeine >= CAFFEINE_THRESHOLDS.TOXICITY;
       const toxicHp = isOverdose ? 12 : 3; 
       const toxicSan = isOverdose ? 6 : 1; 
       
       newState.hp = clamp(newState.hp - toxicHp, 0, newState.maxHp);
       newState.sanity = clamp(newState.sanity - toxicSan, 0, newState.maxSanity);
    }

    // --- 孤独システム (Isolation Logic) ---
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
