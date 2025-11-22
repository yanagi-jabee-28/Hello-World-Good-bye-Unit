
import { GameEvent, SubjectId, TimeSlot, RelationshipId, ItemId } from '../../types';
import { KNOWLEDGE_GAINS, REL_GAINS, RECOVERY_VALS, WEIGHTS, COOLDOWNS } from '../../config/gameBalance';

export const TURN_END_EVENTS: GameEvent[] = [
  // --- SOCIAL PASSIVE (Low Weight) ---
  {
    id: 'turn_end_prof_nod',
    trigger: 'turn_end',
    text: "【会釈】構内で教授とすれ違い、軽く会釈された。顔を覚えられているようだ。",
    type: 'good',
    category: 'social',
    weight: WEIGHTS.RARE,
    effect: { relationships: { [RelationshipId.PROFESSOR]: REL_GAINS.SMALL } }
  },
  {
    id: 'turn_end_senior_wave',
    trigger: 'turn_end',
    text: "【遭遇】喫煙所の近くで先輩が手を振ってくれた。「ちゃんと寝ろよー」",
    type: 'good',
    category: 'social',
    weight: WEIGHTS.RARE,
    effect: { relationships: { [RelationshipId.SENIOR]: REL_GAINS.SMALL }, sanity: 3 }
  },
  {
    id: 'turn_end_friend_line',
    trigger: 'turn_end',
    text: "【通知】友人から「進捗どう？」というスタンプが届いた。生存確認。",
    type: 'good',
    category: 'social',
    weight: WEIGHTS.RARE,
    effect: { relationships: { [RelationshipId.FRIEND]: REL_GAINS.SMALL }, sanity: 3 }
  },

  // --- RANDOM EVENTS ---
  {
    id: 'god_youtube',
    trigger: 'turn_end',
    text: "【救済】YouTubeで「インド人の神解説動画」を発見。数時間の悩みが一瞬で解決した。",
    type: 'good',
    category: 'study_boost',
    weight: WEIGHTS.LEGENDARY, // Very rare
    conditions: { maxAvgScore: 70 },
    effect: { knowledge: { [SubjectId.ALGO]: KNOWLEDGE_GAINS.LARGE, [SubjectId.MATH]: KNOWLEDGE_GAINS.LARGE } },
    maxOccurrences: 1
  },
  {
    id: 'care_package',
    trigger: 'turn_end',
    text: "【補給】実家から救援物資が届いた。段ボールに入った食料と手紙に、少しだけ視界が滲む。",
    type: 'good',
    category: 'health_recovery',
    weight: 10, // Custom low weight
    conditions: { maxHp: 40 },
    effect: { 
      hp: RECOVERY_VALS.LARGE, 
      sanity: RECOVERY_VALS.LARGE, 
      inventory: { [ItemId.CUP_RAMEN]: 1, [ItemId.PROTEIN_BAR]: 1 } 
    },
    coolDownTurns: COOLDOWNS.LONG
  },
  {
    id: 'stackoverflow_god',
    trigger: 'turn_end',
    text: "【解決】Stack Overflowで全く同じエラーの解決策を発見。ありがとう、名もなき先人。",
    type: 'good',
    category: 'tech_trouble',
    weight: WEIGHTS.RARE,
    conditions: { minAvgScore: 20 },
    effect: { sanity: RECOVERY_VALS.MODERATE },
    coolDownTurns: COOLDOWNS.MEDIUM
  },
  {
    id: 'energy_sale',
    trigger: 'turn_end',
    text: "【補給】生協でエナドリがセール中だ。気付けばカゴに入れていた。",
    type: 'good',
    category: 'item_get',
    weight: 10,
    conditions: { timeSlots: [TimeSlot.NOON, TimeSlot.AFTER_SCHOOL], caffeineMax: 150 },
    effect: { inventory: { [ItemId.ENERGY_DRINK]: 2 }, money: -600 },
    coolDownTurns: 8
  },
  {
    id: 'caffeine_crash',
    trigger: 'turn_end',
    text: "【反動】カフェインの効果が切れ、急激なダルさに襲われる。身体が鉛のように重い。",
    type: 'bad',
    weight: 40,
    conditions: { caffeineMin: 100 }, // Occurs when caffeine is high
    effect: { hp: -RECOVERY_VALS.MODERATE, sanity: -RECOVERY_VALS.MODERATE },
    coolDownTurns: COOLDOWNS.SHORT
  }
];
