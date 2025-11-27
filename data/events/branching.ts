
import { GameEvent, RelationshipId, SubjectId, ItemId, TimeSlot } from '../../types';
import { WEIGHTS, COOLDOWNS, REL_TIERS, RECOVERY_VALS, KNOWLEDGE_GAINS, REL_GAINS } from '../../config/gameBalance';
import { SATIETY_CONSUMPTION } from '../../config/gameConstants';

export const BRANCHING_EVENTS: GameEvent[] = [
  // --- NEW: INTERACTION MENUS (Triggered directly by handlers) ---
  
  // 1. Professor Menu (Rel >= 60)
  {
    id: 'prof_interaction_menu',
    trigger: 'action_professor',
    persona: 'PROFESSOR',
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
      },
      {
        id: 'opt_prof_random',
        label: '【ランダム】成り行きに任せる',
        risk: 'high',
        description: '教授の機嫌次第。何が起こるかわからない。',
        successRate: 100,
        chainTrigger: 'action_professor',
        successLog: "「ん、暇なのかね？」教授との時間が始まった。"
      }
    ]
  },

  // 2. Senior Menu (Rel >= 50)
  {
    id: 'senior_interaction_menu',
    trigger: 'action_senior',
    persona: 'SENIOR',
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
          satiety: 60, // Meal
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
      },
      {
        id: 'opt_senior_random',
        label: '【ランダム】先輩に絡む',
        risk: 'high',
        description: '先輩の気まぐれに付き合う。何が起こるかわからない。',
        successRate: 100,
        chainTrigger: 'action_senior',
        successLog: "「おう、なんだ？」先輩に捕まった。"
      }
    ]
  },

  // 3. Friend Menu (Rel >= 40)
  {
    id: 'friend_interaction_menu',
    trigger: 'action_friend',
    persona: 'FRIEND',
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
          satiety: -SATIETY_CONSUMPTION.REST,
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
          satiety: -SATIETY_CONSUMPTION.ESCAPISM,
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
          satiety: -SATIETY_CONSUMPTION.STUDY,
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
        successRate: 100,
        chainTrigger: 'action_friend', // ランダムイベントを連鎖させる
        successLog: "友人の提案に乗ってみることにした。"
      }
    ]
  },

  // --- PROFESSOR EVENTS (Existing) ---
  {
    id: 'prof_special_task',
    trigger: 'action_professor',
    persona: 'PROFESSOR',
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
          sanity: -5,
          satiety: -SATIETY_CONSUMPTION.WORK
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
          sanity: 10,
          satiety: -SATIETY_CONSUMPTION.STUDY
        },
        successLog: "完璧な自動化スクリプトを提出した！「素晴らしい！君は天才か？」教授は大興奮だ。",
        failureEffect: {
          relationships: { [RelationshipId.PROFESSOR]: -10 },
          sanity: -20,
          hp: -15,
          satiety: -SATIETY_CONSUMPTION.WORK
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
    persona: 'SENIOR',
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
          satiety: -10,
          relationships: { [RelationshipId.SENIOR]: 10 }
        },
        successLog: "予想外に上手くいった！割の良いバイトだった。",
        failureEffect: {
          hp: -15,
          money: -1000,
          sanity: -10,
          satiety: -15
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
    persona: 'FRIEND',
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
          satiety: -SATIETY_CONSUMPTION.SOCIAL,
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
    persona: 'FRIEND',
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
          satiety: -5,
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

  // ==========================================
  // NEW MONEY-EARNING BRANCHING EVENTS
  // ==========================================

  // 1. Freelance Opportunity (Turn End, High Algo)
  {
    id: 'freelance_opportunity',
    trigger: 'turn_end',
    persona: 'SYSTEM',
    text: "【依頼】匿名掲示板でフリーランス案件を発見。「簡単なWebスクレイピングツール作成：報酬¥8,000」",
    type: 'mixed',
    weight: WEIGHTS.UNCOMMON,
    conditions: { 
      minKnowledge: { [SubjectId.ALGO]: 40 }, // Changed from knowledge to minKnowledge
      minHp: 30,
      timeSlots: [TimeSlot.AFTER_SCHOOL, TimeSlot.NIGHT, TimeSlot.LATE_NIGHT] // Restricted to later hours
    },
    coolDownTurns: COOLDOWNS.LONG,
    options: [
      {
        id: 'opt_freelance_accept',
        label: '引き受ける（堅実）',
        risk: 'low',
        description: '基本的な実装で確実に納品。体力消費は中程度。',
        successRate: 80,
        successEffect: {
          money: 8000,
          hp: -15,
          sanity: -5,
          satiety: -SATIETY_CONSUMPTION.WORK,
          knowledge: { [SubjectId.ALGO]: KNOWLEDGE_GAINS.SMALL }
        },
        successLog: "仕様通りに実装し、問題なく納品できた。「助かりました！」",
        failureEffect: {
          hp: -20,
          sanity: -15,
          satiety: -SATIETY_CONSUMPTION.WORK,
          money: -1000
        },
        failureLog: "スクレイピング先のサイト構造が変わっていて動作せず。返金対応になった..."
      },
      {
        id: 'opt_freelance_overdeliver',
        label: 'リッチに作り込む（挑戦）',
        risk: 'high',
        description: 'GUI付き＋エラーハンドリング完備。成功すれば追加報酬＋評価。',
        successRate: 50,
        successEffect: {
          money: 15000,
          hp: -25,
          sanity: 10,
          satiety: -20, // High effort
          knowledge: { [SubjectId.ALGO]: KNOWLEDGE_GAINS.LARGE }
        },
        successLog: "「これは期待以上です！」追加報酬＋高評価レビューを獲得。やりがいを感じた。",
        failureEffect: {
          hp: -30,
          sanity: -25,
          satiety: -20,
          money: 3000
        },
        failureLog: "作り込みすぎて納期に間に合わず。基本報酬の半額＋評価ダウン..."
      },
      {
        id: 'opt_freelance_decline',
        label: '見送る',
        risk: 'safe',
        description: '今は本業に集中する。',
        successRate: 100,
        successEffect: { sanity: 5 },
        successLog: "リスクを取らないのも戦略だ。余計なトラブルは避けた。"
      }
    ]
  },

  // 2. Data Entry Gig (Turn End, Low Money)
  {
    id: 'data_entry_gig',
    trigger: 'turn_end',
    persona: 'SYSTEM',
    text: "【短期】大学掲示板に「データ入力バイト募集：1日¥5,000」の貼り紙を発見。誰でもできる単純作業だ。",
    type: 'mixed',
    weight: WEIGHTS.COMMON,
    conditions: { 
      minHp: 25,
      timeSlots: [TimeSlot.NOON, TimeSlot.AFTERNOON, TimeSlot.AFTER_SCHOOL] // Restricted to daytime on campus
    },
    coolDownTurns: COOLDOWNS.MEDIUM,
    options: [
      {
        id: 'opt_data_entry_work',
        label: '引き受ける',
        risk: 'safe',
        description: '確実に稼げるが、時間と体力を消費。',
        successRate: 100,
        successEffect: {
          money: 5000,
          hp: -20,
          sanity: -10,
          satiety: -SATIETY_CONSUMPTION.WORK
        },
        successLog: "延々とExcelに数字を打ち込んだ。脳死作業だったが、確実に報酬を得た。"
      },
      {
        id: 'opt_data_entry_automate',
        label: 'スクリプトで自動化',
        risk: 'high',
        description: 'Pythonで自動化して楽をする。バレなければ最高効率。',
        // conditions: { minKnowledge: { [SubjectId.ALGO]: 50 } }, // Option level condition
        successRate: 60,
        successEffect: {
          money: 5000,
          hp: -5,
          sanity: 15,
          knowledge: { [SubjectId.ALGO]: KNOWLEDGE_GAINS.MEDIUM }
        },
        successLog: "完璧に動作。1時間で終わらせて残り時間はネットサーフィン。天才か？",
        failureEffect: {
          sanity: -20,
          hp: -10
        },
        failureLog: "スクリプトがバグって納品できず。タダ働きになった。悔しい..."
      },
      {
        id: 'opt_data_entry_skip',
        label: 'やめておく',
        risk: 'safe',
        description: '体力温存を優先する。',
        successRate: 100,
        successEffect: { hp: 5 },
        successLog: "単純作業で消耗するよりマシだ。体力を温存した。"
      }
    ]
  },

  // 3. Tutoring Offer (Action Friend)
  {
    id: 'tutoring_offer',
    trigger: 'action_friend',
    persona: 'FRIEND',
    text: "【頼み事】「後輩が試験前で困ってるんだけど、数学教えてあげてくれない？謝礼出すって」",
    type: 'mixed',
    weight: WEIGHTS.UNCOMMON,
    conditions: { 
      // minKnowledge: { [SubjectId.MATH]: 60 },
      minRelationship: REL_TIERS.MID 
    },
    coolDownTurns: COOLDOWNS.LONG,
    options: [
      {
        id: 'opt_tutor_accept',
        label: '引き受ける（標準）',
        risk: 'low',
        description: '基礎を丁寧に教える。確実に報酬を得られる。',
        successRate: 85,
        successEffect: {
          money: 4000,
          hp: -10,
          sanity: -5,
          satiety: -SATIETY_CONSUMPTION.SOCIAL,
          relationships: { [RelationshipId.FRIEND]: REL_GAINS.MEDIUM }
        },
        successLog: "「わかりやすかったです！」後輩から感謝された。謝礼と共に評判も上がった。",
        failureEffect: {
          sanity: -15,
          hp: -15,
          relationships: { [RelationshipId.FRIEND]: -5 }
        },
        failureLog: "「え、そこわかんないです...」説明が空回りし、気まずい空気に。"
      },
      {
        id: 'opt_tutor_intensive',
        label: '過去問パターン徹底指導',
        risk: 'high',
        description: '応用問題まで完璧に仕上げる。成功すれば高額報酬＋人脈拡大。',
        successRate: 50,
        successEffect: {
          money: 10000,
          hp: -20,
          sanity: 5,
          satiety: -15,
          relationships: { [RelationshipId.FRIEND]: REL_GAINS.LARGE }
        },
        successLog: "「試験、満点取れました！」噂が広まり、複数の後輩から依頼が殺到。収入源になった。",
        failureEffect: {
          hp: -25,
          sanity: -20,
          relationships: { [RelationshipId.FRIEND]: -8 }
        },
        failureLog: "応用問題で自分が詰まってしまい、後輩を困惑させた。最悪の結果に..."
      },
      {
        id: 'opt_tutor_decline',
        label: '断る',
        risk: 'safe',
        description: '自分の勉強を優先する。',
        successRate: 100,
        successEffect: { 
          sanity: -5,
          relationships: { [RelationshipId.FRIEND]: -3 }
        },
        successLog: "「ごめん、今は余裕ないんだ」断った。少し気まずい。"
      }
    ]
  },

  // 4. Bug Bounty (Turn End, Very Rare)
  {
    id: 'bug_bounty_discovery',
    trigger: 'turn_end',
    persona: 'SYSTEM',
    text: "【発見】大学の学内システムに脆弱性を発見。セキュリティチームに報告すれば報奨金が出るかもしれない。",
    type: 'mixed',
    weight: WEIGHTS.RARE,
    conditions: { 
      // minKnowledge: { [SubjectId.ALGO]: 70 },
      minHp: 40 
    },
    maxOccurrences: 2,
    coolDownTurns: 14, // Very Long
    options: [
      {
        id: 'opt_bug_report',
        label: '正式に報告する',
        risk: 'low',
        description: '報告書を作成して提出。堅実な対応。',
        successRate: 90,
        successEffect: {
          money: 20000,
          relationships: { [RelationshipId.PROFESSOR]: REL_GAINS.LARGE },
          knowledge: { [SubjectId.ALGO]: KNOWLEDGE_GAINS.MEDIUM }
        },
        successLog: "「素晴らしい！」情報セキュリティチームから感謝状＋報奨金を受け取った。",
        failureEffect: {
          sanity: -10,
          hp: -5
        },
        failureLog: "「既知の問題です」既に報告済みだった。徒労に終わった..."
      },
      {
        id: 'opt_bug_exploit',
        label: '悪用する（危険）',
        risk: 'high',
        description: '闇市場で売却。大金を得られるが、バレたら退学確定。',
        successRate: 30,
        successEffect: {
          money: 50000,
          sanity: -30,
          hp: -10
        },
        successLog: "匿名で情報を売却し、巨額を手にした。罪悪感が重くのしかかる...",
        failureEffect: {
          hp: -50,
          sanity: -50,
          money: -10000
        },
        failureLog: "【緊急】セキュリティチームに検知され、事情聴取を受けた。処分は免れたが、記録に残った..."
      },
      {
        id: 'opt_bug_ignore',
        label: '何もしない',
        risk: 'safe',
        description: '見なかったことにする。',
        successRate: 100,
        successEffect: { sanity: -5 },
        successLog: "関わらないのが一番だ。静観を決め込んだ。"
      }
    ]
  },

  // 5. Electronics Repair (Turn End, Senior Persona)
  {
    id: 'electronics_repair',
    trigger: 'turn_end',
    persona: 'SENIOR',
    text: "【打診】「おい、ラップトップが起動しないんだが、見てくれないか？」先輩が困り顔で頼んできた。",
    type: 'mixed',
    weight: WEIGHTS.UNCOMMON,
    conditions: { 
      // minKnowledge: { [SubjectId.CIRCUIT]: 50 },
      minRelationship: REL_TIERS.LOW,
      timeSlots: [TimeSlot.NOON, TimeSlot.AFTERNOON, TimeSlot.AFTER_SCHOOL, TimeSlot.NIGHT, TimeSlot.LATE_NIGHT] // Senior availability
    },
    coolDownTurns: COOLDOWNS.MEDIUM,
    options: [
      {
        id: 'opt_repair_diagnose',
        label: '診断する（慎重）',
        risk: 'low',
        description: '原因特定だけして、修理は業者に任せる提案。',
        successRate: 80,
        successEffect: {
          money: 2000,
          satiety: -5,
          relationships: { [RelationshipId.SENIOR]: REL_GAINS.MEDIUM }
        },
        successLog: "「メモリ不良だな」原因を特定し、業者を紹介。謝礼を受け取った。",
        failureEffect: {
          sanity: -10,
          relationships: { [RelationshipId.SENIOR]: -3 }
        },
        failureLog: "「結局わかんねーのかよ」原因不明で終わり、気まずい空気に。"
      },
      {
        id: 'opt_repair_fix',
        label: '自力で修理（挑戦）',
        risk: 'high',
        description: '完全修理を試みる。成功すれば高額謝礼＋評判UP。',
        successRate: 55,
        successEffect: {
          money: 8000,
          relationships: { [RelationshipId.SENIOR]: REL_GAINS.LARGE },
          knowledge: { [SubjectId.CIRCUIT]: KNOWLEDGE_GAINS.LARGE },
          satiety: -15
        },
        successLog: "「マジか！ 神かよ！」完全復旧に成功。先輩から高額謝礼＋噂が広まった。",
        failureEffect: {
          money: -5000,
          sanity: -25,
          hp: -15,
          satiety: -10,
          relationships: { [RelationshipId.SENIOR]: -10 }
        },
        failureLog: "修理中に基盤をショートさせ、完全に壊してしまった。弁償する羽目に..."
      },
      {
        id: 'opt_repair_decline',
        label: '断る',
        risk: 'safe',
        description: '責任を取りたくない。',
        successRate: 100,
        successEffect: { 
          relationships: { [RelationshipId.SENIOR]: -2 }
        },
        successLog: "「悪い、専門外なんだ」丁重に断った。少し距離ができた。"
      }
    ]
  },

  // --- TURN END EVENTS (Existing) ---
  {
    id: 'branching_git_conflict',
    trigger: 'turn_end',
    persona: 'SYSTEM',
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
          satiety: -10,
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
    persona: 'SYSTEM',
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
          hp: 5,
          satiety: -SATIETY_CONSUMPTION.REST
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
    persona: 'SYSTEM',
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
          satiety: -SATIETY_CONSUMPTION.ESCAPISM,
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
    persona: 'SYSTEM',
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
    persona: 'SYSTEM',
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
