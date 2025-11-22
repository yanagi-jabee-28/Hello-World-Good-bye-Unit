
import { GameEvent, RelationshipId, SubjectId, ItemId } from '../../types';
import {REL_TIERS, KNOWLEDGE_GAINS, REL_GAINS, RECOVERY_VALS, WEIGHTS, COOLDOWNS } from '../../config/gameBalance';

/**
 * PERSONA: FRIEND
 * Tone: Empathetic, Collegial, Sometimes dragging you down (Escapism).
 * Domains: SAN Recovery, General Info, Algo/Humanities
 */
export const FRIEND_EVENTS: GameEvent[] = [
  // --- TIER: LOW (0+) ---
  {
    id: 'friend_sns_share',
    trigger: 'action_friend',
    text: "【共有】「この板書撮った？」講義ノートの画像が送られてきた。持つべきものは友だ。",
    type: 'good',
    weight: WEIGHTS.COMMON,
    effect: { 
      relationships: { [RelationshipId.FRIEND]: REL_GAINS.MEDIUM }, 
      knowledge: { [SubjectId.HUMANITIES]: KNOWLEDGE_GAINS.SMALL } 
    }
  },
  {
    id: 'friend_game_talk',
    trigger: 'action_friend',
    text: "【遊戯】試験期間中だが、新作ゲームの話で盛り上がる。「現実逃避最高！」",
    type: 'flavor',
    weight: WEIGHTS.COMMON,
    effect: { 
      relationships: { [RelationshipId.FRIEND]: REL_GAINS.LARGE }, 
      sanity: RECOVERY_VALS.MODERATE, 
      hp: RECOVERY_VALS.MINOR 
    }
  },

  // --- TIER: MID (30+) ---
  {
    id: 'friend_info_share',
    trigger: 'action_friend',
    text: "【噂話】「線形代数の先生、今年は難化させるらしいよ」不穏だが有益な情報を共有した。",
    type: 'good',
    weight: WEIGHTS.UNCOMMON,
    conditions: { minRelationship: REL_TIERS.MID },
    effect: { 
      knowledge: { [SubjectId.MATH]: KNOWLEDGE_GAINS.MEDIUM }, 
      relationships: { [RelationshipId.FRIEND]: REL_GAINS.MEDIUM } 
    }
  },
  {
    id: 'friend_escapism',
    trigger: 'action_friend',
    text: "【誘惑】「カラオケ行こうぜ。勉強？ 知らん！」強引に連れ出され、喉が枯れるまで歌った。",
    type: 'flavor',
    weight: WEIGHTS.UNCOMMON,
    conditions: { maxSanity: 50, minRelationship: REL_TIERS.MID },
    effect: { 
      sanity: 35, // High recovery
      hp: -RECOVERY_VALS.MODERATE, 
      relationships: { [RelationshipId.FRIEND]: REL_GAINS.LARGE } 
    },
    coolDownTurns: COOLDOWNS.MEDIUM
  },

  // --- TIER: HIGH (60+) ---
  {
    id: 'friend_study_group',
    trigger: 'action_friend',
    text: "【協力】「ここ、お前が得意なとこだろ？教えてくれ」互いの得意分野を教え合い、効率的に学習が進む。",
    type: 'good',
    weight: WEIGHTS.UNCOMMON,
    conditions: { minRelationship: REL_TIERS.HIGH, minSanity: 40 },
    effect: { 
      sanity: RECOVERY_VALS.SMALL, 
      knowledge: { [SubjectId.ALGO]: KNOWLEDGE_GAINS.MEDIUM, [SubjectId.HUMANITIES]: KNOWLEDGE_GAINS.MEDIUM }, 
      relationships: { [RelationshipId.FRIEND]: REL_GAINS.MEDIUM } 
    },
    coolDownTurns: COOLDOWNS.SHORT
  },
  {
    id: 'friend_cloud_leak',
    trigger: 'action_friend',
    text: "【共有】「例のドライブ、権限付与しといたわ」有志がまとめた過去問データベースへのアクセス権を得た。",
    type: 'good',
    weight: WEIGHTS.RARE,
    conditions: { minRelationship: REL_TIERS.HIGH },
    effect: { 
      relationships: { [RelationshipId.FRIEND]: REL_GAINS.LARGE }, 
      sanity: RECOVERY_VALS.MODERATE, 
      knowledge: { [SubjectId.ALGO]: KNOWLEDGE_GAINS.LARGE } // Adjusted from generic boost
    },
    maxOccurrences: 1
  },

  // --- TIER: ELITE (80+) ---
  {
    id: 'friend_smart_drug',
    trigger: 'action_friend',
    text: "【密売】「これ、個人輸入したヤツなんだけど...」友人が震える手で怪しいサプリを渡してきた。「飛ぶぞ」",
    type: 'flavor',
    weight: WEIGHTS.LEGENDARY,
    conditions: { minRelationship: REL_TIERS.ELITE, maxSanity: 40 },
    effect: { 
      inventory: { [ItemId.SMART_DRUG]: 1 }, 
      relationships: { [RelationshipId.FRIEND]: REL_GAINS.MEDIUM } 
    },
    maxOccurrences: 1
  }
];
