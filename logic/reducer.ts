
import { GameState, ActionType, GameAction, TimeSlot, GameStatus, SubjectId, RelationshipId, ItemId } from '../types';
import { LOG_MESSAGES } from '../data/events';
import { clamp, chance } from '../utils/common';
import { getNextTimeSlot } from './time';
import { executeEvent } from './eventManager';
import { pushLog } from './stateHelpers';

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

const RANDOM_EVENT_PROBABILITY = 30;

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
  eventHistory: [],
  eventStats: {},
  statsHistory: [],
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
  
  let timeAdvanced = true;

  switch (action.type) {
    case ActionType.STUDY:
      newState = handleStudy(newState, action.payload);
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
      break;
    case ActionType.ASK_SENIOR:
      newState = handleAskSenior(newState);
      break;
    case ActionType.RELY_FRIEND:
      newState = handleRelyFriend(newState);
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
    const cafDecay = -8; 
    newState.caffeine = clamp(newState.caffeine + cafDecay, 0, 200);
    
    // Project Melting Brain: Toxic Slip Damage from High Caffeine
    // The "Zone" comes with a price.
    if (newState.caffeine >= 120) {
       const isOverdose = newState.caffeine >= 180;
       const toxicHp = isOverdose ? 15 : 5;
       const toxicSan = isOverdose ? 15 : 5;
       
       newState.hp = clamp(newState.hp - toxicHp, 0, newState.maxHp);
       newState.sanity = clamp(newState.sanity - toxicSan, 0, newState.maxSanity);
       
       // ログには出さないが、プレイヤーはHP/SANの減少で気づく設計
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

    if (chance(RANDOM_EVENT_PROBABILITY)) {
       newState = executeEvent(newState, 'turn_end');
    }
  }

  // Check Game Over Conditions
  if (newState.day > 7) {
    const allPassed = Object.values(newState.knowledge).every(score => score >= 60);
    newState.status = allPassed ? GameStatus.VICTORY : GameStatus.FAILURE;
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
