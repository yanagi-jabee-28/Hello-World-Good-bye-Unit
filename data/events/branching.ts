
import { GameEvent, RelationshipId, SubjectId, ItemId, TimeSlot } from '../../types';
import { WEIGHTS, COOLDOWNS, REL_TIERS, RECOVERY_VALS, KNOWLEDGE_GAINS, REL_GAINS } from '../../config/gameBalance';

export const BRANCHING_EVENTS: GameEvent[] = [
  // --- NEW: INTERACTION MENUS (Triggered directly by handlers) ---
  
  // 1. Professor Menu (Rel >= 60)
  {
    id: 'prof_interaction_menu',
    trigger: 'action_professor',
    text: "【教授室】教授は在室のようだ。どうする？",
    type: 'mixed',
    weight: 0, // Handled manually
    options: [
      {
        id: 'opt_prof_ask_exam',
        label: '今回の試験について聞く',
        risk: 'low',
        description: '出題傾向を探る。確実な情報が得られる。',
        successRate: 90,
        successEffect: {
          knowledge: { [SubjectId.ALGO]: KNOWLEDGE_GAINS.LARGE },
          relationships: { [RelationshipId.PROFESSOR]: REL_GAINS.SMALL }
        },
        successLog: "「ここは重点的にやっておきたまえ」試験のヒントを得た。",
        failureEffect: { relationships: { [RelationshipId.PROFESSOR]: -2 } },
        failureLog: "「講義で言ったはずだがね」軽くあしらわれた。"
      },
      {
        id: 'opt_prof_ask_paper',
        label: '過去問をお願いする',
        risk: 'high',
        description: '直球勝負。成功すればデカイが、心証を損ねるリスクあり。',
        successRate: 40,
        successEffect: {
          inventory: { [ItemId.USB_MEMORY]: 1 },
          relationships: { [RelationshipId.PROFESSOR]: REL_GAINS.MEDIUM }
        },
        successLog: "「君の熱意に免じて特別だ」...なんと、教授自らデータをくれた！",
        failureEffect: {
          relationships: { [RelationshipId.PROFESSOR]: -15 },
          sanity: -10
        },
        failureLog: "「学生の本分を履き違えるな！」厳しく叱責された。"
      },
      {
        id: 'opt_prof_ask_book',
        label: '参考書籍を借りる',
        risk: 'low',
        description: '学習資料をねだる。',
        successRate: 60,
        successEffect: {
          inventory: { [ItemId.REFERENCE_BOOK]: 1 },
          relationships: { [RelationshipId.PROFESSOR]: REL_GAINS.Qm }
        },
        successLog: "「これを持っていくといい」教授の著書を貸してもらった。",
        failureEffect: { relationships: { [RelationshipId.PROFESSOR]: -5 } },
        failureLog: "貸せる本はないと断られた。"
      }
    ]
  },

  // 2. Senior Menu (Rel >= 50)
  {
    id: 'senior_interaction_menu',
    trigger: 'action_senior',
    text: "【先輩】「おっ、どうした？なんか用か？」",
    type: 'mixed',
    weight: 0, // Handled manually
    options: [
      {
        id: 'opt_senior_meal',
        label: 'ご飯に行きましょう',
        risk: 'safe',
        description: '奢ってもらって回復する。',
        successRate: 100,
        successEffect: {
          hp: RECOVERY_VALS.LARGE,
          sanity: RECOVERY_VALS.SMALL,
          relationships: { [RelationshipId.SENIOR]: REL_GAINS.MEDIUM }
        },
        successLog: "学食で一番高い定食を奢ってもらった。「しっかり食えよ！」"
      },
      {
        id: 'opt_senior_past_paper',
        label: '過去問ください！',
        risk: 'low',
        description: '先輩のコネに頼る。',
        successRate: 60,
        successEffect: {
          inventory: { [ItemId.USB_MEMORY]: 1 },
          knowledge: { [SubjectId.CIRCUIT]: KNOWLEDGE_GAINS.LARGE },
          relationships: { [RelationshipId.SENIOR]: REL_GAINS.LARGE }
        },
        successLog: "「しょうがねぇなぁ」秘蔵のフォルダを共有してくれた。",
        failureEffect: { relationships: { [RelationshipId.SENIOR]: -5 } },
        failureLog: "「今は手元にないなー」空振りに終わった。"
      },
      {
        id: 'opt_senior_item',
        label: '何かいいモノないですか',
        risk: 'low',
        description: 'アイテムをねだる。',
        successRate: 70,
        successEffect: {
          inventory: { [ItemId.ENERGY_DRINK]: 1 },
          relationships: { [RelationshipId.SENIOR]: REL_GAINS.Qm }
        },
        successLog: "「これでも飲んで頑張れ」エナドリを恵んでくれた。",
        failureEffect: { relationships: { [RelationshipId.SENIOR]: -2 } },
        failureLog: "「俺が欲しいくらいだよ」と笑われた。"
      }
    ]
  },

  // 3. Friend Menu (Rel >= 40)
  {
    id: 'friend_interaction_menu',
    trigger: 'action_friend',
    text: "【友人】「よっ。これからどうする？」",
    type: 'mixed',
    weight: 0, // Handled manually
    options: [
      {
        id: 'opt_friend_heal_hp',
        label: 'HP回復 (休憩)',
        risk: 'safe',
        description: 'のんびり過ごして体力を回復する。',
        successRate: 100,
        successEffect: {
          hp: RECOVERY_VALS.LARGE,
          relationships: { [RelationshipId.FRIEND]: REL_GAINS.Qm }
        },
        successLog: "ダラダラと過ごして体力を回復した。"
      },
      {
        id: 'opt_friend_heal_san',
        label: 'SAN回復 (遊び)',
        risk: 'safe',
        description: 'パーッと遊んでストレス発散。',
        successRate: 100,
        successEffect: {
          sanity: RECOVERY_VALS.LARGE,
          relationships: { [RelationshipId.FRIEND]: REL_GAINS.Qm }
        },
        successLog: "愚痴を言い合ってスッキリした。"
      },
      {
        id: 'opt_friend_study',
        label: '一緒に勉強する',
        risk: 'low',
        description: '真面目に課題をこなす。',
        successRate: 90,
        successEffect: {
          knowledge: { [SubjectId.HUMANITIES]: KNOWLEDGE_GAINS.MEDIUM },
          relationships: { [RelationshipId.FRIEND]: REL_GAINS.MEDIUM }
        },
        successLog: "一人でやるより捗った気がする。",
        failureEffect: { sanity: -5 },
        failureLog: "結局お喋りして終わってしまった..."
      },
      {
        id: 'opt_friend_random',
        label: 'おまかせ',
        risk: 'high',
        description: '友人の提案に乗る。何が起こるかわからない。',
        successRate: 50,
        successEffect: {
          money: 1000,
          relationships: { [RelationshipId.FRIEND]: REL_GAINS.LARGE }
        },
        successLog: "「パチンコで勝ったから奢るわ！」ラッキーだ。",
        failureEffect: {
          hp: -10,
          sanity: -10
        },
        failureLog: "変なトラブルに巻き込まれて疲弊した..."
      }
    ]
  },

  // --- PROFESSOR EVENTS (Existing) ---
  {
    id: 'prof_special_task',
    trigger: 'action_professor',
    text: "【打診】教授から研究室のデータ整理を手伝わされた。「君なら信用できると思ってね」",
    type: 'mixed',
    weight: WEIGHTS.UNCOMMON,
    conditions: { minRelationship: REL_TIERS.MID },
    coolDownTurns: COOLDOWNS.LONG,
    options: [
      {
        id: 'opt_prof_task_accept',
        label: '手伝う (堅実)',
        risk: 'safe',
        description: '地道に作業する。友好度は確実に上がる。',
        successRate: 100,
        successEffect: {
          relationships: { [RelationshipId.PROFESSOR]: 8 },
          hp: -10,
          sanity: -5
        },
        successLog: "数時間かけてデータを整理した。教授から感謝され、お茶をご馳走になった。"
      },
      {
        id: 'opt_prof_task_script',
        label: 'スクリプト化 (挑戦)',
        risk: 'high',
        description: '自動化プログラムを組む。成功すれば絶大な評価。失敗は許されない。',
        successRate: 40,
        successEffect: {
          relationships: { [RelationshipId.PROFESSOR]: 25 },
          knowledge: { [SubjectId.ALGO]: 15 },
          sanity: 10
        },
        successLog: "完璧な自動化スクリプトを提出した！「素晴らしい！君は天才か？」教授は大興奮だ。",
        failureEffect: {
          relationships: { [RelationshipId.PROFESSOR]: -10 },
          sanity: -20,
          hp: -15
        },
        failureLog: "バグで教授の大切なデータを一部破損させてしまった...。雷が落ちる。"
      },
      {
        id: 'opt_prof_task_decline',
        label: '丁重に断る',
        risk: 'safe',
        description: '勉強を優先する。',
        successRate: 100,
        successEffect: {
          relationships: { [RelationshipId.PROFESSOR]: -2 }
        },
        successLog: "「そうか、試験も近いしな」教授は少し残念そうだった。"
      }
    ]
  },

  // --- SENIOR EVENTS (Existing) ---
  {
    id: 'senior_gamble_offer',
    trigger: 'action_senior',
    text: "【賭け】「おい、ちょっと面白いバイトがあるんだが」先輩が怪しい話を持ちかけてきた。ハイリスク・ハイリターンな匂いがする。",
    type: 'mixed',
    weight: WEIGHTS.RARE,
    conditions: { minRelationship: REL_TIERS.MID, minMoney: 1000 },
    options: [
      {
        id: 'opt_senior_gamble_yes',
        label: '乗る',
        risk: 'high',
        description: '成功率50%。勝てば臨時収入、負ければ損失。',
        successRate: 50,
        successEffect: {
          money: 5000,
          relationships: { [RelationshipId.SENIOR]: 10 }
        },
        successLog: "予想外に上手くいった！割の良いバイトだった。",
        failureEffect: {
          hp: -15,
          money: -1000,
          sanity: -10
        },
        failureLog: "完全に騙された。タダ働きさせられた挙句、経費を引かれた..."
      },
      {
        id: 'opt_senior_gamble_no',
        label: 'やめておく',
        risk: 'safe',
        description: '君子危うきに近寄らず。',
        successRate: 100,
        successEffect: {
          sanity: 5
        },
        successLog: "丁重に断った。リスク管理もエンジニアの素養だ。"
      }
    ]
  },

  // --- FRIEND EVENTS (Existing) ---
  {
    id: 'friend_long_call',
    trigger: 'action_friend',
    text: "【着信】友人から執拗な通知が届く。「今ヒマ？ 話聞いて！」間違いなく愚痴か、現実逃避への誘いだ。",
    type: 'mixed',
    weight: WEIGHTS.UNCOMMON,
    options: [
      {
        id: 'opt_friend_call_answer',
        label: '出る',
        risk: 'low',
        description: '長電話に付き合う。SAN値は回復するが、体力を消耗する。',
        successRate: 100,
        successEffect: {
          sanity: 30,
          hp: -20,
          relationships: { [RelationshipId.FRIEND]: 10 }
        },
        successLog: "延々とくだらない話で盛り上がった。精神的なデトックスにはなったが、通話を終えるとどっと疲れが出た。"
      },
      {
        id: 'opt_friend_call_ignore',
        label: '今は無理',
        risk: 'safe',
        description: '学習時間を優先する。',
        successRate: 80,
        successEffect: {
          hp: 5
        },
        successLog: "心を鬼にして通知を無視した。進捗は守られた。",
        failureEffect: {
          sanity: -5,
          relationships: { [RelationshipId.FRIEND]: -2 }
        },
        failureLog: "着信が気になって集中力が削がれた...。"
      }
    ]
  },
  {
    id: 'branching_friend_depressed',
    trigger: 'action_friend',
    text: "【共鳴】「もう無理、単位落とす...」友人が深い闇に落ちている。このままだと自分も引きずり込まれそうだ。",
    type: 'mixed',
    weight: WEIGHTS.UNCOMMON,
    conditions: { maxSanity: 40 },
    options: [
      {
        id: 'opt_friend_cheerup',
        label: '励ます',
        risk: 'low',
        description: 'ポジティブな言葉をかける。成功すれば双方回復。',
        successRate: 70,
        successEffect: {
          sanity: 10,
          relationships: { [RelationshipId.FRIEND]: REL_GAINS.MEDIUM }
        },
        successLog: "「...だよな、やるしかないか」友人の目に光が戻った。",
        failureEffect: {
          sanity: -15,
          hp: -5
        },
        failureLog: "励ましが逆効果だった。「お前は余裕そうでいいよな...」空気が凍った。"
      },
      {
        id: 'opt_friend_escape',
        label: 'そっとしておく',
        risk: 'safe',
        description: '距離を取って自分の精神を守る。',
        successRate: 100,
        successEffect: {
          sanity: -5
        },
        successLog: "触らぬ神に祟りなし。今は距離を置こう。"
      }
    ]
  },

  // --- TURN END EVENTS (Existing) ---
  {
    id: 'branching_git_conflict',
    trigger: 'turn_end',
    text: "【衝突】Gitで巨大なコンフリクト発生！マージに失敗し、数時間の作業が消える危機。",
    type: 'mixed',
    category: 'tech_trouble',
    weight: WEIGHTS.RARE,
    conditions: { timeSlots: [TimeSlot.AFTER_SCHOOL, TimeSlot.NIGHT, TimeSlot.LATE_NIGHT] },
    coolDownTurns: COOLDOWNS.MEDIUM,
    options: [
      {
        id: 'opt_git_manual_fix',
        label: '手動で解消',
        risk: 'low',
        description: 'Diffを丁寧に読んで修正する。時間はかかるが確実性は高い。',
        successRate: 70,
        successEffect: {
          hp: -15,
          knowledge: { [SubjectId.ALGO]: KNOWLEDGE_GAINS.SMALL }
        },
        successLog: "地道な作業の末、なんとかマージできた。コードへの理解も深まった気がする。",
        failureEffect: {
          sanity: -15,
          hp: -20
        },
        failureLog: "修正中に新たなバグを埋め込んでしまった...。泥沼だ。"
      },
      {
        id: 'opt_git_force_push',
        label: 'Force Push',
        risk: 'high',
        description: '「俺のコードが正しい」全てを上書きする賭け。',
        successRate: 30,
        successEffect: {
          sanity: 10,
          hp: -5
        },
        successLog: "神に祈りながらEnterッ！...奇跡的に動いた。強引だが解決だ。",
        failureEffect: {
          sanity: -30,
          knowledge: { [SubjectId.ALGO]: -5 }
        },
        failureLog: "必要なコードまで消し飛んだ。取り返しがつかない..."
      },
      {
        id: 'opt_git_giveup',
        label: '諦めて寝る',
        risk: 'safe',
        description: '今日の作業はなかったことにする。精神的ダメージは最小限。',
        successRate: 100,
        successEffect: {
          sanity: 5
        },
        successLog: "「git reset --hard」...美しい虚無だ。寝よう。"
      }
    ]
  },
  {
    id: 'branching_sudden_drowsiness',
    trigger: 'turn_end',
    text: "【睡魔】抗いがたい眠気が襲う。意識が飛びそうだ。どうする？",
    type: 'mixed',
    category: 'drowsiness',
    weight: WEIGHTS.UNCOMMON,
    conditions: { timeSlots: [TimeSlot.AFTERNOON, TimeSlot.NIGHT], caffeineMax: 20 },
    coolDownTurns: COOLDOWNS.SHORT,
    options: [
      {
        id: 'opt_drowsiness_slap',
        label: '頬を叩く',
        risk: 'low',
        description: '物理的衝撃で目を覚ます。',
        successRate: 60,
        successEffect: {
          hp: -5,
          sanity: 5
        },
        successLog: "バチン！痛みが脳を刺激し、意識がクリアになった。",
        failureEffect: {
          hp: -5,
          sanity: -10
        },
        failureLog: "痛いだけで眠気は消えない。惨めだ..."
      },
      {
        id: 'opt_drowsiness_nap',
        label: '5分仮眠',
        risk: 'high',
        description: '短時間の睡眠で回復を狙う。寝過ごすリスクあり。',
        successRate: 40,
        successEffect: {
          sanity: 15,
          hp: 5
        },
        successLog: "完璧なパワーナップ。脳が再起動した。",
        failureEffect: {
          sanity: -15
        },
        failureLog: "気づけば1時間経っていた...。自己嫌悪でSAN値が減る。"
      }
    ]
  },
  { 
    id: 'branching_rainy_day', 
    trigger: 'turn_end',
    text: "【天候】ゲリラ豪雨。傘を持っていない。", 
    type: 'mixed',
    weight: WEIGHTS.UNCOMMON,
    conditions: { timeSlots: [TimeSlot.MORNING, TimeSlot.AFTER_SCHOOL, TimeSlot.NIGHT] },
    coolDownTurns: COOLDOWNS.MEDIUM,
    options: [
      {
        id: 'opt_rain_taxi',
        label: 'タクシーを使う',
        risk: 'safe',
        description: '金を払って快適に帰る。',
        successRate: 100,
        successEffect: {
          money: -2000,
          hp: 5
        },
        successLog: "快適な移動。出費は痛いが、体調には代えられない。"
      },
      {
        id: 'opt_rain_call_friend',
        label: '友人に電話する',
        risk: 'low',
        description: '迎えに来てもらい、そのまま遊びに行く。',
        conditions: { minRelationship: REL_TIERS.MID }, // 30
        successRate: 75,
        successEffect: {
          sanity: RECOVERY_VALS.LARGE,
          relationships: { [RelationshipId.FRIEND]: REL_GAINS.MEDIUM }
        },
        successLog: "「おっ、いいぜ！」友人が車で颯爽と登場。そのままカラオケで雨宿りした。",
        failureEffect: {
          hp: -10,
          sanity: -10
        },
        failureLog: "電話は繋がらなかった...。雨の中、孤独を噛み締めながら帰った。"
      },
      {
        id: 'opt_rain_run',
        label: '走って帰る',
        risk: 'high',
        description: '気合で乗り切る。',
        successRate: 50,
        successEffect: {
          hp: -5,
          sanity: 5
        },
        successLog: "ずぶ濡れだが、なんだか爽やかな気分だ。風邪も引かなそうだ。",
        failureEffect: {
          hp: -20,
          sanity: -5
        },
        failureLog: "完全に冷えた。明日熱が出るかもしれない..."
      }
    ]
  },
  {
    id: 'branching_blue_screen',
    trigger: 'turn_end',
    text: "【絶望】レポート保存直前にブルースクリーン！画面が青一色に染まる。",
    type: 'mixed',
    weight: 2, // Very Rare
    maxOccurrences: 1,
    options: [
      {
        id: 'opt_bsod_wait',
        label: '待つ',
        risk: 'low',
        description: 'OSの復旧機能を信じる。',
        successRate: 60,
        successEffect: {
          sanity: -5
        },
        successLog: "再起動後、自動保存ファイルが残っていた！OSに感謝。",
        failureEffect: {
          sanity: -25
        },
        failureLog: "データは消えていた。虚無だけが残った。"
      },
      {
        id: 'opt_bsod_hit',
        label: '叩く',
        risk: 'high',
        description: '昭和の修理法。精密機器には逆効果の可能性大。',
        successRate: 20,
        successEffect: {
          sanity: 20
        },
        successLog: "ガンッ！...画面が戻った！？奇跡だ。",
        failureEffect: {
          money: -5000,
          sanity: -30
        },
        failureLog: "バキッという嫌な音がした。PCが物理的に壊れた..."
      },
      {
        id: 'opt_bsod_giveup',
        label: '諦めてスマホを見る',
        risk: 'safe',
        description: '現実逃避。PCのことは忘れる。',
        successRate: 100,
        successEffect: {
          sanity: 10,
          hp: 5
        },
        successLog: "今日はもう店じまいだ。猫の動画を見て癒やされた。"
      }
    ]
  },
  {
    id: 'turn_end_mystery_junk',
    trigger: 'turn_end',
    text: "【発掘】実験室のジャンク箱から、型番不明の謎のICチップを発見した。オーラを感じる。",
    type: 'mixed',
    weight: WEIGHTS.UNCOMMON, // Replaces Lost Wallet with same/similar weight
    options: [
      {
        id: 'opt_junk_datasheet',
        label: '型番を特定する',
        risk: 'safe',
        description: '顕微鏡とテスターを使って地道に調べる。回路の勉強になる。',
        successRate: 100,
        successEffect: {
          knowledge: { [SubjectId.CIRCUIT]: KNOWLEDGE_GAINS.MEDIUM },
           sanity: -5 // Tiresome
        },
        successLog: "地道な測定の結果、廃盤になったレアなオペアンプだと判明した。回路特性への理解が深まった。"
      },
      {
        id: 'opt_junk_test',
        label: '通電してみる',
        risk: 'high',
        description: '男なら一発勝負。回路に組み込んで電源ON。',
        successRate: 30,
        successEffect: {
          knowledge: { [SubjectId.CIRCUIT]: KNOWLEDGE_GAINS.LARGE },
          sanity: 15
        },
        successLog: "動いた！しかもこれ、超高性能なFPGAだ！この感動はプライスレス。",
        failureEffect: {
          hp: -15,
          sanity: -10
        },
        failureLog: "「逆電圧か！？」強烈な異臭と共にチップが破裂。飛散した破片が頬をかすめた。顔が煤だらけだ。"
      },
      {
        id: 'opt_junk_auction',
        label: 'ヤフオクに出す',
        risk: 'low',
        description: '「動作未確認ジャンク」として出品。小銭を稼ぐ。',
        successRate: 80,
        successEffect: {
          money: 3000
        },
        successLog: "「NCNR（ノークレーム・ノーリターン）」で出品したら、マニアが即決価格で落札してくれた。",
        failureEffect: {
          sanity: -5
        },
        failureLog: "「送料の方が高い」とクレームが来て、結局廃棄する羽目になった。徒労だ。"
      }
    ]
  }
];
