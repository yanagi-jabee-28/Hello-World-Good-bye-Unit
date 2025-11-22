
import { GameEvent, RelationshipId, SubjectId, ItemId, TimeSlot } from '../../types';
import {REL_TIERS, KNOWLEDGE_GAINS, REL_GAINS, RECOVERY_VALS, WEIGHTS, COOLDOWNS } from '../../config/gameBalance';

/**
 * PERSONA: SENIOR
 * Tone: Casual, Pragmatic, Brotherly/Sisterly.
 * Domains: Items, Food, Past Exams (Circuit/Hardware focus)
 */
export const SENIOR_EVENTS: GameEvent[] = [
  // --- TIER: LOW (0+) ---
  {
    id: 'senior_lab_cleanup',
    trigger: 'action_senior',
    text: "【雑用】「これ片付けといて～」実験機材の整理を手伝わされた。お礼にジャンクパーツ(USBメモリ)を貰った。",
    type: 'good',
    weight: WEIGHTS.UNCOMMON,
    conditions: { minRelationship: REL_TIERS.LOW }, // Low barrier entry for Item
    effect: { 
      inventory: { [ItemId.USB_MEMORY]: 1 }, 
      relationships: { [RelationshipId.SENIOR]: REL_GAINS.Qm } 
    },
    maxOccurrences: 1
  },
  {
    id: 'senior_lab_gossip',
    trigger: 'action_senior',
    text: "【裏話】「あの教授、月曜は機嫌悪いから気をつけろ」攻略に役立つメタ情報を仕入れた。",
    type: 'flavor',
    weight: WEIGHTS.COMMON,
    effect: { 
      relationships: { [RelationshipId.SENIOR]: REL_GAINS.MEDIUM, [RelationshipId.PROFESSOR]: 2 }, 
      sanity: RECOVERY_VALS.MINOR 
    }
  },
  {
    id: 'senior_errand',
    trigger: 'action_senior',
    text: "【パシリ】「焼きそばパン買ってきて」...小銭を渡され購買へ走る。お釣りのチョコは貰った。",
    type: 'flavor',
    weight: WEIGHTS.COMMON,
    conditions: { maxRelationship: REL_TIERS.HIGH },
    effect: { 
      hp: -RECOVERY_VALS.MINOR, 
      relationships: { [RelationshipId.SENIOR]: REL_GAINS.Qm }, 
      inventory: { [ItemId.HIGH_CACAO_CHOCO]: 1 } 
    }
  },

  // --- TIER: MID (30+) ---
  {
    id: 'senior_midnight_ramen',
    trigger: 'action_senior',
    text: "【夜食】「カロリーは熱に変わるんだよ」深夜の研究室で二郎系ラーメンを奢られる。背徳的な味がする。",
    type: 'good',
    weight: WEIGHTS.COMMON,
    conditions: { 
      timeSlots: [TimeSlot.NIGHT, TimeSlot.LATE_NIGHT], 
      minRelationship: REL_TIERS.MID 
    },
    effect: { 
      hp: RECOVERY_VALS.HUGE, // 回復量大
      sanity: RECOVERY_VALS.SMALL, 
      relationships: { [RelationshipId.SENIOR]: REL_GAINS.LARGE } 
    },
    coolDownTurns: COOLDOWNS.MEDIUM // 連発防止
  },

  // --- TIER: HIGH (60+) ---
  {
    id: 'senior_usb_gift',
    trigger: 'action_senior',
    text: "【継承】「お前なら使いこなせるだろ」卒業した先輩の私物BOXから、怪しいUSBメモリを託された。",
    type: 'good',
    weight: WEIGHTS.RARE,
    conditions: { minRelationship: REL_TIERS.HIGH },
    effect: { 
      inventory: { [ItemId.USB_MEMORY]: 1 }, 
      relationships: { [RelationshipId.SENIOR]: REL_GAINS.LARGE } 
    },
    maxOccurrences: 1
  },

  // --- TIER: ELITE (80+) ---
  {
    id: 'senior_past_exam',
    trigger: 'action_senior',
    text: "【秘伝】「誰にも見せるなよ...」研究室のサーバーの奥深くに眠る、伝説の『完全解答付き過去問』へのパスを教えられた。",
    type: 'good',
    weight: WEIGHTS.RARE,
    // Rationale: バランス崩壊要因だったため、条件を厳格化(Rel 30 -> 80)し、効果を少しマイルドに調整
    conditions: { minRelationship: REL_TIERS.ELITE }, 
    effect: { 
      knowledge: { [SubjectId.CIRCUIT]: KNOWLEDGE_GAINS.LARGE, [SubjectId.MATH]: KNOWLEDGE_GAINS.MEDIUM }, 
      relationships: { [RelationshipId.SENIOR]: REL_GAINS.MEDIUM } 
    },
    maxOccurrences: 1
  }
];
