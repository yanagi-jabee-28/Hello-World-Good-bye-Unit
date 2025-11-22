
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
  MINERAL_WATER = 'MINERAL_WATER', // New: Decaf / HP small
  BLACK_COFFEE = 'BLACK_COFFEE',
  GUMMY_CANDY = 'GUMMY_CANDY', // New: Sanity small
  PROTEIN_BAR = 'PROTEIN_BAR', // New: HP medium
  HIGH_CACAO_CHOCO = 'HIGH_CACAO_CHOCO',
  CAFE_LATTE = 'CAFE_LATTE',
  ENERGY_DRINK = 'ENERGY_DRINK',
  HERBAL_TEA = 'HERBAL_TEA', // New: Decaf large / Sanity medium
  CUP_RAMEN = 'CUP_RAMEN',
  HOT_EYE_MASK = 'HOT_EYE_MASK',
  EARPLUGS = 'EARPLUGS',
  REFERENCE_BOOK = 'REFERENCE_BOOK',
  GAMING_SUPPLEMENT = 'GAMING_SUPPLEMENT',
  SMART_DRUG = 'SMART_DRUG',
  GIFT_SWEETS = 'GIFT_SWEETS',
}

// New Buff System
export type BuffType = 'STUDY_EFFICIENCY' | 'REST_EFFICIENCY' | 'SANITY_DRAIN';

export interface Buff {
  id: string;
  name: string;
  type: BuffType;
  duration: number; // 残りターン数
  value: number; // 倍率や固定値
  description: string;
}

export interface ItemEffects {
  hp?: number;
  sanity?: number;
  caffeine?: number;
  knowledge?: number; // 汎用的な学力アップの場合
  buffs?: Omit<Buff, 'id'>[]; // IDは使用時に生成
}

export interface Item {
  id: ItemId;
  name: string;
  description: string;
  price: number;
  // データ駆動用パラメータ
  effects?: ItemEffects;
  // ロジック側で特殊処理が必要な場合の補助テキスト（自動生成できない部分用）
  specialEffectDescription?: string;
}

export interface StatsSnapshot {
  hp: number;
  sanity: number;
  caffeine: number;
  turn: number;
  money: number;
}

export interface EventStats {
  count: number;
  lastTurn: number;
}

export interface GameFlags {
  sleepDebt: number;       // 睡眠負債 (0-5+)
  lastSleepQuality: number;// 前回の睡眠の質 (0.5-1.0)
  caffeineDependent: boolean; // カフェイン依存症フラグ
  hasPastPapers: boolean;  // 過去問入手フラグ
  madnessStack: number;    // 狂気スタック (0-4)
  examRisk: boolean;       // 最終日無理をしたか
}

export interface GameState {
  day: number;
  timeSlot: TimeSlot;
  money: number; // JPY
  hp: number; // Max 100
  maxHp: number;
  sanity: number; // Max 100
  maxSanity: number;
  caffeine: number; // Max 200 (Overdose > 100)
  knowledge: Record<SubjectId, number>; // 0 - 100
  relationships: Record<RelationshipId, number>; // 0 - 100
  inventory: Partial<Record<ItemId, number>>;
  activeBuffs: Buff[]; // New
  logs: LogEntry[];
  status: GameStatus;
  turnCount: number;
  lastSocialTurn: number; // 最後に社会的行動をとったターン
  eventHistory: string[]; // 直近のイベントID（UI表示用など）
  eventStats: Record<string, EventStats>; // イベントごとの発生統計（ロジック制御用）
  statsHistory: StatsSnapshot[]; // 履歴データ
  flags: GameFlags; // Hidden mechanics flags
  pendingEvent: GameEvent | null; // 選択待ちのイベント
}

export enum ActionType {
  STUDY = 'STUDY',
  REST = 'REST',
  ESCAPISM = 'ESCAPISM',
  ASK_SENIOR = 'ASK_SENIOR',
  ASK_PROFESSOR = 'ASK_PROFESSOR',
  RELY_FRIEND = 'RELY_FRIEND',
  USE_ITEM = 'USE_ITEM',
  RESTART = 'RESTART',
  WORK = 'WORK',
  BUY_ITEM = 'BUY_ITEM',
  RESOLVE_EVENT = 'RESOLVE_EVENT', // イベントの選択肢を決定
  LOAD_STATE = 'LOAD_STATE', // New: セーブデータロード用
}

// Discriminated Union for strict typing
export type GameAction =
  | { type: ActionType.STUDY; payload: SubjectId }
  | { type: ActionType.REST }
  | { type: ActionType.ESCAPISM }
  | { type: ActionType.ASK_PROFESSOR }
  | { type: ActionType.ASK_SENIOR }
  | { type: ActionType.RELY_FRIEND }
  | { type: ActionType.USE_ITEM; payload: ItemId }
  | { type: ActionType.RESTART }
  | { type: ActionType.WORK }
  | { type: ActionType.BUY_ITEM; payload: ItemId }
  | { type: ActionType.RESOLVE_EVENT; payload: { optionId: string } }
  | { type: ActionType.LOAD_STATE; payload: GameState }; // New

export interface GameEventEffect {
  hp?: number;
  sanity?: number;
  knowledge?: Partial<Record<SubjectId, number>>;
  relationships?: Partial<Record<RelationshipId, number>>;
  caffeine?: number;
  inventory?: Partial<Record<ItemId, number>>;
  money?: number;
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
  itemRequired?: ItemId[];
}

export interface GameEventOption {
  id: string;
  label: string;
  description?: string; // ボタン下の補足
  risk: 'safe' | 'low' | 'high'; // リスクレベル表示
  successRate: number; // 0-100
  conditions?: GameEventCondition; // 選択条件（アイテム必須など）
  successEffect: GameEventEffect;
  successLog: string;
  failureEffect?: GameEventEffect;
  failureLog?: string;
}

export interface GameEvent {
  id: string;
  trigger: EventTriggerType;
  text: string;
  type: 'good' | 'bad' | 'flavor' | 'mixed';
  category?: string; // グルーピング用（flavor, tech_troubleなど）
  conditions?: GameEventCondition;
  effect?: GameEventEffect; // 即時効果（または選択肢が出る前の導入効果）
  options?: GameEventOption[]; // 選択肢（ある場合はこれが優先され、ユーザー選択待ちになる）
  weight: number; // 基本発生確率の重み (1-100程度)
  coolDownTurns?: number; // 再発生までの最低ターン数
  maxOccurrences?: number; // ゲーム中最大発生回数 (undefinedなら無限)
  decay?: number; // 発生するたびに重みを減らす割合 (0.5なら次回確率半減)
}
