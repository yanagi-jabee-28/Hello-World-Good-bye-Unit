import { RandomEvent, SubjectId, TimeSlot, RelationshipId, ItemId } from '../types';

export const LOG_MESSAGES = {
  start: "ブートシーケンス完了。これより7日間の地獄の試験対策期間を開始します。",
  
  // Study Messages
  study_morning_bonus: (subject: string) => `【朝の覚醒】静寂な自室。登校前の貴重な時間で${subject}の予習が進む。(効率UP)`,
  study_am_normal: (subject: string) => `【午前の講義】${subject}の講義に出席。教授のマシンガントークを必死にメモする。`,
  study_noon_drowsy: (subject: string) => `【昼の喧騒】学食のざわめきの中で${subject}のノートを開くが、集中できない。(効率DOWN)`,
  study_afternoon_fight: (subject: string) => `【午後の睡魔】${subject}の演習中、強烈な眠気が襲う。意識を保つだけでHPが削られる。(HP消費増)`,
  study_after_school_focus: (subject: string) => `【放課後の集中】講義終了。図書館に籠もり、${subject}の課題を一気に片付ける。(効率良)`,
  study_caffeine_awake: (subject: string) => `【強制覚醒】血管にカフェインが走る。昼休みだが${subject}への集中力が維持されている。(効率維持)`,
  study_night_tired: (subject: string) => `【夜の疲労】帰宅後の机。${subject}に取り組むが、脳が悲鳴を上げている。(効率微減)`,
  study_late_night_zone: (subject: string) => `【深夜のゾーン】午前3時。${subject}の方程式が、宇宙の真理に見えてきた。(超効率)`,
  study_late_night_fail: (subject: string) => `【深夜の寝落ち】気づけば朝だった。${subject}のノートには解読不能なミミズ文字が...。(失敗)`,
  
  study_excellent: (subject: string) => `【会心】${subject}の難問が解けた！脳内でドーパミンが溢れ出す。`,
  study_jitter: "指先が震え、動悸が止まらない... 精神が削られていく感覚がある。(SAN・HP消費増)",
  
  // Status Changes
  madness_gameover: "【思考停止】プツン、と何かが切れる音がした。現実と夢の境界が曖昧になる。ドロップアウト。",
  hp_gameover: "【緊急搬送】視界がブラックアウト。栄養失調と睡眠不足で倒れ、試験を受けることなく終わった。",
  
  // Rest
  rest_success: "布団に入って泥のように眠った。HPとSAN値が回復した。",
  rest_short: "机に突っ伏して仮眠をとった。身体が痛いが、頭は少しスッキリした。",
  rest_caffeine_fail: "目を閉じると瞼の裏で極彩色の図形が回転している。一睡もできず、SAN値だけが減っていく。(SAN減少)",
  rest_nightmare: "単位が全て「F」になる夢を見た。最悪の目覚めだ。",
  
  // Actions
  caffeine_ingest: "エナドリのプルタブを開ける。脳が強制再起動される感覚。体力が漲るが、得体の知れない焦燥感が襲う。(HP回復 / SAN減少)",
  
  // Professor
  prof_success: "講義後に教授を突撃。「ここ、試験に出すぞ」という極秘情報を引き出した！",
  prof_fail: "「シラバスを読め」と一蹴された。教授は機嫌が悪かったようだ。",
  prof_absent: "教授室は真っ暗だ。タイミングが悪かった。",
  
  // Senior
  senior_success: "研究室に住んでいる先輩を発見。カップ麺と引き換えに過去問を貰った！",
  senior_busy: "先輩は学会発表の準備で修羅場だった。話しかけられる雰囲気ではない。",
  
  // Friend
  friend_share: "友人とノートを見せ合う。「ここの計算、間違ってるぞ」と指摘され、命拾いした。(SAN回復)",
  friend_play: "「一杯だけ」のつもりが、気づけば3時間経っていた。楽しいが、罪悪感が凄い。",
  
  // Endings
  victory: "合格発表日。掲示板に自分の番号を見つけた。灰色の空が、少しだけ青く見えた。",
  failure: "不合格。留年確定。親への言い訳を考えながら、重い足取りで帰路につく...",
};

