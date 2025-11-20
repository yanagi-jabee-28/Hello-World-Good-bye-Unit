
import { GameEvent, SubjectId, TimeSlot, RelationshipId, ItemId } from '../types';

export const LOG_MESSAGES = {
  start: "ブートシーケンス完了。これより7日間の地獄の試験対策期間を開始します。",
  
  study_morning_bonus: (subject: string) => `【朝の覚醒】静寂な自室。登校前の貴重な時間で${subject}の予習が進む。`,
  study_am_normal: (subject: string) => `【午前の講義】${subject}の講義に出席。教授のマシンガントークを必死にメモする。`,
  study_noon_drowsy: (subject: string) => `【昼の喧騒】学食のざわめきの中で${subject}のノートを開くが、集中できない。`,
  study_afternoon_fight: (subject: string) => `【午後の睡魔】${subject}の演習中、強烈な眠気が襲う。意識を保つだけでHPが削られる。`,
  study_after_school_focus: (subject: string) => `【放課後の集中】講義終了。図書館に籠もり、${subject}の課題を一気に片付ける。`,
  study_caffeine_awake: (subject: string) => `【強制覚醒】血管にカフェインが走る。昼休みだが${subject}への集中力が維持されている。`,
  study_night_tired: (subject: string) => `【夜の疲労】帰宅後の机。${subject}に取り組むが、脳が悲鳴を上げている。`,
  study_late_night_zone: (subject: string) => `【深夜のゾーン】午前3時。${subject}の方程式が、宇宙の真理に見えてきた。`,
  study_late_night_fail: (subject: string) => `【深夜の寝落ち】気づけば朝だった。${subject}のノートには解読不能なミミズ文字が...。`,
  
  study_jitter: "指先が震え、動悸が止まらない... 精神が削られていく感覚がある。",
  
  madness_gameover: "【思考停止】プツン、と何かが切れる音がした。現実と夢の境界が曖昧になる。ドロップアウト。",
  hp_gameover: "【緊急搬送】視界がブラックアウト。栄養失調と睡眠不足で倒れ、試験を受けることなく終わった。",
  
  rest_success: "布団に入って泥のように眠った。HPとSAN値が回復した。",
  rest_short: "机に突っ伏して仮眠をとった。身体が痛いが、頭は少しスッキリした。",
  rest_caffeine_fail: "目を閉じると瞼の裏で極彩色の図形が回転している。一睡もできず、SAN値だけが減っていく。",
  
  caffeine_ingest: "エナドリのプルタブを開ける。脳が強制再起動される感覚。体力が漲るが、得体の知れない焦燥感が襲う。",
  
  victory: "合格発表日。掲示板に自分の番号を見つけた。灰色の空が、少しだけ青く見えた。",
  failure: "不合格。留年確定。親への言い訳を考えながら、重い足取りで帰路につく...",
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
    text: "【質問】研究室を訪ねた。「ここは試験に出るぞ」という極秘情報を引き出した！",
    type: 'good',
    weight: 50,
    effect: { relationships: { [RelationshipId.PROFESSOR]: 5 }, knowledge: { [SubjectId.MATH]: 5 } } // ランダム科目はReducer側で補正
  },
  {
    id: 'prof_basic_fail',
    trigger: 'action_professor',
    text: "【門前払い】「シラバスを読め」と一蹴された。教授は機嫌が悪かったようだ。",
    type: 'bad',
    weight: 30,
    conditions: { maxRelationship: 40 },
    effect: { relationships: { [RelationshipId.PROFESSOR]: 2 }, hp: -5 }
  },
  {
    id: 'prof_high_rel_discussion',
    trigger: 'action_professor',
    text: "【白熱】教授と専門的な議論で盛り上がった。対等な研究者として扱われている気がする。",
    type: 'good',
    weight: 40,
    conditions: { minRelationship: 60, minAvgScore: 70 },
    effect: { relationships: { [RelationshipId.PROFESSOR]: 15 }, sanity: 10 },
    coolDownTurns: 3
  },
  {
    id: 'prof_tea_time',
    trigger: 'action_professor',
    text: "【茶会】「まあ座りたまえ」高級な紅茶とクッキーを振る舞われた。束の間の休息。",
    type: 'good',
    weight: 20,
    conditions: { minRelationship: 50 },
    effect: { hp: 15, sanity: 15, relationships: { [RelationshipId.PROFESSOR]: 5 } },
    coolDownTurns: 5
  },
  {
    id: 'prof_scolding',
    trigger: 'action_professor',
    text: "【説教】「君、この基礎が分かってないのは致命的だよ」...1時間説教された。",
    type: 'bad',
    weight: 40,
    conditions: { maxAvgScore: 40 },
    effect: { sanity: -15, knowledge: { [SubjectId.HUMANITIES]: 5 } }, // 知識は増えるがSANは減る
    coolDownTurns: 3
  },

  // ==========================================
  // SENIOR ACTIONS
  // ==========================================
  {
    id: 'senior_past_exam',
    trigger: 'action_senior',
    text: "【継承】研究室の先輩が、代々伝わる「秘伝の過去問」をこっそり渡してくれた！",
    type: 'good',
    weight: 30,
    conditions: { minRelationship: 30 },
    effect: { knowledge: { [SubjectId.CIRCUIT]: 15 }, relationships: { [RelationshipId.SENIOR]: 5 } },
    maxOccurrences: 2
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
    text: "【夜食】「腹減ったろ？」深夜の研究室でカップ麺をご馳走になった。背徳的な味がする。",
    type: 'good',
    weight: 50,
    conditions: { timeSlots: [TimeSlot.NIGHT, TimeSlot.LATE_NIGHT], minRelationship: 20 },
    effect: { hp: 20, sanity: 10, relationships: { [RelationshipId.SENIOR]: 10 } },
    coolDownTurns: 2
  },
  {
    id: 'senior_busy',
    trigger: 'action_senior',
    text: "【修羅場】先輩は学会発表前で殺気立っている...声をかけられる雰囲気ではなかった。",
    type: 'bad',
    weight: 20,
    effect: { sanity: -5 }
  },
  {
    id: 'senior_usb_gift',
    trigger: 'action_senior',
    text: "【遺産】「これやるよ、俺はもう単位取ったから」謎のUSBメモリを託された。",
    type: 'good',
    weight: 10,
    conditions: { minRelationship: 60 },
    effect: { inventory: { [ItemId.USB_MEMORY]: 1 }, relationships: { [RelationshipId.SENIOR]: 10 } },
    maxOccurrences: 1
  },

  // ==========================================
  // FRIEND ACTIONS
  // ==========================================
  {
    id: 'friend_study_group',
    trigger: 'action_friend',
    text: "【協力】友人とノートを見せ合う。「ここの計算、間違ってるぞ」と指摘され、命拾いした。",
    type: 'good',
    weight: 40,
    conditions: { minSanity: 40 },
    effect: { sanity: 10, knowledge: { [SubjectId.ALGO]: 5 }, relationships: { [RelationshipId.FRIEND]: 5 } }
  },
  {
    id: 'friend_escapism',
    trigger: 'action_friend',
    text: "【誘惑】「一杯だけ...」のつもりが、気づけば3時間。楽しいが、罪悪感が凄い。",
    type: 'flavor',
    weight: 30,
    conditions: { maxSanity: 50 }, // SAN値が低いと逃避しやすい
    effect: { sanity: 20, hp: -5, relationships: { [RelationshipId.FRIEND]: 10 } }, // 勉強効果なし
    coolDownTurns: 2
  },
  {
    id: 'friend_depressed',
    trigger: 'action_friend',
    text: "【共鳴】友人も限界らしい。「もう無理だ」と互いに愚痴り合い、負のループに陥った。",
    type: 'bad',
    weight: 20,
    conditions: { maxSanity: 30 },
    effect: { sanity: -10, relationships: { [RelationshipId.FRIEND]: 5 } }
  },
  {
    id: 'friend_smart_drug',
    trigger: 'action_friend',
    text: "【密売】「これ、効くぜ...」友人が怪しいサプリを分けてくれた。",
    type: 'flavor',
    weight: 5,
    conditions: { minRelationship: 50, maxSanity: 40 },
    effect: { inventory: { [ItemId.SMART_DRUG]: 1 }, relationships: { [RelationshipId.FRIEND]: 5 } },
    maxOccurrences: 1
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
    weight: 15,
    conditions: { maxAvgScore: 50 },
    effect: { knowledge: { [SubjectId.ALGO]: 15, [SubjectId.MATH]: 15 } },
    maxOccurrences: 1
  },
  {
    id: 'care_package',
    trigger: 'turn_end',
    text: "【補給】実家から救援物資が届いた。レトルト食品とお菓子に涙が出る。",
    type: 'good',
    category: 'health_recovery',
    weight: 10,
    conditions: { maxHp: 50 },
    effect: { hp: 40, sanity: 30 },
    coolDownTurns: 10
  },
  {
    id: 'cat_encounter',
    trigger: 'turn_end',
    text: "【癒やし】キャンパス内の野良猫が膝に乗ってきた。温もりに荒んだ心が浄化される。",
    type: 'good',
    category: 'health_recovery',
    weight: 20,
    conditions: { timeSlots: [TimeSlot.NOON, TimeSlot.AFTER_SCHOOL] },
    effect: { sanity: 25 },
    coolDownTurns: 5
  },
  {
    id: 'sudden_drowsiness',
    trigger: 'turn_end',
    text: "【睡魔】抗いがたい眠気が襲う。瞼が鉛のように重い...。",
    type: 'bad',
    category: 'drowsiness',
    weight: 30,
    conditions: { timeSlots: [TimeSlot.AFTERNOON, TimeSlot.NIGHT], caffeineMax: 50 }, // カフェインがあれば起きない
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
    effect: { sanity: -20 },
    coolDownTurns: 5
  },
  {
    id: 'stackoverflow_god',
    trigger: 'turn_end',
    text: "【救済】Stack Overflowで全く同じエラーの解決策を発見。神はインドにいた。",
    type: 'good',
    category: 'tech_trouble', // トラブル解決系
    weight: 10,
    conditions: { minAvgScore: 30 },
    effect: { sanity: 15 },
    coolDownTurns: 5
  },
  {
    id: 'energy_sale',
    trigger: 'turn_end',
    text: "【補給】生協でエナドリが箱売りされている。カフェインの備蓄が増えた。",
    type: 'good',
    category: 'item_get',
    weight: 15,
    conditions: { timeSlots: [TimeSlot.NOON, TimeSlot.AFTER_SCHOOL] },
    effect: { caffeine: 30 },
    coolDownTurns: 8
  },
  {
    id: 'phantom_vibration',
    trigger: 'turn_end',
    text: "【幻覚】ポケットのスマホが震えた気がしたが、着信などない。神経が過敏になっている。",
    type: 'flavor',
    weight: 25,
    conditions: { maxSanity: 40 },
    effect: { sanity: -5 },
    decay: 0.8 // 起きるたびに確率は減る
  },
  { 
    id: 'rainy_day', 
    trigger: 'turn_end',
    text: "【天候】ゲリラ豪雨。傘がなく、濡れた服が体力を奪う。", 
    type: 'bad',
    weight: 20,
    conditions: { timeSlots: [TimeSlot.MORNING, TimeSlot.AFTER_SCHOOL, TimeSlot.NIGHT] },
    effect: { hp: -12 },
    coolDownTurns: 5
  },
  {
    id: 'train_delay',
    trigger: 'turn_end',
    text: "【トラブル】人身事故で電車が遅延。満員電車で圧死しかけた。",
    type: 'bad',
    weight: 15,
    conditions: { timeSlots: [TimeSlot.MORNING] },
    effect: { hp: -15 },
    coolDownTurns: 5
  },
  {
    id: 'blue_screen',
    trigger: 'turn_end',
    text: "【絶望】レポート保存直前にブルースクリーン。バックアップ？ とってないよ。",
    type: 'bad',
    weight: 5, // レアだが致命的
    effect: { sanity: -30 },
    maxOccurrences: 1
  }
];
