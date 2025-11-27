
import { TimeSlot, GameStatus, SubjectId, RelationshipId, ItemId } from './enums';
import { Buff } from './assets';
import { GameEvent } from './event';

export interface LogEntry {
  id: string;
  text: string;
  type: 'info' | 'success' | 'warning' | 'danger' | 'system';
  timestamp: string;
}

export interface StatsSnapshot {
  hp: number;
  sanity: number;
  caffeine: number;
  satiety?: number;
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
  hasPastPapers: number;   // 過去問入手数 (Stackable)
  madnessStack: number;    // 狂気スタック (0-4)
  examRisk: boolean;       // 最終日無理をしたか
}

export type UiScale = 'compact' | 'normal' | 'large';

export interface GameState {
  day: number;
  timeSlot: TimeSlot;
  money: number; // JPY
  hp: number; // Max 100
  maxHp: number;
  sanity: number; // Max 100
  maxSanity: number;
  caffeine: number; // Max 200 (Overdose > 100)
  satiety: number; // 0-100 (Hunger metric)
  maxSatiety: number;
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
  uiScale: UiScale; // UIサイズ設定
}
