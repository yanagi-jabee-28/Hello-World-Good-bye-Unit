
import { GameEvent, SubjectId, TimeSlot, RelationshipId, ItemId } from '../types';

export const LOG_MESSAGES = {
  start: "ブートシーケンス完了。これより7日間の地獄の試験対策期間を開始します。",
  
  study_morning_bonus: (subject: string) => `【朝の覚醒】静寂な自室。コーヒーの香りと共に${subject}の予習が進む。`,
  study_am_normal: (subject: string) => `【午前の講義】${subject}の講義。教授の板書速度が異常に速い。`,
  study_noon_drowsy: (subject: string) => `【昼の喧騒】学食がうるさすぎて${subject}に集中できない。進捗は芳しくない。`,
  study_afternoon_fight: (subject: string) => `【午後の魔の時間】${subject}の演習中、意識が飛びそうになる。睡魔との死闘。`,
  study_after_school_focus: (subject: string) => `【放課後の集中】図書館の静寂。${subject}の課題を一気に片付ける。`,
  study_caffeine_awake: (subject: string) => `【強制覚醒】カフェインが効いている。昼休みだが${subject}への集中力が研ぎ澄まされている。`,
  study_night_tired: (subject: string) => `【夜の疲労】帰宅後のデスク。${subject}に取り組むが、目が霞む。`,
  study_late_night_zone: (subject: string) => `【深夜のゾーン】午前3時。世界に自分と${subject}しか存在しない感覚。神懸かっている。`,
  study_late_night_fail: (subject: string) => `【深夜の寝落ち】気づけば朝チュン。${subject}のノートにはよだれが垂れている...。`,
  
  study_jitter: "【カフェイン中毒】心臓が早鐘を打っている。焦燥感ばかりで手が動かない。",
  
  madness_gameover: "【思考停止】プツン、と何かが切れる音がした。現実と夢の境界が崩壊。ドロップアウト。",
  hp_gameover: "【緊急搬送】視界がブラックアウト。栄養失調とカフェイン過剰摂取で倒れ、救急車で運ばれた。",
  
  rest_success: "死んだように眠った。脳のキャッシュがクリアされた。",
  rest_short: "机に突っ伏して仮眠をとった。身体がバキバキだが、マシにはなった。",
  rest_caffeine_fail: "目を閉じると瞼の裏で極彩色のフラクタル図形が回転している。一睡もできず、SAN値だけが減る。",
  
  caffeine_ingest: "エナドリのプルタブを開ける。脳が強制再起動される感覚。寿命を前借りする音がする。",
  
  victory: "合格発表日。掲示板に自分の番号を見つけた。灰色の空が、少しだけ青く見えた。",
  failure: "不合格。留年確定。奨学金の返済計画が脳裏をよぎる...",
};

/**
 * 全イベント定義リスト
 */