export const RANDOM_EVENTS: RandomEvent[] = [
  // --- 1. Study Boost (High priority when Score is low) ---
  {
    id: 'god_youtube',
    text: "【救済】YouTubeで「インド人の神解説動画」を発見。一瞬で理解度が跳ね上がった。",
    type: 'good',
    category: 'study_boost',
    effect: { knowledge: { [SubjectId.ALGO]: 15, [SubjectId.MATH]: 15 } }, // 複数科目アップ
    maxAvgScore: 50
  },
  {
    id: 'past_exam_leak',
    text: "【発掘】学科の共有サーバーの深層から、去年の過去問フォルダを発見した！",
    type: 'good',
    category: 'study_boost',
    effect: { knowledge: { [SubjectId.CIRCUIT]: 20, [SubjectId.HUMANITIES]: 20 } },
    maxAvgScore: 60
  },
  {
    id: 'borrowed_notes',
    text: "【幸運】欠席した回のノートを友人が完璧に取っていた。コピーさせて貰い、命拾いした。",
    type: 'good',
    category: 'study_boost',
    effect: { knowledge: { [SubjectId.HUMANITIES]: 15, [SubjectId.MATH]: 10 } },
    maxAvgScore: 55,
    allowedTimeSlots: [TimeSlot.NOON, TimeSlot.AFTER_SCHOOL]
  },
  {
    id: 'easy_article',
    text: "【理解】「サルでもわかる」シリーズの技術記事が本当に分かりやすかった。基礎が固まる。",
    type: 'good',
    category: 'study_boost',
    effect: { sanity: 5, knowledge: { [SubjectId.ALGO]: 10 } },
    maxAvgScore: 45
  },
  {
    id: 'academic_high',
    text: "【覚醒】歩いているだけで解法が頭に浮かぶ。「完全に理解した」状態だ。(SAN大回復)",
    type: 'good',
    category: 'study_boost',
    effect: { sanity: 20 },
    minAvgScore: 70
  },

  // --- 2. Health/Sanity Recovery (High priority when HP/SAN is low) ---
  {
    id: 'care_package',
    text: "【補給】実家から救援物資が届いた。レトルト食品とお菓子に涙が出る。(HP/SAN大回復)",
    type: 'good',
    category: 'health_recovery',
    effect: { hp: 40, sanity: 30 },
  },
  {
    id: 'cat_encounter',
    text: "【癒やし】キャンパス内の野良猫が膝に乗ってきた。温もりに荒んだ心が浄化される。(SAN大回復)",
    type: 'good',
    category: 'health_recovery',
    effect: { sanity: 30 },
    allowedTimeSlots: [TimeSlot.NOON, TimeSlot.AFTER_SCHOOL]
  },
  {
    id: 'ramen_jiro',
    text: "【魔剤】「全マシマシ」 暴力的なカロリーと塩分が五臓六腑に染み渡る。(HP大回復/SAN回復/カフェイン低下)",
    type: 'good',
    category: 'health_recovery',
    effect: { hp: 30, sanity: 15, caffeine: -30 },
    allowedTimeSlots: [TimeSlot.NOON, TimeSlot.NIGHT]
  },
  {
    id: 'late_night_convenience',
    text: "【徘徊】深夜のコンビニへ散歩に出た。冷たい空気が熱った脳を冷やす。(SAN回復/カフェイン微減)",
    type: 'good',
    category: 'health_recovery',
    effect: { sanity: 10, caffeine: -5 },
    allowedTimeSlots: [TimeSlot.LATE_NIGHT]
  },
  {
    id: 'senior_treat',
    text: "【イベント】研究室の先輩が「実験の手伝い」の礼に焼肉を奢ってくれた！ (HP/SAN大回復)",
    type: 'good',
    category: 'health_recovery',
    effect: { hp: 30, sanity: 20 },
    allowedTimeSlots: [TimeSlot.NIGHT]
  },

  // --- 3. Drowsiness (Blocked by Caffeine) ---
  {
    id: 'sudden_drowsiness',
    text: "【睡魔】抗いがたい眠気が襲う。瞼が鉛のように重い...。(集中力低下/SAN減少)",
    type: 'bad',
    category: 'drowsiness',
    effect: { sanity: -10 }, // カフェインがあれば防げる
    allowedTimeSlots: [TimeSlot.AFTERNOON, TimeSlot.NIGHT]
  },
  {
    id: 'boring_lecture',
    text: "【苦行】教授の話がお経に聞こえる。意識を保つための戦いが始まった。(HP消費)",
    type: 'bad',
    category: 'drowsiness',
    effect: { hp: -10 },
    allowedTimeSlots: [TimeSlot.AM, TimeSlot.AFTERNOON]
  },
  {
    id: 'monotone_voice',
    text: "【ASMR】教授の声が心地よすぎる。これは講義ではない、睡眠導入音声だ。(効率低下)",
    type: 'bad',
    category: 'drowsiness',
    effect: { hp: -5, sanity: -5 },
    allowedTimeSlots: [TimeSlot.AM, TimeSlot.AFTERNOON]
  },
  {
    id: 'warm_room',
    text: "【環境】暖房が効きすぎている。自律神経が「寝ろ」と命令している。(効率低下)",
    type: 'bad',
    category: 'drowsiness',
    effect: { sanity: -5 },
    allowedTimeSlots: [TimeSlot.AFTER_SCHOOL, TimeSlot.NIGHT]
  },

  // --- 4. Tech Troubles (Bad events) ---
  { 
    id: 'git_conflict', 
    text: "【悲報】Gitで巨大なコンフリクト発生。マージに失敗し、数時間の作業が虚無に消えた。(SAN大幅減)", 
    type: 'bad',
    category: 'tech_trouble',
    effect: { sanity: -20 },
    allowedTimeSlots: [TimeSlot.AFTER_SCHOOL, TimeSlot.NIGHT, TimeSlot.LATE_NIGHT]
  },
  { 
    id: 'seg_fault', 
    text: "【絶望】Segmentation fault (core dumped)。原因不明のメモリエラーが精神を蝕む。(SAN減少)", 
    type: 'bad',
    category: 'tech_trouble',
    effect: { sanity: -10 },
    allowedTimeSlots: [TimeSlot.AM, TimeSlot.AFTERNOON, TimeSlot.AFTER_SCHOOL, TimeSlot.NIGHT]
  },
  { 
    id: 'windows_update', 
    text: "【罠】いいところだったのにWindows Updateが開始された。「電源を切らないでください」の文字が無慈悲に輝く。(SAN減少)", 
    type: 'bad',
    category: 'tech_trouble',
    effect: { sanity: -12 }
  },
  {
    id: 'infinite_loop',
    text: "【ミス】無限ループでサーバーをダウンさせた。学科の管理者から呼び出しメールが届く。(HP/SAN減少)",
    type: 'bad',
    category: 'tech_trouble',
    effect: { hp: -8, sanity: -12 },
    allowedTimeSlots: [TimeSlot.AFTER_SCHOOL, TimeSlot.NIGHT]
  },
  {
    id: 'keyboard_crusher',
    text: "【発狂】何度見直してもバグが取れない。衝動的にキーボードを叩きつけそうになり、自己嫌悪に陥る。(SAN減少)",
    type: 'bad',
    category: 'tech_trouble',
    effect: { sanity: -15 },
    maxAvgScore: 50
  },
  { 
    id: 'pc_freeze', 
    text: "【トラブル】PCがブルースクリーンに！ レポートのバックアップを取っていなかった... (SAN大幅減)", 
    type: 'bad',
    category: 'tech_trouble',
    effect: { sanity: -20 }
  },
  {
    id: 'wifi_down',
    text: "【トラブル】学内Wi-Fiがダウン。テザリングで凌いだが、パケット死した。(SAN微減)",
    type: 'bad',
    category: 'tech_trouble',
    effect: { sanity: -5 },
    allowedTimeSlots: [TimeSlot.AM, TimeSlot.AFTERNOON]
  },
  {
    id: 'printer_jam',
    text: "【トラブル】提出直前にプリンターが紙詰まり。事務室に駆け込み、冷や汗をかいた。 (SAN減少)",
    type: 'bad',
    category: 'tech_trouble',
    effect: { sanity: -10 },
    allowedTimeSlots: [TimeSlot.AM, TimeSlot.AFTERNOON]
  },

  // --- 5. Tech Miracles (Good Tech events) ---
  {
    id: 'stackoverflow_god',
    text: "【救済】Stack Overflowで全く同じエラーの解決策を発見。神はインドにいた。(SAN回復)",
    type: 'good',
    category: 'health_recovery', // SAN回復なのでRecovery
    effect: { sanity: 15 },
    minAvgScore: 30
  },
  {
    id: 'copilot_awakening',
    text: "【覚醒】AIが心を読んだかのような完璧なコードを補完した。生産性が爆上がり。(HP温存)",
    type: 'good',
    category: 'study_boost',
    effect: { sanity: 10, hp: 5 }
  },
  {
    id: 'rubber_duck',
    text: "【閃き】アヒルのおもちゃにコードを説明していたら、バグの原因に気づいた。(SAN回復)",
    type: 'good',
    category: 'health_recovery',
    effect: { sanity: 10 },
    allowedTimeSlots: [TimeSlot.NIGHT, TimeSlot.LATE_NIGHT]
  },

  // --- 6. Item & Social ---
  {
    id: 'energy_sale',
    text: "【補給】生協でエナドリが箱売りされている。カフェインの備蓄が増えた。(カフェイン上昇)",
    type: 'good',
    category: 'item_get',
    effect: { caffeine: 30 },
    allowedTimeSlots: [TimeSlot.NOON, TimeSlot.AFTER_SCHOOL]
  },
  {
    id: 'tutoring',
    text: "【人望】友人に難解な定理を解説した。「お前マジで神だわ」と崇められた。(友好度UP)",
    type: 'good',
    category: 'social',
    effect: { relationships: { [RelationshipId.FRIEND]: 15 } },
    minAvgScore: 60,
    allowedTimeSlots: [TimeSlot.NOON, TimeSlot.AFTER_SCHOOL]
  },
  {
    id: 'prof_praise',
    text: "【称賛】教授の鋭い質問に完璧に回答した。講義室がどよめき、教授も満足げだ。(友好度大幅UP)",
    type: 'good',
    category: 'social',
    effect: { relationships: { [RelationshipId.PROFESSOR]: 25 }, sanity: 15 },
    minAvgScore: 80,
    allowedTimeSlots: [TimeSlot.AM, TimeSlot.AFTERNOON]
  },

  // --- 7. Flavor / Environment ---
  {
    id: 'phantom_vibration',
    text: "【幻覚】ポケットのスマホが震えた気がしたが、着信などない。神経が過敏になっている。(SAN微減)",
    type: 'flavor',
    category: 'flavor',
    effect: { sanity: -5 },
    allowedTimeSlots: [TimeSlot.AM, TimeSlot.AFTERNOON, TimeSlot.NIGHT]
  },
  {
    id: 'caffeine_crash',
    text: "【離脱症状】カフェインが切れた。鉛のような重力が身体を押し潰す。(HP減少)",
    type: 'bad',
    category: 'flavor', // Drowsinessではない（カフェインで防げない、むしろカフェイン切れ）
    effect: { hp: -15 },
    allowedTimeSlots: [TimeSlot.AFTERNOON, TimeSlot.NIGHT]
  },
  { 
    id: 'rainy_day', 
    text: "【天候】ゲリラ豪雨。傘がなく、濡れた服が体力を奪う。 (HP減少)", 
    type: 'bad',
    category: 'flavor',
    effect: { hp: -12 },
    allowedTimeSlots: [TimeSlot.MORNING, TimeSlot.AFTER_SCHOOL, TimeSlot.NIGHT]
  },
  {
    id: 'train_delay',
    text: "【トラブル】人身事故で電車が遅延。満員電車で圧死しかけた。 (HP減少)",
    type: 'bad',
    category: 'flavor',
    effect: { hp: -15 },
    allowedTimeSlots: [TimeSlot.MORNING]
  },
  {
    id: 'gibberish_board',
    text: "【絶望】黒板の数式がエイリアンの言語に見える。基礎が完全に欠落している... (SAN大幅減)",
    type: 'bad',
    category: 'flavor',
    effect: { sanity: -15 },
    maxAvgScore: 40,
    allowedTimeSlots: [TimeSlot.AM, TimeSlot.AFTERNOON]
  },
  {
    id: 'dropout_invitation',
    text: "【誘惑】「もう諦めて来年頑張ろうぜ」留年確定の友人が、優しい笑顔で沼へ手招きしている。(SAN微減)",
    type: 'flavor',
    category: 'flavor',
    effect: { sanity: -8 },
    maxAvgScore: 35
  },
  {
    id: 'cafeteria_crowd',
    text: "【トラブル】学食が激混み。パンの自販機で行列に並び、貴重な昼休みが潰れた。 (休息効果減)",
    type: 'bad',
    category: 'flavor',
    effect: { hp: -5, sanity: -5 },
    allowedTimeSlots: [TimeSlot.NOON]
  },
  {
    id: 'cancelled_class',
    text: "【ラッキー】教授の急病で講義が休講に！ 思いがけない自習時間が生まれた。 (体力温存)",
    type: 'good',
    category: 'health_recovery',
    effect: { hp: 10, sanity: 5 },
    allowedTimeSlots: [TimeSlot.AM, TimeSlot.AFTERNOON]
  }
];