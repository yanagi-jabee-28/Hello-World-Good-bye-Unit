
import { GameEventEffect, SubjectId, RelationshipId, ItemId } from '../../types';
import { KNOWLEDGE_GAINS, RECOVERY_VALS, REL_GAINS } from '../../config/gameBalance';

/**
 * Effect Templates
 * ゲーム内の数値変動ロジックを一元管理するビルダー群
 * バランス調整はこのファイルと config/gameBalance.ts を修正するだけで全体に反映される
 */

export const Effect = {
  /**
   * 回復・ダメージ関連
   */
  Status: {
    // 回復
    RecoverSmall: (): GameEventEffect => ({ hp: RECOVERY_VALS.MINOR, sanity: RECOVERY_VALS.MINOR }),
    RecoverModerate: (): GameEventEffect => ({ hp: RECOVERY_VALS.MODERATE, sanity: RECOVERY_VALS.MODERATE }),
    RecoverSanity: (val: number = RECOVERY_VALS.MODERATE): GameEventEffect => ({ sanity: val }),
    RecoverHp: (val: number = RECOVERY_VALS.MODERATE): GameEventEffect => ({ hp: val }),
    
    // ダメージ
    DamageLight: (): GameEventEffect => ({ hp: -RECOVERY_VALS.MINOR, sanity: -5 }),
    DamageStress: (): GameEventEffect => ({ sanity: -RECOVERY_VALS.MODERATE }),
    DamageExhaust: (): GameEventEffect => ({ hp: -RECOVERY_VALS.MODERATE }),
  },

  /**
   * 学習関連
   */
  Study: {
    Boost: (subject: SubjectId, tier: keyof typeof KNOWLEDGE_GAINS = 'MEDIUM'): GameEventEffect => ({
      knowledge: { [subject]: KNOWLEDGE_GAINS[tier] }
    }),
    BoostAll: (tier: keyof typeof KNOWLEDGE_GAINS = 'SMALL'): GameEventEffect => {
      const val = KNOWLEDGE_GAINS[tier];
      return {
        knowledge: {
          [SubjectId.MATH]: val,
          [SubjectId.ALGO]: val,
          [SubjectId.CIRCUIT]: val,
          [SubjectId.HUMANITIES]: val,
        }
      };
    }
  },

  /**
   * 人間関係関連
   */
  Social: {
    Boost: (target: RelationshipId, tier: keyof typeof REL_GAINS = 'MEDIUM'): GameEventEffect => ({
      relationships: { [target]: REL_GAINS[tier] }
    }),
    Damage: (target: RelationshipId, val: number = -5): GameEventEffect => ({
      relationships: { [target]: val }
    })
  },

  /**
   * アイテム・所持金関連
   */
  Item: {
    Get: (itemId: ItemId, count: number = 1): GameEventEffect => ({
      inventory: { [itemId]: count }
    }),
    Lose: (itemId: ItemId, count: number = 1): GameEventEffect => ({
      inventory: { [itemId]: -count }
    }),
    Pay: (amount: number): GameEventEffect => ({
      money: -amount
    }),
    Earn: (amount: number): GameEventEffect => ({
      money: amount
    })
  },

  /**
   * 複合プリセット (よくあるパターン)
   */
  Preset: {
    // 友達と遊ぶ (関係UP + SAN回復 + HP消費)
    Hangout: (): GameEventEffect => ({
      relationships: { [RelationshipId.FRIEND]: REL_GAINS.MEDIUM },
      sanity: RECOVERY_VALS.MODERATE,
      hp: -RECOVERY_VALS.MINOR
    }),
    // 教授に褒められる (関係UP + モチベ(SAN)回復)
    ProfessorPraise: (): GameEventEffect => ({
      relationships: { [RelationshipId.PROFESSOR]: REL_GAINS.LARGE },
      sanity: RECOVERY_VALS.SMALL
    }),
    // 徹夜の手伝い (関係UP + アイテム + 大ダメージ)
    HardWorkReward: (target: RelationshipId, rewardItem: ItemId): GameEventEffect => ({
      relationships: { [target]: REL_GAINS.HUGE },
      inventory: { [rewardItem]: 1 },
      hp: -20,
      sanity: -10
    })
  }
};
