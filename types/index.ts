
export enum SubjectId {
  MATH = 'MATH',
  ALGO = 'ALGO',
  CIRCUIT = 'CIRCUIT',
  HUMANITIES = 'HUMANITIES',
}

export enum TimeSlot {
  MORNING = '朝',
  AM = '午前',
  NOON = '昼',
  AFTERNOON = '午後',
  AFTER_SCHOOL = '放課後',
  NIGHT = '夜',
  LATE_NIGHT = '深夜',
}

export enum RelationshipId {
  PROFESSOR = 'PROFESSOR',
  SENIOR = 'SENIOR',
  FRIEND = 'FRIEND',
}

export enum GameStatus {
  PLAYING = 'PLAYING',
  GAME_OVER_HP = 'GAME_OVER_HP', // Hospitalized
  GAME_OVER_SANITY = 'GAME_OVER_SANITY', // Dropped out
  VICTORY = 'VICTORY', // Passed exams
  FAILURE = 'FAILURE', // Failed exams
}

export interface Subject {
  id: SubjectId;
  name: string;
  description: string;
  difficulty: number; // 1.0 - 2.0 multiplier for difficulty
}

export interface LogEntry {
  id: string;
  text: string;
  type: 'info' | 'success' | 'warning' | 'danger' | 'system';
  timestamp: string;
}

export enum ItemId {
  USB_MEMORY = 'USB_MEMORY',
  HIGH_CACAO_CHOCO = 'HIGH_CACAO_CHOCO',
  REFERENCE_BOOK = 'REFERENCE_BOOK',
  SMART_DRUG = 'SMART_DRUG',
}

export interface Item {
  id: ItemId;
  name: string;
  description: string;
  effectDescription: string;
}

export interface GameState {
  day: number;
  timeSlot: TimeSlot;
  hp: number; // Max 100
  maxHp: number;
  sanity: number; // Max 100
  maxSanity: number;
  caffeine: number; // Max 200 (Overdose > 100)
  knowledge: Record<SubjectId, number>; // 0 - 100
  relationships: Record<RelationshipId, number>; // 0 - 100
  inventory: Partial<Record<ItemId, number>>;
  logs: LogEntry[];
  status: GameStatus;
  turnCount: number;
  eventHistory: string[]; // 直近のイベントIDを保持して重複を防ぐ
}

export enum ActionType {
  STUDY = 'STUDY',
  REST = 'REST',
  ESCAPISM = 'ESCAPISM',
  CONSUME_CAFFEINE = 'CONSUME_CAFFEINE',
  ASK_SENIOR = 'ASK_SENIOR',
  ASK_PROFESSOR = 'ASK_PROFESSOR',
  RELY_FRIEND = 'RELY_FRIEND',
  USE_ITEM = 'USE_ITEM',
  RESTART = 'RESTART',
}

// Discriminated Union for strict typing
export type GameAction =
  | { type: ActionType.STUDY; payload: SubjectId }
  | { type: ActionType.REST }
  | { type: ActionType.ESCAPISM }
  | { type: ActionType.CONSUME_CAFFEINE }
  | { type: ActionType.ASK_PROFESSOR }
  | { type: ActionType.ASK_SENIOR }
  | { type: ActionType.RELY_FRIEND }
  | { type: ActionType.USE_ITEM; payload: ItemId }
  | { type: ActionType.RESTART };

export interface RandomEventEffect {
  hp?: number;
  sanity?: number;
  knowledge?: Partial<Record<SubjectId, number>>;
  relationships?: Partial<Record<RelationshipId, number>>;
  caffeine?: number;
  inventory?: Partial<Record<ItemId, number>>;
}

export type EventCategory = 
  | 'health_recovery' // 体力・SAN回復（ピンチ時に出やすい）
  | 'study_boost'     // 学力アップ（赤点時に出やすい）
  | 'drowsiness'      // 睡魔・集中力低下（カフェインで防げる）
  | 'tech_trouble'    // 技術的トラブル（不運）
  | 'social'          // 人間関係
  | 'flavor'          // その他・雰囲気
  | 'item_get';       // アイテム入手

export interface RandomEvent {
  id: string;
  text: string;
  type: 'good' | 'bad' | 'flavor';
  category: EventCategory; // ロジック制御用カテゴリ
  effect?: RandomEventEffect;
  allowedTimeSlots?: TimeSlot[];
  minAvgScore?: number; // イベント発生に必要な最低平均点
  maxAvgScore?: number; // イベント発生に必要な最高平均点
}
