
import { GameEvent, RelationshipId, SubjectId, ItemId, TimeSlot } from '../../types';
import { REL_TIERS, WEIGHTS, COOLDOWNS, REL_GAINS } from '../../config/gameBalance';
import { Effect } from '../presets/effectTemplates';
import { createEvent } from '../builders';

/**
 * PERSONA: PROFESSOR
 * Tone: Formal, Analytical, Slightly Sarcastic but Caring deep down.
 * Domains: MATH, ALGO, CIRCUIT (Academic Core)
 */
export const PROFESSOR_EVENTS: GameEvent[] = [
  // --- TIER: LOW (0+) ---
  createEvent('prof_basic_success', {
    trigger: 'action_professor',
    persona: 'PROFESSOR',
    text: "【質問】「的確な着眼点だ」教授は数式を指し示し、論理の飛躍を冷静に指摘してくれた。基礎理解が深まる。",
  }, {
    type: 'good',
    conditions: { timeSlots: [TimeSlot.MORNING, TimeSlot.AM, TimeSlot.NOON, TimeSlot.AFTERNOON, TimeSlot.AFTER_SCHOOL] },
    effect: {
      ...Effect.Study.Boost(SubjectId.MATH, 'SMALL'),
      relationships: { [RelationshipId.PROFESSOR]: 5 },
      hp: -12,
      sanity: -8,
      satiety: -15
    }
  }),

  createEvent('prof_basic_algo', {
    trigger: 'action_professor',
    persona: 'PROFESSOR',
    text: "【質問】「その解法は悪くないが、計算量は考慮したかね？」アルゴリズムの本質的な欠陥を指摘され、蒙が開けた。",
  }, {
    type: 'good',
    conditions: { timeSlots: [TimeSlot.MORNING, TimeSlot.AM, TimeSlot.NOON, TimeSlot.AFTERNOON, TimeSlot.AFTER_SCHOOL] },
    effect: {
      ...Effect.Study.Boost(SubjectId.ALGO, 'SMALL'),
      relationships: { [RelationshipId.PROFESSOR]: 5 },
      hp: -12,
      sanity: -8,
      satiety: -15
    }
  }),

  createEvent('prof_basic_circuit', {
    trigger: 'action_professor',
    persona: 'PROFESSOR',
    text: "【質問】「回路図のここ、電流の向きが矛盾しているな」教授の誘導尋問で、自力で解法に辿り着いた。",
  }, {
    type: 'good',
    conditions: { timeSlots: [TimeSlot.MORNING, TimeSlot.AM, TimeSlot.NOON, TimeSlot.AFTERNOON, TimeSlot.AFTER_SCHOOL] },
    effect: {
      ...Effect.Study.Boost(SubjectId.CIRCUIT, 'SMALL'),
      relationships: { [RelationshipId.PROFESSOR]: 5 },
      hp: -12,
      sanity: -8,
      satiety: -15
    }
  }),

  createEvent('prof_basic_humanities', {
    trigger: 'action_professor',
    persona: 'PROFESSOR',
    text: "【質問】「教養とは、君自身を守る武器だよ」レポートの構成について、厳しくも丁寧な指導を受けた。",
  }, {
    type: 'good',
    conditions: { timeSlots: [TimeSlot.MORNING, TimeSlot.AM, TimeSlot.NOON, TimeSlot.AFTERNOON, TimeSlot.AFTER_SCHOOL] },
    effect: {
      ...Effect.Study.Boost(SubjectId.HUMANITIES, 'SMALL'),
      relationships: { [RelationshipId.PROFESSOR]: 5 },
      hp: -12,
      sanity: -8,
      satiety: -15
    }
  }),

  createEvent('prof_basic_fail', {
    trigger: 'action_professor',
    persona: 'PROFESSOR',
    text: "【門前払い】「シラバスを読んだかね？」基礎的すぎる質問を一蹴された。出直してこいということか...",
  }, {
    type: 'bad',
    weight: WEIGHTS.RARE,
    conditions: { 
      maxRelationship: REL_TIERS.MID,
      timeSlots: [TimeSlot.MORNING, TimeSlot.AM, TimeSlot.NOON, TimeSlot.AFTERNOON, TimeSlot.AFTER_SCHOOL]
    },
    effect: {
      relationships: { [RelationshipId.PROFESSOR]: 2 },
      ...Effect.Status.DamageExhaust()
    }
  }),

  createEvent('prof_scolding', {
    trigger: 'action_professor',
    persona: 'PROFESSOR',
    text: "【指導】「君のレポートは定義が曖昧だ」...1時間に及ぶ徹底的な指導を受けた。精神が削れる音がする。",
  }, {
    type: 'bad',
    weight: WEIGHTS.UNCOMMON,
    conditions: { 
      maxAvgScore: 45,
      timeSlots: [TimeSlot.MORNING, TimeSlot.AM, TimeSlot.NOON, TimeSlot.AFTERNOON, TimeSlot.AFTER_SCHOOL]
    },
    effect: {
      ...Effect.Status.DamageStress(),
      ...Effect.Study.Boost(SubjectId.HUMANITIES, 'SMALL')
    },
    coolDownTurns: COOLDOWNS.SHORT
  }),

  // --- TIER: MID (30+) ---
  createEvent('prof_small_talk', {
    trigger: 'action_professor',
    persona: 'PROFESSOR',
    text: "【休息】廊下で遭遇。「根を詰めすぎないように」と、ブラックコーヒー(微糖)を手渡された。意外な優しさ。",
  }, {
    type: 'good',
    conditions: { 
      minRelationship: REL_TIERS.MID,
      timeSlots: [TimeSlot.MORNING, TimeSlot.AM, TimeSlot.NOON, TimeSlot.AFTERNOON, TimeSlot.AFTER_SCHOOL]
    },
    effect: {
      ...Effect.Social.Boost(RelationshipId.PROFESSOR, 'MEDIUM'),
      ...Effect.Item.Get(ItemId.BLACK_COFFEE)
    }
  }),

  createEvent('prof_tea_time', {
    trigger: 'action_professor',
    persona: 'PROFESSOR',
    text: "【茶会】「たまには息抜きも必要だろう」研究室の奥から高級な紅茶が出てきた。アカデミックな香りがする。",
  }, {
    type: 'good',
    weight: WEIGHTS.RARE,
    conditions: { 
      minRelationship: REL_TIERS.MID,
      timeSlots: [TimeSlot.AFTERNOON, TimeSlot.AFTER_SCHOOL]
    },
    effect: {
      ...Effect.Status.RecoverModerate(),
      ...Effect.Social.Boost(RelationshipId.PROFESSOR, 'Qm')
    },
    coolDownTurns: COOLDOWNS.MEDIUM
  }),

  // --- TIER: HIGH (60+) ---
  createEvent('prof_high_rel_discussion', {
    trigger: 'action_professor',
    persona: 'PROFESSOR',
    text: "【議論】最新の論文について議論を交わした。対等な研究者として扱われている感覚が心地よい。",
  }, {
    type: 'good',
    weight: WEIGHTS.UNCOMMON,
    conditions: { 
      minRelationship: REL_TIERS.HIGH, 
      minAvgScore: 55,
      timeSlots: [TimeSlot.MORNING, TimeSlot.AM, TimeSlot.NOON, TimeSlot.AFTERNOON, TimeSlot.AFTER_SCHOOL]
    },
    effect: {
      ...Effect.Social.Boost(RelationshipId.PROFESSOR, 'LARGE'),
      ...Effect.Status.RecoverSanity(10)
    },
    coolDownTurns: COOLDOWNS.SHORT
  }),

  createEvent('prof_advice_future', {
    trigger: 'action_professor',
    persona: 'PROFESSOR',
    text: "【展望】「君には博士課程への進学を勧めたい」具体的なキャリアパスを提示され、モチベーションが向上。",
  }, {
    type: 'good',
    weight: WEIGHTS.UNCOMMON,
    conditions: { 
      minRelationship: REL_TIERS.HIGH, 
      minAvgScore: 65,
      timeSlots: [TimeSlot.MORNING, TimeSlot.AM, TimeSlot.NOON, TimeSlot.AFTERNOON, TimeSlot.AFTER_SCHOOL]
    },
    effect: {
      ...Effect.Preset.ProfessorPraise()
    },
    maxOccurrences: 1
  }),

  // --- TIER: ELITE (80+) ---
  createEvent('prof_exam_hint_leak', {
    trigger: 'action_professor',
    persona: 'PROFESSOR',
    text: "【核心】「ここだけの話だが...」教授が声を潜める。試験問題の作成意図、そして解法の鍵となる理論。勝利の方程式を得た。",
  }, {
    type: 'good',
    weight: WEIGHTS.RARE,
    conditions: { 
      minRelationship: REL_TIERS.ELITE,
      timeSlots: [TimeSlot.MORNING, TimeSlot.AM, TimeSlot.NOON, TimeSlot.AFTERNOON, TimeSlot.AFTER_SCHOOL]
    },
    effect: {
      ...Effect.Social.Boost(RelationshipId.PROFESSOR, 'HUGE'),
      knowledge: { 
        [SubjectId.ALGO]: 18, 
        [SubjectId.CIRCUIT]: 18 
      } 
    },
    maxOccurrences: 1
  }),

  // --- FALLBACK ---
  createEvent('prof_generic_chat', {
    trigger: 'action_professor',
    persona: 'PROFESSOR',
    text: "【雑談】研究室で少し話をした。「君の顔を見ると研究が進むよ」と冗談めかして言われた。",
  }, {
    type: 'flavor',
    weight: 1,
    conditions: {
      timeSlots: [TimeSlot.MORNING, TimeSlot.AM, TimeSlot.NOON, TimeSlot.AFTERNOON, TimeSlot.AFTER_SCHOOL]
    },
    effect: {
      relationships: { [RelationshipId.PROFESSOR]: 2 },
      sanity: 2
    }
  })
];
