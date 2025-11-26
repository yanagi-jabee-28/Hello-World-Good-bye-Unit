
import { ActionType, SubjectId, ItemId, RelationshipId, TimeSlot } from './enums';
import { GameState, UiScale } from './state';
import { GameEventEffect } from './assets';

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
  | { type: ActionType.LOAD_STATE; payload: GameState }
  | { type: ActionType.FULL_RESET }
  | { type: ActionType.SOFT_RESET }
  | { type: ActionType.HARD_RESTART }
  | { type: ActionType.SET_UI_SCALE; payload: UiScale };

// Re-export for convenience if needed by other files
export type { GameEventEffect } from './assets';

export type EventTriggerType = 
  | 'turn_end'        // ターン終了時（ランダムイベント）
  | 'action_professor' // 教授コマンド実行時
  | 'action_senior'    // 先輩コマンド実行時
  | 'action_friend'    // 友人コマンド実行時
  | 'action_work';     // 仕事コマンド実行時

export type Persona = 'PROFESSOR' | 'SENIOR' | 'FRIEND' | 'SYSTEM' | 'PLAYER';

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
  minMoney?: number;
  minKnowledge?: Partial<Record<SubjectId, number>>;
}

export interface GameEventOption {
  id: string;
  label: string;
  description?: string; // ボタン下の補足
  risk: 'safe' | 'low' | 'high'; // リスクレベル表示
  successRate: number; // 0-100
  conditions?: GameEventCondition; // 選択条件（アイテム必須など）
  successEffect?: GameEventEffect;
  successLog: string;
  failureEffect?: GameEventEffect;
  failureLog?: string;
  chainTrigger?: EventTriggerType; // 成功時に連鎖して発生させるイベントトリガー
}

export interface GameEvent {
  id: string;
  trigger: EventTriggerType;
  text: string;
  persona?: Persona; // 話者/雰囲気の設定
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
