
import { GameState, TimeSlot, GameStatus, SubjectId, RelationshipId, ItemId } from '../types';
import { ACTION_LOGS } from '../data/constants/logMessages';

export const INIT_RELATIONSHIPS = {
  [RelationshipId.PROFESSOR]: 20,
  [RelationshipId.SENIOR]: 20,
  [RelationshipId.FRIEND]: 30,
};

export const INIT_KNOWLEDGE = {
  [SubjectId.MATH]: 0,
  [SubjectId.ALGO]: 0,
  [SubjectId.CIRCUIT]: 0,
  [SubjectId.HUMANITIES]: 0,
};

// 初期状態では全科目「勉強したて」扱いとする（開始早々の忘却を防ぐ）
export const INIT_LAST_STUDIED = {
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
  satiety: 20, // Reduced from 50 to 20 (Hungry start)
  maxSatiety: 100,
  knowledge: { ...INIT_KNOWLEDGE },
  lastStudied: { ...INIT_LAST_STUDIED },
  relationships: { ...INIT_RELATIONSHIPS },
  inventory: {
    [ItemId.BLACK_COFFEE]: 1,
    [ItemId.CAFE_LATTE]: 0,
    [ItemId.HIGH_CACAO_CHOCO]: 1,
    [ItemId.HOT_EYE_MASK]: 0,
    [ItemId.RICE_BALL]: 1, // Free starter food
  },
  activeBuffs: [],
  logs: [{
    id: 'init',
    text: ACTION_LOGS.START,
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
    hasPastPapers: 0, // Initialize as number
    madnessStack: 0,
    examRisk: false,
    studyAllUsedDay: 0,
    actionStreak: 0, // New
  },
  debugFlags: {
    showRisks: true,
    showDeathHints: true,
    logEventFlow: false,
    riskOverlay: false, // New: Default off
    riskDetail: false, // New: Default off
    riskPredictionMode: 'predictive', // Default to safer mode
  },
  pendingEvent: null,
  uiScale: 'normal', // Default UI scale
  risk: 0,
};