export const ALL_EVENTS: GameEvent[] = [
  // ==========================================
  // PROFESSOR ACTIONS
  // ==========================================
  {
    id: 'prof_basic_success',
    trigger: 'action_professor',
    text: "【質問】研究室を訪ねた。「ここは試験に出すぞ」というリーク情報を入手！",
    type: 'good',
    weight: 50,
    effect: { relationships: { [RelationshipId.PROFESSOR]: 5 }, knowledge: { [SubjectId.MATH]: 5 } }
  },
  {
    id: 'prof_small_talk',
    trigger: 'action_professor',
    text: "【雑談】廊下でバッタリ会った。「最近顔色が悪いぞ」と缶コーヒーを奢ってくれた。",
    type: 'good',
    weight: 60, // 発生しやすい
    effect: { relationships: { [RelationshipId.PROFESSOR]: 8 }, caffeine: 10, hp: 5 }
  },
  {
    id: 'prof_advice_future',
    trigger: 'action_professor',
    text: "【進路】「君のコードは独創的だね」と褒められた。研究者への適性があるかもしれない。",
    type: 'good',
    weight: 30,
    conditions: { minAvgScore: 50 },
    effect: { relationships: { [RelationshipId.PROFESSOR]: 10 }, sanity: 10 }
  },
  {
    id: 'prof_basic_fail',
    trigger: 'action_professor',
    text: "【門前払い】「その質問は講義中に説明したはずだ」と一蹴された。冷たい。",
    type: 'bad',
    weight: 20, // 重みを低下
    conditions: { maxRelationship: 40 },
    effect: { relationships: { [RelationshipId.PROFESSOR]: 2 }, hp: -5 }
  },
  {
    id: 'prof_high_rel_discussion',
    trigger: 'action_professor',
    text: "【白熱】教授と専門的な議論で盛り上がった。将来の研究室配属に有利になりそうだ。",
    type: 'good',
    weight: 40,
    conditions: { minRelationship: 60, minAvgScore: 65 },
    effect: { relationships: { [RelationshipId.PROFESSOR]: 15 }, sanity: 10 },
    coolDownTurns: 3
  },
  {
    id: 'prof_tea_time',
    trigger: 'action_professor',
    text: "【茶会】「まあ座りたまえ」高級な紅茶と茶菓子が出てきた。実家より居心地が良い。",
    type: 'good',
    weight: 20,
    conditions: { minRelationship: 50 },
    effect: { hp: 15, sanity: 15, relationships: { [RelationshipId.PROFESSOR]: 5 } },
    coolDownTurns: 5
  },
  {
    id: 'prof_scolding',
    trigger: 'action_professor',
    text: "【説教】「君、このままだと留年だよ？」...1時間説教された。",
    type: 'bad',
    weight: 30, // 重みを低下
    conditions: { maxAvgScore: 40 },
    effect: { sanity: -15, knowledge: { [SubjectId.HUMANITIES]: 5 } },
    coolDownTurns: 3
  },

  // ==========================================
  // SENIOR ACTIONS
  // ==========================================
  {
    id: 'senior_past_exam',
    trigger: 'action_senior',
    text: "【継承】研究室の先輩が、代々伝わる「秘伝の過去問」をUSBで渡してくれた！",
    type: 'good',
    weight: 30,
    conditions: { minRelationship: 40 },
    effect: { knowledge: { [SubjectId.CIRCUIT]: 20 }, relationships: { [RelationshipId.SENIOR]: 5 } },
    maxOccurrences: 2
  },
  {
    id: 'senior_lab_gossip',
    trigger: 'action_senior',
    text: "【裏情報】「あの教授、実は猫好きらしいぜ」攻略に役立つ無駄知識を得た。",
    type: 'flavor',
    weight: 60, // 発生しやすい
    effect: { relationships: { [RelationshipId.SENIOR]: 8, [RelationshipId.PROFESSOR]: 2 }, sanity: 5 }
  },
  {
    id: 'senior_errand',
    trigger: 'action_senior',
    text: "【パシリ】「コンビニ行ってきて」...実験の合間にパシリに使われた。お駄賃にチョコを貰った。",
    type: 'flavor',
    weight: 40,
    conditions: { maxRelationship: 50 },
    effect: { hp: -10, relationships: { [RelationshipId.SENIOR]: 5 }, inventory: { [ItemId.HIGH_CACAO_CHOCO]: 1 } }
  },
  {
    id: 'senior_midnight_ramen',
    trigger: 'action_senior',
    text: "【夜食】「腹減ったろ？」深夜の研究室で二郎系ラーメンをご馳走になった。暴力的なカロリー。",
    type: 'good',
    weight: 50,
    conditions: { timeSlots: [TimeSlot.NIGHT, TimeSlot.LATE_NIGHT], minRelationship: 20 },
    effect: { hp: 30, sanity: 10, relationships: { [RelationshipId.SENIOR]: 10 } },
    coolDownTurns: 2
  },
  {
    id: 'senior_busy',
    trigger: 'action_senior',
    text: "【修羅場】先輩は卒論の締め切り前で死にかけている...が、机にあったチョコを「これ食って生きろ...」と分けてくれた。",
    type: 'flavor',
    weight: 20,
    effect: { inventory: { [ItemId.HIGH_CACAO_CHOCO]: 1 }, relationships: { [RelationshipId.SENIOR]: 2 } }
  },
  {
    id: 'senior_usb_gift',
    trigger: 'action_senior',
    text: "【遺産】「これやるよ、俺はもう卒業だから」謎のUSBメモリを託された。",
    type: 'good',
    weight: 10,
    conditions: { minRelationship: 70 },
    effect: { inventory: { [ItemId.USB_MEMORY]: 1 }, relationships: { [RelationshipId.SENIOR]: 10 } },
    maxOccurrences: 1
  },

  // ==========================================
  // FRIEND ACTIONS
  // ==========================================
  {
    id: 'friend_sns_share',
    trigger: 'action_friend',
    text: "【共有】講義のノート画像をAirDropで送り合った。「助かるわ～」という返信。",
    type: 'good',
    weight: 60, // 発生しやすい
    effect: { relationships: { [RelationshipId.FRIEND]: 8 }, knowledge: { [SubjectId.HUMANITIES]: 5 } }
  },
  {
    id: 'friend_game_talk',
    trigger: 'action_friend',
    text: "【遊戯】試験期間中だが、新作ゲームの話で盛り上がってしまった。後悔はない。",
    type: 'flavor',
    weight: 50,
    effect: { relationships: { [RelationshipId.FRIEND]: 10 }, sanity: 10, hp: 5 }
  },
  {
    id: 'friend_study_group',
    trigger: 'action_friend',
    text: "【協力】友人とノートを見せ合う。「ここ、去年の試験に出たらしいぞ」",
    type: 'good',
    weight: 40,
    conditions: { minSanity: 40 },
    effect: { sanity: 10, knowledge: { [SubjectId.ALGO]: 10 }, relationships: { [RelationshipId.FRIEND]: 5 } }
  },
  {
    id: 'friend_escapism',
    trigger: 'action_friend',
    text: "【誘惑】「カラオケ行こうぜ」断りきれずについて行った。ストレス発散にはなったが...。",
    type: 'flavor',
    weight: 30,
    conditions: { maxSanity: 50 },
    effect: { sanity: 25, hp: -10, relationships: { [RelationshipId.FRIEND]: 10 } },
    coolDownTurns: 2
  },
  {
    id: 'friend_depressed',
    trigger: 'action_friend',
    text: "【共鳴】友人も限界らしい。「もう辞めてぇ」と互いに愚痴り合い、負のループに陥った。",
    type: 'bad',
    weight: 20,
    conditions: { maxSanity: 30 },
    effect: { sanity: -15, relationships: { [RelationshipId.FRIEND]: 5 } }
  },
  {
    id: 'friend_smart_drug',
    trigger: 'action_friend',
    text: "【密売】「これ、個人輸入したやつなんだけど...」友人が怪しいサプリを分けてくれた。",
    type: 'flavor',
    weight: 5,
    conditions: { minRelationship: 60, maxSanity: 40 },
    effect: { inventory: { [ItemId.SMART_DRUG]: 1 }, relationships: { [RelationshipId.FRIEND]: 5 } },
    maxOccurrences: 1
  },

  // ==========================================
  // TURN END RELATIONSHIP EVENTS (PASSIVE)
  // ==========================================
  {
    id: 'turn_end_prof_nod',
    trigger: 'turn_end',
    text: "【会釈】構内で教授とすれ違い、軽く会釈された。顔を覚えられているようだ。",
    type: 'good',
    category: 'social',
    weight: 15,
    effect: { relationships: { [RelationshipId.PROFESSOR]: 3 } }
  },
  {
    id: 'turn_end_senior_wave',
    trigger: 'turn_end',
    text: "【遭遇】喫煙所の近くで先輩が手を振ってくれた。「ちゃんと寝ろよー」",
    type: 'good',
    category: 'social',
    weight: 15,
    effect: { relationships: { [RelationshipId.SENIOR]: 3 }, sanity: 3 }
  },
  {
    id: 'turn_end_friend_line',
    trigger: 'turn_end',
    text: "【通知】友人から「進捗どう？」というスタンプが届いた。生存確認。",
    type: 'good',
    category: 'social',
    weight: 15,
    effect: { relationships: { [RelationshipId.FRIEND]: 3 }, sanity: 3 }
  },

  // ==========================================
  // TURN END RANDOM EVENTS
  // ==========================================
  {
    id: 'god_youtube',
    trigger: 'turn_end',
    text: "【救済】YouTubeで「インド人の神解説動画」を発見。一瞬で理解度が跳ね上がった。",
    type: 'good',
    category: 'study_boost',
    weight: 8, // Probability reduced
    conditions: { maxAvgScore: 60 },
    effect: { knowledge: { [SubjectId.ALGO]: 15, [SubjectId.MATH]: 15 } },
    maxOccurrences: 1
  },
  {
    id: 'care_package',
    trigger: 'turn_end',
    text: "【補給】実家から救援物資が届いた。段ボール一杯の食料に涙が出る。",
    type: 'good',
    category: 'health_recovery',
    weight: 10,
    conditions: { maxHp: 40 },
    effect: { hp: 40, sanity: 20 },
    coolDownTurns: 10
  },
  {
    id: 'sudden_drowsiness',
    trigger: 'turn_end',
    text: "【睡魔】抗いがたい眠気が襲う。カフェインが切れたか...。",
    type: 'bad',
    category: 'drowsiness',
    weight: 30,
    conditions: { timeSlots: [TimeSlot.AFTERNOON, TimeSlot.NIGHT], caffeineMax: 9 },
    effect: { sanity: -10 },
    coolDownTurns: 3
  },
  { 
    id: 'git_conflict', 
    trigger: 'turn_end',
    text: "【悲報】Gitで巨大なコンフリクト発生。マージに失敗し、数時間の作業が虚無に消えた。", 
    type: 'bad',
    category: 'tech_trouble',
    weight: 15,
    conditions: { timeSlots: [TimeSlot.AFTER_SCHOOL, TimeSlot.NIGHT, TimeSlot.LATE_NIGHT] },
    effect: { sanity: -25 },
    coolDownTurns: 5
  },
  {
    id: 'stackoverflow_god',
    trigger: 'turn_end',
    text: "【救済】Stack Overflowで全く同じエラーの解決策を発見。ありがとう、名もなき先人。",
    type: 'good',
    category: 'tech_trouble',
    weight: 15,
    conditions: { minAvgScore: 20 },
    effect: { sanity: 15 },
    coolDownTurns: 5
  },
  {
    id: 'energy_sale',
    trigger: 'turn_end',
    text: "【補給】生協でエナドリが箱売りされている。思わず箱買いしてしまった。",
    type: 'good',
    category: 'item_get',
    weight: 10,
    conditions: { timeSlots: [TimeSlot.NOON, TimeSlot.AFTER_SCHOOL], caffeineMax: 100 },
    effect: { caffeine: 40, money: -500 },
    coolDownTurns: 8
  },
  {
    id: 'caffeine_crash',
    trigger: 'turn_end',
    text: "【反動】カフェインの効果が切れ、急激なダルさに襲われる。身体が鉛のように重い。",
    type: 'bad',
    weight: 40,
    conditions: { caffeineMin: 100 }, // Occurs when caffeine is high (Zone or Overdose)
    effect: { hp: -15, sanity: -15 },
    coolDownTurns: 3
  },
  { 
    id: 'rainy_day', 
    trigger: 'turn_end',
    text: "【天候】ゲリラ豪雨。傘がなく、濡れた服が体力を奪う。", 
    type: 'bad',
    weight: 20,
    conditions: { timeSlots: [TimeSlot.MORNING, TimeSlot.AFTER_SCHOOL, TimeSlot.NIGHT] },
    effect: { hp: -15 },
    coolDownTurns: 5
  },
  {
    id: 'blue_screen',
    trigger: 'turn_end',
    text: "【絶望】レポート保存直前にブルースクリーン。バックアップ？ とってないよ。",
    type: 'bad',
    weight: 3, // Rare but fatal
    effect: { sanity: -40 },
    maxOccurrences: 1
  }
];
