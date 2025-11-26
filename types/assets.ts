
import { SubjectId, ItemId, RelationshipId } from './enums';

export interface Subject {
  id: SubjectId;
  name: string;
  description: string;
  difficulty: number; // 1.0 - 2.0 multiplier for difficulty
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

// Moved from event.ts to avoid circular dependency
export interface GameEventEffect {
  hp?: number;
  sanity?: number;
  knowledge?: Partial<Record<SubjectId, number>>;
  relationships?: Partial<Record<RelationshipId, number>>;
  caffeine?: number;
  inventory?: Partial<Record<ItemId, number>>;
  money?: number;
  buffs?: Omit<Buff, 'id'>[]; // バフ効果
}

export interface Item {
  id: ItemId;
  name: string;
  description: string;
  price: number;
  // データ駆動用パラメータ: ItemEffectsを廃止しGameEventEffectに統一
  effects?: GameEventEffect;
  // ロジック側で特殊処理が必要な場合の補助テキスト（自動生成できない部分用）
  specialEffectDescription?: string;
}
