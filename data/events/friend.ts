
import { GameEvent, RelationshipId, SubjectId, ItemId, TimeSlot } from '../../types';
import { REL_TIERS, WEIGHTS, COOLDOWNS, REL_GAINS } from '../../config/gameBalance';
import { Effect } from '../presets/effectTemplates';

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
    persona: 'FRIEND',
    text: "【共有】「この板書撮った？」講義ノートの画像が送られてきた。持つべきものは友だ。",
    type: 'good',
    weight: WEIGHTS.COMMON,
    effect: {
      ...Effect.Social.Boost(RelationshipId.FRIEND, 'MEDIUM'),
      ...Effect.Study.Boost(SubjectId.HUMANITIES, 'SMALL')
    }
  },
  {
    id: 'friend_game_talk',
    trigger: 'action_friend',
    persona: 'FRIEND',
    text: "【遊戯】「新作ゲームの話しようぜ！」試験期間？ 知らん。エンタメの話で脳をリフレッシュする。",
    type: 'flavor',
    weight: WEIGHTS.COMMON,
    // Balance Update: Allow late night gaming
    conditions: {
      timeSlots: [TimeSlot.AFTER_SCHOOL, TimeSlot.NIGHT, TimeSlot.LATE_NIGHT]
    },
    effect: {
      ...Effect.Social.Boost(RelationshipId.FRIEND, 'LARGE'),
      sanity: 15, // Mental recovery only
      satiety: -5 // Light consumption
    }
  },

  // --- TIER: MID (30+) ---
  {
    id: 'friend_info_share',
    trigger: 'action_friend',
    persona: 'FRIEND',
    text: "【噂話】「線形代数の先生、今年は難化させるらしいよ」不穏だが有益な情報を共有した。対策を練らねば。",
    type: 'good',
    weight: WEIGHTS.UNCOMMON,
    conditions: { minRelationship: REL_TIERS.MID },
    effect: {
      ...Effect.Study.Boost(SubjectId.MATH, 'MEDIUM'),
      ...Effect.Social.Boost(RelationshipId.FRIEND, 'MEDIUM')
    }
  },
  {
    id: 'friend_escapism',
    trigger: 'action_friend',
    persona: 'FRIEND',
    text: "【誘惑】「カラオケ行こうぜ！」断れる雰囲気じゃない...が、まあいいか。喉が枯れるまで歌い倒した。",
    type: 'flavor',
    weight: WEIGHTS.UNCOMMON,
    conditions: { 
      maxSanity: 50, 
      minRelationship: REL_TIERS.MID,
      // Balance Update: Allow late night karaoke
      timeSlots: [TimeSlot.AFTER_SCHOOL, TimeSlot.NIGHT, TimeSlot.LATE_NIGHT]
    },
    effect: {
      relationships: { [RelationshipId.FRIEND]: REL_GAINS.LARGE },
      sanity: 35, // Huge relief
      hp: -10, // Physical exhaustion
      satiety: -20, // Singing makes you hungry
      money: -2000
    },
    coolDownTurns: COOLDOWNS.MEDIUM
  },

  // --- TIER: HIGH (60+) ---
  {
    id: 'friend_study_group',
    trigger: 'action_friend',
    persona: 'FRIEND',
    text: "【協力】「ここ、お前が得意なとこだろ？教えてくれ」互いの得意分野を教え合い、効率的に学習が進む。",
    type: 'good',
    weight: WEIGHTS.UNCOMMON,
    conditions: { minRelationship: REL_TIERS.HIGH, minSanity: 40 },
    effect: {
      ...Effect.Status.RecoverSanity(10),
      ...Effect.Study.Boost(SubjectId.ALGO, 'MEDIUM'),
      ...Effect.Study.Boost(SubjectId.HUMANITIES, 'MEDIUM'),
      ...Effect.Social.Boost(RelationshipId.FRIEND, 'MEDIUM')
    },
    coolDownTurns: COOLDOWNS.SHORT
  },
  {
    id: 'friend_cloud_leak',
    trigger: 'action_friend',
    persona: 'FRIEND',
    text: "【共有】「例のドライブ、権限付与しといたわ」有志がまとめた過去問データベースへのアクセス権を得た。これはデカイ。",
    type: 'good',
    weight: WEIGHTS.RARE,
    conditions: { minRelationship: REL_TIERS.HIGH },
    effect: {
      ...Effect.Social.Boost(RelationshipId.FRIEND, 'LARGE'),
      ...Effect.Status.RecoverSanity(20),
      ...Effect.Study.Boost(SubjectId.ALGO, 'LARGE')
    },
    maxOccurrences: 1
  },

  // --- TIER: ELITE (80+) ---
  {
    id: 'friend_smart_drug',
    trigger: 'action_friend',
    persona: 'FRIEND',
    text: "【密売】「これ、個人輸入したヤツなんだけど...」友人が震える手で怪しいサプリを渡してきた。「飛ぶぞ」",
    type: 'flavor',
    weight: WEIGHTS.LEGENDARY,
    conditions: { minRelationship: REL_TIERS.ELITE, maxSanity: 40 },
    effect: {
      ...Effect.Item.Get(ItemId.SMART_DRUG),
      ...Effect.Social.Boost(RelationshipId.FRIEND, 'MEDIUM')
    },
    maxOccurrences: 1
  },

  // --- FALLBACK ---
  {
    id: 'friend_generic_chat',
    trigger: 'action_friend',
    persona: 'FRIEND',
    text: "【通信】友人とLINEでスタンプを送り合った。言葉はいらない。",
    type: 'flavor',
    weight: 1,
    conditions: {},
    effect: {
      relationships: { [RelationshipId.FRIEND]: 2 },
      sanity: 2
    }
  }
];
