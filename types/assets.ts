import { SubjectId, ItemId } from './enums';

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