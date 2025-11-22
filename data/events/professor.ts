
import { GameEvent, RelationshipId, SubjectId, ItemId } from '../../types';
import { REL_TIERS, KNOWLEDGE_GAINS, REL_GAINS, RECOVERY_VALS, WEIGHTS, COOLDOWNS } from '../../config/gameBalance';

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
    text: "【質問】「良い着眼点だ」教授は数式を指し示し、論理の飛躍を指摘してくれた。基礎理解が深まる。",
    type: 'good',
    weight: WEIGHTS.COMMON,
    effect: { 
      relationships: { [RelationshipId.PROFESSOR]: REL_GAINS.Qm }, 
      knowledge: { [SubjectId.MATH]: KNOWLEDGE_GAINS.SMALL } 
    }
  },
  {
    id: 'prof_basic_fail',
    trigger: 'action_professor',
    text: "【門前払い】「シラバスを読んだかね？」基礎的な質問を一蹴された。出直す必要がある。",
    type: 'bad',
    weight: WEIGHTS.RARE,
    conditions: { maxRelationship: REL_TIERS.MID }, // 仲良くなると発生しなくなる
    effect: { 
      relationships: { [RelationshipId.PROFESSOR]: 2 }, 
      hp: -RECOVERY_VALS.MINOR 
    }
  },
  {
    id: 'prof_scolding',
    trigger: 'action_professor',
    text: "【指導】「君のレポートは定義が曖昧だ」...1時間に及ぶ厳しい指導を受けた。精神が削れる。",
    type: 'bad',
    weight: WEIGHTS.UNCOMMON,
    conditions: { maxAvgScore: 45 }, // 成績不振時
    effect: { 
      sanity: -RECOVERY_VALS.MODERATE, 
      knowledge: { [SubjectId.HUMANITIES]: KNOWLEDGE_GAINS.SMALL } // 説教も教養のうち
    },
    coolDownTurns: COOLDOWNS.SHORT
  },

  // --- TIER: MID (30+) ---
  {
    id: 'prof_small_talk',
    trigger: 'action_professor',
    text: "【休息】廊下で遭遇。「根を詰めすぎないように」と、ブラックコーヒー(微糖)を手渡された。",
    type: 'good',
    weight: WEIGHTS.COMMON,
    conditions: { minRelationship: REL_TIERS.MID },
    effect: { 
      relationships: { [RelationshipId.PROFESSOR]: REL_GAINS.MEDIUM }, 
      inventory: { [ItemId.BLACK_COFFEE]: 1 } 
    }
  },
  {
    id: 'prof_tea_time',
    trigger: 'action_professor',
    text: "【茶会】「たまには息抜きも必要だろう」研究室の奥から高級な紅茶が出てきた。アカデミックな香りがする。",
    type: 'good',
    weight: WEIGHTS.RARE,
    conditions: { minRelationship: REL_TIERS.MID },
    effect: { 
      hp: RECOVERY_VALS.MODERATE, 
      sanity: RECOVERY_VALS.MODERATE, 
      relationships: { [RelationshipId.PROFESSOR]: REL_GAINS.Qm } 
    },
    coolDownTurns: COOLDOWNS.MEDIUM
  },

  // --- TIER: HIGH (60+) ---
  {
    id: 'prof_high_rel_discussion',
    trigger: 'action_professor',
    text: "【議論】最新の論文について議論を交わした。対等な研究者として扱われている感覚が心地よい。",
    type: 'good',
    weight: WEIGHTS.UNCOMMON,
    conditions: { minRelationship: REL_TIERS.HIGH, minAvgScore: 60 },
    effect: { 
      relationships: { [RelationshipId.PROFESSOR]: REL_GAINS.LARGE }, 
      sanity: RECOVERY_VALS.SMALL 
    },
    coolDownTurns: COOLDOWNS.SHORT
  },
  {
    id: 'prof_advice_future',
    trigger: 'action_professor',
    text: "【展望】「君には博士課程への進学を勧めたい」具体的なキャリアパスを提示され、モチベーションが向上。",
    type: 'good',
    weight: WEIGHTS.UNCOMMON,
    conditions: { minRelationship: REL_TIERS.HIGH, minAvgScore: 70 },
    effect: { 
      relationships: { [RelationshipId.PROFESSOR]: REL_GAINS.LARGE }, 
      sanity: RECOVERY_VALS.MODERATE 
    },
    maxOccurrences: 1
  },

  // --- TIER: ELITE (80+) ---
  {
    id: 'prof_exam_hint_leak',
    trigger: 'action_professor',
    text: "【核心】「ここだけの話だが...」教授が声を潜める。試験問題の作成意図、そして解法の鍵となる理論。勝利の方程式を得た。",
    type: 'good',
    weight: WEIGHTS.RARE,
    // Rationale: 強力すぎるため、発生条件を厳しく設定(Rel 30 -> 80)
    conditions: { minRelationship: REL_TIERS.ELITE },
    effect: { 
      relationships: { [RelationshipId.PROFESSOR]: REL_GAINS.HUGE }, 
      // 全体アップではなく、専門科目に特化
      knowledge: { [SubjectId.ALGO]: KNOWLEDGE_GAINS.LARGE, [SubjectId.CIRCUIT]: KNOWLEDGE_GAINS.LARGE } 
    },
    maxOccurrences: 1
  }
];
