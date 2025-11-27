
import { GameEvent, RelationshipId, SubjectId, ItemId, TimeSlot } from '../../types';
import { REL_TIERS, WEIGHTS, COOLDOWNS, REL_GAINS } from '../../config/gameBalance';
import { Effect } from '../presets/effectTemplates';

/**
 * PERSONA: PROFESSOR
 * Tone: Formal, Analytical, Slightly Sarcastic but Caring deep down.
 * Domains: MATH, ALGO, CIRCUIT (Academic Core)
 */
export const PROFESSOR_EVENTS: GameEvent[] = [
  // --- TIER: LOW (0+) ---
  {
    id: 'prof_basic_success',
    trigger: 'action_professor',
    persona: 'PROFESSOR',
    text: "【質問】「良い着眼点だ」教授は数式を指し示し、論理の飛躍を指摘してくれた。基礎理解が深まる。",
    type: 'good',
    weight: WEIGHTS.COMMON,
    effect: {
      ...Effect.Study.Boost(SubjectId.MATH, 'SMALL'),
      // Balance Update: Increased from standard small/Qm to fix +5 for easier early game
      relationships: { [RelationshipId.PROFESSOR]: 5 } 
    }
  },
  {
    id: 'prof_basic_fail',
    trigger: 'action_professor',
    persona: 'PROFESSOR',
    text: "【門前払い】「シラバスを読んだかね？」基礎的な質問を一蹴された。出直す必要がある。",
    type: 'bad',
    weight: WEIGHTS.RARE,
    conditions: { maxRelationship: REL_TIERS.MID }, 
    effect: {
      relationships: { [RelationshipId.PROFESSOR]: 2 }, // Even bad interaction gives tiny rel (effort seen)
      ...Effect.Status.DamageExhaust() 
    }
  },
  // NEW: Night Effort (Time-based bonus)
  {
    id: 'prof_night_effort',
    trigger: 'action_professor',
    persona: 'PROFESSOR',
    text: "【残業】「...まだ残っていたのか」深夜の研究室。教授が缶コーヒーを差し入れてくれた。「無理はするなよ」",
    type: 'good',
    weight: WEIGHTS.COMMON,
    conditions: { timeSlots: [TimeSlot.NIGHT, TimeSlot.LATE_NIGHT] },
    effect: {
      relationships: { [RelationshipId.PROFESSOR]: 6 }, // Good boost for effort
      sanity: 5,
      inventory: { [ItemId.BLACK_COFFEE]: 1 }
    },
    coolDownTurns: COOLDOWNS.SHORT
  },
  {
    id: 'prof_scolding',
    trigger: 'action_professor',
    persona: 'PROFESSOR',
    text: "【指導】「君のレポートは定義が曖昧だ」...1時間に及ぶ厳しい指導を受けた。精神が削れる。",
    type: 'bad',
    weight: WEIGHTS.UNCOMMON,
    conditions: { maxAvgScore: 45 },
    effect: {
      ...Effect.Status.DamageStress(),
      ...Effect.Study.Boost(SubjectId.HUMANITIES, 'SMALL')
    },
    coolDownTurns: COOLDOWNS.SHORT
  },

  // --- TIER: MID (30+) ---
  {
    id: 'prof_small_talk',
    trigger: 'action_professor',
    persona: 'PROFESSOR',
    text: "【休息】廊下で遭遇。「根を詰めすぎないように」と、ブラックコーヒー(微糖)を手渡された。",
    type: 'good',
    weight: WEIGHTS.COMMON,
    conditions: { minRelationship: REL_TIERS.MID },
    effect: {
      ...Effect.Social.Boost(RelationshipId.PROFESSOR, 'MEDIUM'),
      ...Effect.Item.Get(ItemId.BLACK_COFFEE)
    }
  },
  {
    id: 'prof_tea_time',
    trigger: 'action_professor',
    persona: 'PROFESSOR',
    text: "【茶会】「たまには息抜きも必要だろう」研究室の奥から高級な紅茶が出てきた。アカデミックな香りがする。",
    type: 'good',
    weight: WEIGHTS.RARE,
    conditions: { minRelationship: REL_TIERS.MID },
    effect: {
      ...Effect.Status.RecoverModerate(),
      ...Effect.Social.Boost(RelationshipId.PROFESSOR, 'Qm')
    },
    coolDownTurns: COOLDOWNS.MEDIUM
  },

  // --- TIER: HIGH (60+) ---
  {
    id: 'prof_high_rel_discussion',
    trigger: 'action_professor',
    persona: 'PROFESSOR',
    text: "【議論】最新の論文について議論を交わした。対等な研究者として扱われている感覚が心地よい。",
    type: 'good',
    weight: WEIGHTS.UNCOMMON,
    // Balance Update: Relaxed condition (60 -> 55)
    conditions: { minRelationship: REL_TIERS.HIGH, minAvgScore: 55 },
    effect: {
      ...Effect.Social.Boost(RelationshipId.PROFESSOR, 'LARGE'),
      ...Effect.Status.RecoverSanity(10)
    },
    coolDownTurns: COOLDOWNS.SHORT
  },
  {
    id: 'prof_advice_future',
    trigger: 'action_professor',
    persona: 'PROFESSOR',
    text: "【展望】「君には博士課程への進学を勧めたい」具体的なキャリアパスを提示され、モチベーションが向上。",
    type: 'good',
    weight: WEIGHTS.UNCOMMON,
    // Balance Update: Relaxed condition (70 -> 65)
    conditions: { minRelationship: REL_TIERS.HIGH, minAvgScore: 65 },
    effect: {
      ...Effect.Preset.ProfessorPraise()
    },
    maxOccurrences: 1
  },

  // --- TIER: ELITE (80+) ---
  {
    id: 'prof_exam_hint_leak',
    trigger: 'action_professor',
    persona: 'PROFESSOR',
    text: "【核心】「ここだけの話だが...」教授が声を潜める。試験問題の作成意図、そして解法の鍵となる理論。勝利の方程式を得た。",
    type: 'good',
    weight: WEIGHTS.RARE,
    conditions: { minRelationship: REL_TIERS.ELITE },
    effect: {
      ...Effect.Social.Boost(RelationshipId.PROFESSOR, 'HUGE'),
      knowledge: { 
        [SubjectId.ALGO]: 18, 
        [SubjectId.CIRCUIT]: 18 
      } 
    },
    maxOccurrences: 1
  }
];
