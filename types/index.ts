
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

export interface StatsSnapshot {
  hp: number;
  sanity: number;
  caffeine: number;
  turn: number;
}

export interface EventStats {
  count: number;
  lastTurn: number;
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
  eventHistory: string[]; // 直近のイベントID（UI表示用など）
  eventStats: Record<string, EventStats>; // イベントごとの発生統計（ロジック制御用）
  statsHistory: StatsSnapshot[]; // 履歴データ
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

export interface GameEventEffect {
  hp?: number;
  sanity?: number;
  knowledge?: Partial<Record<SubjectId, number>>;
  relationships?: Partial<Record<RelationshipId, number>>;
  caffeine?: number;
  inventory?: Partial<Record<ItemId, number>>;
}

export type EventTriggerType = 
  | 'turn_end'        // ターン終了時（ランダムイベント）
  | 'action_professor' // 教授コマンド実行時
  | 'action_senior'    // 先輩コマンド実行時
  | 'action_friend';   // 友人コマンド実行時

export interface GameEventCondition {
  minHp?: number;
  maxHp?: number;
  minSanity?: number;
  maxSanity?: number;
  minAvgScore?: number;
  maxAvgScore?: number;
  minRelationship?: number; // アクション対象の友好度（turn_endの場合は無視）
  maxRelationship?: number;
  caffeineMin?: number;
  caffeineMax?: number;
  timeSlots?: TimeSlot[];
}

export interface GameEvent {
  id: string;
  trigger: EventTriggerType;
  text: string;
  type: 'good' | 'bad' | 'flavor';
  category?: string; // グルーピング用（flavor, tech_troubleなど）
  conditions?: GameEventCondition;
  effect?: GameEventEffect;
  weight: number; // 基本発生確率の重み (1-100程度)
  coolDownTurns?: number; // 再発生までの最低ターン数
  maxOccurrences?: number; // ゲーム中最大発生回数 (undefinedなら無限)
  decay?: number; // 発生するたびに重みを減らす割合 (0.5なら次回確率半減)
}
