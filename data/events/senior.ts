
import { GameEvent, RelationshipId, SubjectId, ItemId, TimeSlot } from '../../types';
import { REL_TIERS, WEIGHTS, COOLDOWNS } from '../../config/gameBalance';
import { Effect } from '../presets/effectTemplates';

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
    persona: 'SENIOR',
    text: "【雑用】「これ片付けといて～」実験機材の整理を手伝わされた。お礼にジャンクパーツ(USBメモリ)を貰った。",
    type: 'good',
    weight: WEIGHTS.UNCOMMON,
    conditions: { minRelationship: REL_TIERS.LOW },
    effect: {
      ...Effect.Item.Get(ItemId.USB_MEMORY),
      ...Effect.Social.Boost(RelationshipId.SENIOR, 'Qm')
    },
    maxOccurrences: 1
  },
  {
    id: 'senior_lab_gossip',
    trigger: 'action_senior',
    persona: 'SENIOR',
    text: "【裏話】「あの教授、月曜は機嫌悪いから気をつけろ」攻略に役立つメタ情報を仕入れた。",
    type: 'flavor',
    weight: WEIGHTS.COMMON,
    effect: {
      ...Effect.Social.Boost(RelationshipId.SENIOR, 'MEDIUM'),
      ...Effect.Status.RecoverSanity(5), // Custom minor
      relationships: { [RelationshipId.PROFESSOR]: 2, [RelationshipId.SENIOR]: 8 } // Merge
    }
  },
  {
    id: 'senior_errand',
    trigger: 'action_senior',
    persona: 'SENIOR',
    text: "【パシリ】「焼きそばパン買ってきて」...小銭を渡され購買へ走る。お釣りのチョコは貰った。",
    type: 'flavor',
    weight: WEIGHTS.COMMON,
    conditions: { maxRelationship: REL_TIERS.HIGH },
    effect: {
      hp: -5,
      ...Effect.Social.Boost(RelationshipId.SENIOR, 'Qm'),
      ...Effect.Item.Get(ItemId.HIGH_CACAO_CHOCO)
    }
  },

  // --- TIER: MID (30+) ---
  {
    id: 'senior_midnight_ramen',
    trigger: 'action_senior',
    persona: 'SENIOR',
    text: "【夜食】「カロリーは熱に変わるんだよ」深夜の研究室で二郎系ラーメンを奢られる。背徳的な味がする。",
    type: 'good',
    weight: WEIGHTS.COMMON,
    conditions: { 
      timeSlots: [TimeSlot.NIGHT, TimeSlot.LATE_NIGHT], 
      minRelationship: REL_TIERS.MID 
    },
    effect: {
      ...Effect.Status.RecoverHp(50), // Huge
      ...Effect.Status.RecoverSanity(10),
      satiety: 70, // Huge satiety boost
      ...Effect.Social.Boost(RelationshipId.SENIOR, 'LARGE')
    },
    coolDownTurns: COOLDOWNS.MEDIUM
  },

  // --- TIER: HIGH (60+) ---
  {
    id: 'senior_usb_gift',
    trigger: 'action_senior',
    persona: 'SENIOR',
    text: "【継承】「お前なら使いこなせるだろ」卒業した先輩の私物BOXから、怪しいUSBメモリを託された。",
    type: 'good',
    weight: WEIGHTS.RARE,
    conditions: { minRelationship: REL_TIERS.HIGH },
    effect: {
      ...Effect.Item.Get(ItemId.USB_MEMORY),
      ...Effect.Social.Boost(RelationshipId.SENIOR, 'LARGE')
    },
    maxOccurrences: 1
  },

  // --- TIER: ELITE (80+) ---
  {
    id: 'senior_past_exam',
    trigger: 'action_senior',
    persona: 'SENIOR',
    text: "【秘伝】「誰にも見せるなよ...」研究室のサーバーの奥深くに眠る、伝説の『完全解答付き過去問』へのパスを教えられた。",
    type: 'good',
    weight: WEIGHTS.RARE,
    conditions: { minRelationship: REL_TIERS.ELITE }, 
    effect: {
      ...Effect.Study.Boost(SubjectId.CIRCUIT, 'LARGE'),
      ...Effect.Study.Boost(SubjectId.MATH, 'MEDIUM'),
      ...Effect.Social.Boost(RelationshipId.SENIOR, 'MEDIUM')
    },
    maxOccurrences: 1
  }
];
