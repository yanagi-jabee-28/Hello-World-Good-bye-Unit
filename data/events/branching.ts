
import { GameEvent, RelationshipId, SubjectId, ItemId, TimeSlot } from '../../types';
import { WEIGHTS, COOLDOWNS, REL_TIERS, RECOVERY_VALS, KNOWLEDGE_GAINS, REL_GAINS, COSTS, SUCCESS_RATES } from '../../config/gameBalance';
import { SATIETY_CONSUMPTION } from '../../config/gameConstants';
import { safeOption, lowRiskOption, midRiskOption, highRiskOption, createOption } from '../builders';

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
      lowRiskOption({
        id: 'opt_prof_ask_exam',
        label: '今回の試験について聞く',
        description: '出題傾向を探る。確実な情報が得られる。',
        successRate: SUCCESS_RATES.VERY_HIGH, // 90%
        successEffect: {
          // AUTO_SELECT: Reducer will replace this with weakest subject
          knowledge: { [SubjectId.ALGO]: KNOWLEDGE_GAINS.LARGE },
          relationships: { [RelationshipId.PROFESSOR]: REL_GAINS.SMALL },
          hp: -12,
          sanity: -8,
          satiety: -15
        },
        successLog: "「そこは君の弱点だね」鋭い指摘を受け、苦手分野の理解が深まった。",
        failureEffect: { relationships: { [RelationshipId.PROFESSOR]: -2 } },
        failureLog: "「講義で言ったはずだがね」軽くあしらわれた。"
      }),
      highRiskOption({
        id: 'opt_prof_ask_paper',
        label: '過去問をお願いする',
        description: '直球勝負。成功すればデカイが、心証を損ねるリスクあり。',
        successRate: SUCCESS_RATES.VERY_LOW, // 40%
        successEffect: {
          inventory: { [ItemId.USB_MEMORY]: 1 },
          relationships: { [RelationshipId.PROFESSOR]: REL_GAINS.MEDIUM },
          hp: COSTS.HP.MEDIUM,
          sanity: COSTS.SANITY.MEDIUM
        },
        successLog: "「君の熱意に免じて特別だ」...なんと、教授自らデータをくれた！",
        failureEffect: {
          relationships: { [RelationshipId.PROFESSOR]: -15 },
          sanity: COSTS.SANITY.MEDIUM
        },
        failureLog: "「学生の本分を履き違えるな！」厳しく叱責された。"
      }),
      createOption({
        id: 'opt_prof_ask_book',
        label: '参考書籍を借りる',
        description: '学習資料をねだる。',
        risk: 'low',
        successRate: SUCCESS_RATES.LOW, // 60%
        successEffect: {
          inventory: { [ItemId.REFERENCE_BOOK]: 1 },
          relationships: { [RelationshipId.PROFESSOR]: REL_GAINS.Qm },
          hp: COSTS.HP.TINY
        },
        successLog: "「これを持っていくといい」教授の著書を貸してもらった。",
        failureEffect: { relationships: { [RelationshipId.PROFESSOR]: -5 } },
        failureLog: "貸せる本はないと断られた。"
      }),
      {
        id: 'opt_prof_random',
        label: '【ランダム】成り行きに任せる',
        risk: 'high',
        description: '教授の機嫌次第。何が起こるかわからない。',
        successRate: SUCCESS_RATES.GUARANTEED,
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
      safeOption({
        id: 'opt_senior_meal',
        label: 'ご飯に行きましょう',
        description: '奢ってもらって回復する。',
        successEffect: {
          hp: RECOVERY_VALS.LARGE,
          sanity: RECOVERY_VALS.SMALL,
          satiety: 60, // Meal
          relationships: { [RelationshipId.SENIOR]: REL_GAINS.MEDIUM }
        },
        successLog: "学食で一番高い定食を奢ってもらった。「しっかり食えよ！」"
      }),
      midRiskOption({
        id: 'opt_senior_past_paper',
        label: '過去問ください！',
        description: '先輩のコネに頼る。何度でも入手できるチャンス。',
        successRate: SUCCESS_RATES.LOW, // 60%
        successEffect: {
          inventory: { [ItemId.USB_MEMORY]: 1 },
          knowledge: { [SubjectId.CIRCUIT]: KNOWLEDGE_GAINS.LARGE },
          relationships: { [RelationshipId.SENIOR]: REL_GAINS.LARGE }
        },
        successLog: "「しょうがねぇなぁ」一番不安だった科目の過去問フォルダを共有してくれた。",
        failureEffect: { relationships: { [RelationshipId.SENIOR]: -5 } },
        failureLog: "「今は手元にないなー」空振りに終わった。"
      }),
      lowRiskOption({
        id: 'opt_senior_item',
        label: '何かいいモノないですか',
        description: 'アイテムをねだる。',
        successRate: SUCCESS_RATES.MID, // 70%
        successEffect: {
          inventory: { [ItemId.ENERGY_DRINK]: 1 },
          relationships: { [RelationshipId.SENIOR]: REL_GAINS.Qm }
        },
        successLog: "「これでも飲んで頑張れ」エナドリを恵んでくれた。",
        failureEffect: { relationships: { [RelationshipId.SENIOR]: -2 } },
        failureLog: "「俺が欲しいくらいだよ」と笑われた。"
      }),
      {
        id: 'opt_senior_random',
        label: '【ランダム】先輩に絡む',
        risk: 'high',
        description: '先輩の気まぐれに付き合う。何が起こるかわからない。',
        successRate: SUCCESS_RATES.GUARANTEED,
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
      safeOption({
        id: 'opt_friend_heal_hp',
        label: 'HP回復 (休憩)',
        description: 'のんびり過ごして体力を回復する。',
        successEffect: {
          hp: RECOVERY_VALS.LARGE,
          satiety: -SATIETY_CONSUMPTION.REST,
          relationships: { [RelationshipId.FRIEND]: REL_GAINS.Qm }
        },
        successLog: "ダラダラと過ごして体力を回復した。"
      }),
      safeOption({
        id: 'opt_friend_heal_san',
        label: 'SAN回復 (遊び)',
        description: 'パーッと遊んでストレス発散。',
        successEffect: {
          sanity: RECOVERY_VALS.LARGE,
          satiety: -SATIETY_CONSUMPTION.ESCAPISM,
          relationships: { [RelationshipId.FRIEND]: REL_GAINS.Qm }
        },
        successLog: "愚痴を言い合ってスッキリした。"
      }),
      safeOption({
        id: 'opt_friend_study',
        label: '一緒に勉強する',
        description: '教え合うことで理解が深まる。ただし雑談で時間を取られる。',
        successEffect: {
          knowledge: { [SubjectId.HUMANITIES]: 10 },
          satiety: -18,
          relationships: { [RelationshipId.FRIEND]: REL_GAINS.SMALL },
          hp: -8,
          sanity: -5
        },
        successLog: "一人では詰まっていた箇所も、教え合うことで理解できた。ただし、雑談で1時間は無駄にした。",
      }),
      createOption({
        id: 'opt_friend_ask_materials',
        label: '資料をねだる',
        risk: 'high',
        description: '友達のツテを頼って過去問を探してもらう。',
        successRate: SUCCESS_RATES.LOW, // 50%
        successEffect: {
            inventory: { [ItemId.VERIFIED_PAST_PAPERS]: 1 },
            relationships: { [RelationshipId.FRIEND]: REL_GAINS.SMALL },
            hp: COSTS.HP.TINY
        },
        successLog: "「しょうがないなー」友人が入手した『検証済み過去問』を分けてくれた！神！",
        failureEffect: {
            relationships: { [RelationshipId.FRIEND]: -5 },
            hp: COSTS.HP.TINY
        },
        failureLog: "「そんな都合のいいものないよ」と呆れられた。"
      }),
      {
        id: 'opt_friend_random',
        label: 'おまかせ',
        risk: 'high',
        description: '友人の提案に乗る。何が起こるかわからない。',
        successRate: SUCCESS_RATES.GUARANTEED,
        chainTrigger: 'action_friend',
        successLog: "友人の提案に乗ってみることにした。"
      }
    ]
  },

  // --- PROFESSOR EVENTS ---
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
      safeOption({
        id: 'opt_prof_task_accept',
        label: '手伝う (堅実)',
        description: '地道に作業する。友好度は確実に上がる。',
        successEffect: {
          relationships: { [RelationshipId.PROFESSOR]: 8 },
          hp: COSTS.HP.SMALL,
          sanity: COSTS.SANITY.SMALL,
          satiety: -SATIETY_CONSUMPTION.WORK
        },
        successLog: "数時間かけてデータを整理した。教授から感謝され、お茶をご馳走になった。"
      }),
      highRiskOption({
        id: 'opt_prof_task_script',
        label: 'スクリプト化 (挑戦)',
        description: '自動化プログラムを組む。成功すれば絶大な評価。失敗は許されない。',
        successRate: SUCCESS_RATES.VERY_LOW, // 40%
        successEffect: {
          relationships: { [RelationshipId.PROFESSOR]: 25 },
          knowledge: { [SubjectId.ALGO]: 15 },
          sanity: COSTS.SANITY.BOOST_MID,
          satiety: -SATIETY_CONSUMPTION.STUDY
        },
        successLog: "完璧な自動化スクリプトを提出した！「素晴らしい！君は天才か？」教授は大興奮だ。",
        failureEffect: {
          relationships: { [RelationshipId.PROFESSOR]: -10 },
          sanity: COSTS.SANITY.HUGE,
          hp: COSTS.HP.MEDIUM,
          satiety: -SATIETY_CONSUMPTION.WORK
        },
        failureLog: "バグで教授の大切なデータを一部破損させてしまった...。雷が落ちる。"
      }),
      safeOption({
        id: 'opt_prof_task_decline',
        label: '丁重に断る',
        description: '勉強を優先する。',
        successEffect: {
          relationships: { [RelationshipId.PROFESSOR]: -2 }
        },
        successLog: "「そうか、試験も近いしな」教授は少し残念そうだった。"
      })
    ]
  },

  // --- SENIOR EVENTS ---
  {
    id: 'senior_gamble_offer',
    trigger: 'action_senior',
    persona: 'SENIOR',
    text: "【賭け】「おい、ちょっと面白いバイトがあるんだが」先輩が怪しい話を持ちかけてきた。ハイリスク・ハイリターンな匂いがする。",
    type: 'mixed',
    weight: WEIGHTS.RARE,
    conditions: { minRelationship: REL_TIERS.MID, minMoney: 1000 },
    options: [
      highRiskOption({
        id: 'opt_senior_gamble_yes',
        label: '乗る',
        description: '成功率50%。勝てば臨時収入、負ければ損失。',
        successRate: SUCCESS_RATES.LOW, // 50%
        successEffect: {
          money: 5000,
          satiety: COSTS.SATIETY.SMALL,
          relationships: { [RelationshipId.SENIOR]: 10 }
        },
        successLog: "予想外に上手くいった！割の良いバイトだった。",
        failureEffect: {
          hp: COSTS.HP.MEDIUM,
          money: COSTS.MONEY.PENALTY_SMALL,
          sanity: COSTS.SANITY.MEDIUM,
          satiety: COSTS.SATIETY.MEDIUM
        },
        failureLog: "完全に騙された。タダ働きさせられた挙句、経費を引かれた..."
      }),
      safeOption({
        id: 'opt_senior_gamble_no',
        label: 'やめておく',
        description: '君子危うきに近寄らず。',
        successEffect: {
          sanity: 5
        },
        successLog: "丁重に断った。リスク管理もエンジニアの素養だ。"
      })
    ]
  },

  // --- FRIEND EVENTS ---
  {
    id: 'friend_long_call',
    trigger: 'action_friend',
    persona: 'FRIEND',
    text: "【着信】友人から執拗な通知が届く。「今ヒマ？ 話聞いて！」間違いなく愚痴か、現実逃避への誘いだ。",
    type: 'mixed',
    weight: WEIGHTS.UNCOMMON,
    options: [
      createOption({
        id: 'opt_friend_call_answer',
        label: '出る',
        risk: 'low', 
        successRate: SUCCESS_RATES.GUARANTEED,
        description: '長電話に付き合う。SAN値は回復するが、体力を消耗する。',
        successEffect: {
          sanity: COSTS.SANITY.RECOVER_SMALL,
          hp: COSTS.HP.LARGE,
          satiety: -SATIETY_CONSUMPTION.SOCIAL,
          relationships: { [RelationshipId.FRIEND]: 10 }
        },
        successLog: "延々とくだらない話で盛り上がった。精神的なデトックスにはなったが、通話を終えるとどっと疲れが出た。"
      }),
      createOption({
        id: 'opt_friend_call_ignore',
        label: '今は無理',
        risk: 'safe',
        description: '学習時間を優先する。',
        successRate: SUCCESS_RATES.HIGH, // 80%
        successEffect: {
          hp: 5
        },
        successLog: "心を鬼にして通知を無視した。進捗は守られた。",
        failureEffect: {
          sanity: -5,
          relationships: { [RelationshipId.FRIEND]: -2 }
        },
        failureLog: "着信が気になって集中力が削がれた...。"
      })
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
      midRiskOption({
        id: 'opt_friend_cheerup',
        label: '励ます',
        description: 'ポジティブな言葉をかける。成功すれば双方回復。',
        successRate: SUCCESS_RATES.MID, // 70%
        successEffect: {
          sanity: 10,
          satiety: -5,
          relationships: { [RelationshipId.FRIEND]: REL_GAINS.MEDIUM }
        },
        successLog: "「...だよな、やるしかないか」友人の目に光が戻った。",
        failureEffect: {
          sanity: COSTS.SANITY.MEDIUM,
          hp: -5
        },
        failureLog: "励ましが逆効果だった。「お前は余裕そうでいいよな...」空気が凍った。"
      }),
      safeOption({
        id: 'opt_friend_escape',
        label: 'そっとしておく',
        description: '距離を取って自分の精神を守る。',
        successEffect: {
          sanity: -5
        },
        successLog: "触らぬ神に祟りなし。今は距離を置こう。"
      })
    ]
  },

  // ==========================================
  // NEW MONEY-EARNING BRANCHING EVENTS
  // ==========================================

  // 1. Freelance Opportunity
  {
    id: 'freelance_opportunity',
    trigger: 'turn_end',
    persona: 'SYSTEM',
    text: "【依頼】匿名掲示板でフリーランス案件を発見。「簡単なWebスクレイピングツール作成：報酬¥8,000」",
    type: 'mixed',
    weight: WEIGHTS.UNCOMMON,
    conditions: { 
      minKnowledge: { [SubjectId.ALGO]: 40 },
      minHp: 30,
      timeSlots: [TimeSlot.AFTER_SCHOOL, TimeSlot.NIGHT, TimeSlot.LATE_NIGHT]
    },
    coolDownTurns: COOLDOWNS.LONG,
    options: [
      lowRiskOption({
        id: 'opt_freelance_accept',
        label: '引き受ける（堅実）',
        description: '基本的な実装で確実に納品。体力消費は中程度。',
        successRate: SUCCESS_RATES.HIGH, // 80%
        successEffect: {
          money: 8000,
          hp: COSTS.HP.MEDIUM,
          sanity: -5,
          satiety: -SATIETY_CONSUMPTION.WORK,
          knowledge: { [SubjectId.ALGO]: KNOWLEDGE_GAINS.SMALL }
        },
        successLog: "仕様通りに実装し、問題なく納品できた。「助かりました！」",
        failureEffect: {
          hp: COSTS.HP.LARGE,
          sanity: COSTS.SANITY.MEDIUM,
          satiety: -SATIETY_CONSUMPTION.WORK,
          money: COSTS.MONEY.PENALTY_SMALL
        },
        failureLog: "スクレイピング先のサイト構造が変わっていて動作せず。返金対応になった..."
      }),
      highRiskOption({
        id: 'opt_freelance_overdeliver',
        label: 'リッチに作り込む（挑戦）',
        description: 'GUI付き＋エラーハンドリング完備。成功すれば追加報酬＋評価。',
        successRate: SUCCESS_RATES.VERY_LOW, // 40%
        successEffect: {
          money: COSTS.MONEY.XL_REWARD,
          hp: COSTS.HP.HUGE,
          sanity: 10,
          satiety: COSTS.SATIETY.XXL,
          knowledge: { [SubjectId.ALGO]: KNOWLEDGE_GAINS.LARGE }
        },
        successLog: "「これは期待以上です！」追加報酬＋高評価レビューを獲得。やりがいを感じた。",
        failureEffect: {
          hp: COSTS.HP.HUGE,
          sanity: -25,
          satiety: COSTS.SATIETY.XL,
          money: COSTS.MONEY.PENALTY_MID
        },
        failureLog: "作り込みすぎて納期に間に合わず。基本報酬の半額＋評価ダウン..."
      }),
      safeOption({
        id: 'opt_freelance_decline',
        label: '見送る',
        description: '今は本業に集中する。',
        successEffect: { sanity: 5 },
        successLog: "リスクを取らないのも戦略だ。余計なトラブルは避けた。"
      })
    ]
  },

  // 2. Data Entry Gig
  {
    id: 'data_entry_gig',
    trigger: 'turn_end',
    persona: 'SYSTEM',
    text: "【短期】大学掲示板に「データ入力バイト募集：1日¥5,000」の貼り紙を発見。誰でもできる単純作業だ。",
    type: 'mixed',
    weight: WEIGHTS.COMMON,
    conditions: { 
      minHp: 25,
      timeSlots: [TimeSlot.NOON, TimeSlot.AFTERNOON, TimeSlot.AFTER_SCHOOL]
    },
    coolDownTurns: COOLDOWNS.MEDIUM,
    options: [
      safeOption({
        id: 'opt_data_entry_work',
        label: '引き受ける',
        description: '5時間拘束。脳死作業で確実な報酬。',
        successEffect: {
          money: 2000,
          hp: -28,
          sanity: COSTS.SANITY.MEDIUM,
          satiety: -35
        },
        successLog: "延々とExcelに数字を打ち込んだ。時給換算すると虚しくなる額だが、背に腹は代えられない。"
      }),
      midRiskOption({
        id: 'opt_data_entry_automate',
        label: 'スクリプトで自動化',
        description: 'Pythonで自動化して楽をする。バレなければ最高効率。',
        successRate: SUCCESS_RATES.LOW, // 60%
        successEffect: {
          money: 5000,
          hp: COSTS.HP.TINY,
          sanity: 15,
          knowledge: { [SubjectId.ALGO]: KNOWLEDGE_GAINS.MEDIUM }
        },
        successLog: "完璧な自動化スクリプトが完成。1時間で終わらせて残り時間はネットサーフィン。実質時給¥5,000！",
        failureEffect: {
          sanity: COSTS.SANITY.HUGE,
          hp: COSTS.HP.SMALL
        },
        failureLog: "スクリプトがバグって納品できず。タダ働きになった。悔しい..."
      }),
      safeOption({
        id: 'opt_data_entry_skip',
        label: 'やめておく',
        description: '体力温存を優先する。',
        successEffect: { hp: 5 },
        successLog: "単純作業で消耗するよりマシだ。体力を温存した。"
      })
    ]
  },

  // 3. Tutoring Offer
  {
    id: 'tutoring_offer',
    trigger: 'action_friend',
    persona: 'FRIEND',
    text: "【頼み事】「後輩が試験前で困ってるんだけど、数学教えてあげてくれない？謝礼出すって」",
    type: 'mixed',
    weight: WEIGHTS.UNCOMMON,
    conditions: { 
      minRelationship: REL_TIERS.MID 
    },
    coolDownTurns: COOLDOWNS.LONG,
    options: [
      lowRiskOption({
        id: 'opt_tutor_accept',
        label: '引き受ける（標準）',
        description: '基礎を丁寧に教える。確実に報酬を得られる。',
        successRate: 85, // Custom High
        successEffect: {
          money: 4000,
          hp: COSTS.HP.SMALL,
          sanity: COSTS.SANITY.SMALL,
          satiety: -SATIETY_CONSUMPTION.SOCIAL,
          relationships: { [RelationshipId.FRIEND]: REL_GAINS.MEDIUM }
        },
        successLog: "「わかりやすかったです！」後輩から感謝された。謝礼と共に評判も上がった。",
        failureEffect: {
          sanity: COSTS.SANITY.MEDIUM,
          hp: COSTS.HP.MEDIUM,
          relationships: { [RelationshipId.FRIEND]: -5 }
        },
        failureLog: "「え、そこわかんないです...」説明が空回りし、気まずい空気に。"
      }),
      highRiskOption({
        id: 'opt_tutor_intensive',
        label: '過去問パターン徹底指導',
        description: '応用問題まで完璧に仕上げる。成功すれば高額報酬＋人脈拡大。',
        successRate: SUCCESS_RATES.LOW, // 50%
        successEffect: {
          money: COSTS.MONEY.LARGE_REWARD,
          hp: COSTS.HP.LARGE,
          sanity: 5,
          satiety: COSTS.SATIETY.MEDIUM,
          relationships: { [RelationshipId.FRIEND]: REL_GAINS.LARGE }
        },
        successLog: "「試験、満点取れました！」噂が広まり、複数の後輩から依頼が殺到。収入源になった。",
        failureEffect: {
          hp: -25,
          sanity: COSTS.SANITY.HUGE,
          relationships: { [RelationshipId.FRIEND]: -8 }
        },
        failureLog: "応用問題で自分が詰まってしまい、後輩を困惑させた。最悪の結果に..."
      }),
      safeOption({
        id: 'opt_tutor_decline',
        label: '断る',
        description: '自分の勉強を優先する。',
        successEffect: { 
          sanity: COSTS.SANITY.SMALL,
          relationships: { [RelationshipId.FRIEND]: -3 }
        },
        successLog: "「ごめん、今は余裕ないんだ」断った。少し気まずい。"
      })
    ]
  },

  // 4. Bug Bounty
  {
    id: 'bug_bounty_discovery',
    trigger: 'turn_end',
    persona: 'SYSTEM',
    text: "【発見】大学の学内システムに脆弱性を発見。セキュリティチームに報告すれば報奨金が出るかもしれない。",
    type: 'mixed',
    weight: WEIGHTS.RARE,
    conditions: { 
      minHp: 40 
    },
    maxOccurrences: 2,
    coolDownTurns: 14,
    options: [
      midRiskOption({
        id: 'opt_bug_report',
        label: '正式に報告する',
        description: '報告書を作成して提出。報奨金狙いだが、藪蛇になる可能性も。',
        successRate: SUCCESS_RATES.LOW, // 60%
        successEffect: {
          money: COSTS.MONEY.REWARD_MEDIUM,
          relationships: { [RelationshipId.PROFESSOR]: REL_GAINS.MEDIUM },
          knowledge: { [SubjectId.ALGO]: KNOWLEDGE_GAINS.MEDIUM }
        },
        successLog: "「助かったよ」システム管理者から感謝され、図書カード(換金済)を貰った。",
        failureEffect: {
          sanity: COSTS.SANITY.MEDIUM,
          hp: COSTS.HP.SMALL,
          relationships: { [RelationshipId.PROFESSOR]: -5 }
        },
        failureLog: "「学生が勝手にスキャンするな！」逆に説教された。理不尽だ。"
      }),
      highRiskOption({
        id: 'opt_bug_exploit',
        label: '悪用する（危険）',
        description: '闇市場で売却。大金を得られるが、バレたら退学確定。',
        successRate: SUCCESS_RATES.RISKY, // 30%
        successEffect: {
          money: 50000,
          sanity: COSTS.SANITY.CRITICAL,
          hp: COSTS.HP.SMALL
        },
        successLog: "匿名で情報を売却し、巨額を手にした。罪悪感が重くのしかかる...",
        failureEffect: {
          hp: -50,
          sanity: -50,
          money: -10000
        },
        failureLog: "【緊急】セキュリティチームに検知され、事情聴取を受けた。処分は免れたが、記録に残った..."
      }),
      safeOption({
        id: 'opt_bug_ignore',
        label: '何もしない',
        description: '見なかったことにする。',
        successEffect: { sanity: COSTS.SANITY.SMALL },
        successLog: "関わらないのが一番だ。静観を決め込んだ。"
      })
    ]
  },

  // 5. Electronics Repair
  {
    id: 'electronics_repair',
    trigger: 'turn_end',
    persona: 'SENIOR',
    text: "【打診】「おい、ラップトップが起動しないんだが、見てくれないか？」先輩が困り顔で頼んできた。",
    type: 'mixed',
    weight: WEIGHTS.UNCOMMON,
    conditions: { 
      minRelationship: REL_TIERS.LOW,
      timeSlots: [TimeSlot.NOON, TimeSlot.AFTERNOON, TimeSlot.AFTER_SCHOOL, TimeSlot.NIGHT, TimeSlot.LATE_NIGHT]
    },
    coolDownTurns: COOLDOWNS.MEDIUM,
    options: [
      lowRiskOption({
        id: 'opt_repair_diagnose',
        label: '診断する（慎重）',
        description: '原因特定だけして、修理は業者に任せる提案。',
        successRate: SUCCESS_RATES.HIGH, // 80%
        successEffect: {
          money: 2000,
          satiety: COSTS.SATIETY.TINY,
          relationships: { [RelationshipId.SENIOR]: REL_GAINS.MEDIUM }
        },
        successLog: "「メモリ不良だな」原因を特定し、業者を紹介。謝礼を受け取った。",
        failureEffect: {
          sanity: COSTS.SANITY.MEDIUM,
          relationships: { [RelationshipId.SENIOR]: -3 }
        },
        failureLog: "「結局わかんねーのかよ」原因不明で終わり、気まずい空気に。"
      }),
      highRiskOption({
        id: 'opt_repair_fix',
        label: '自力で修理（挑戦）',
        description: '完全修理を試みる。成功すれば高額謝礼＋評判UP。',
        successRate: 55, // Custom
        successEffect: {
          money: 8000,
          relationships: { [RelationshipId.SENIOR]: REL_GAINS.LARGE },
          knowledge: { [SubjectId.CIRCUIT]: KNOWLEDGE_GAINS.LARGE },
          satiety: COSTS.SATIETY.MEDIUM
        },
        successLog: "「マジか！ 神かよ！」完全復旧に成功。先輩から高額謝礼＋噂が広まった。",
        failureEffect: {
          money: COSTS.MONEY.PENALTY_LARGE,
          sanity: -25,
          hp: COSTS.HP.MEDIUM,
          satiety: COSTS.SATIETY.MEDIUM,
          relationships: { [RelationshipId.SENIOR]: -10 }
        },
        failureLog: "修理中に基盤をショートさせ、完全に壊してしまった。弁償する羽目に..."
      }),
      safeOption({
        id: 'opt_repair_decline',
        label: '断る',
        description: '責任を取りたくない。',
        successEffect: { 
          relationships: { [RelationshipId.SENIOR]: -2 }
        },
        successLog: "「悪い、専門外なんだ」丁重に断った。少し距離ができた。"
      })
    ]
  },

  // --- TURN END EVENTS ---
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
      midRiskOption({
        id: 'opt_git_manual_fix',
        label: '手動で解消',
        description: 'Diffを丁寧に読んで修正する。時間はかかるが確実性は高い。',
        successRate: SUCCESS_RATES.MID, // 70%
        successEffect: {
          hp: COSTS.HP.MEDIUM,
          satiety: COSTS.SATIETY.SMALL,
          knowledge: { [SubjectId.ALGO]: KNOWLEDGE_GAINS.SMALL }
        },
        successLog: "地道な作業の末、なんとかマージできた。コードへの理解も深まった気がする。",
        failureEffect: {
          sanity: COSTS.SANITY.LARGE,
          hp: COSTS.HP.LARGE
        },
        failureLog: "修正中に新たなバグを埋め込んでしまった...。泥沼だ。"
      }),
      highRiskOption({
        id: 'opt_git_force_push',
        label: 'Force Push',
        description: '「俺のコードが正しい」全てを上書きする賭け。',
        successRate: SUCCESS_RATES.RISKY, // 30%
        successEffect: {
          sanity: COSTS.SANITY.BOOST_MID,
          hp: COSTS.HP.TINY
        },
        successLog: "神に祈りながらEnterッ！...奇跡的に動いた。強引だが解決だ。",
        failureEffect: {
          sanity: COSTS.SANITY.CRITICAL,
          knowledge: { [SubjectId.ALGO]: -5 }
        },
        failureLog: "必要なコードまで消し飛んだ。取り返しがつかない..."
      }),
      safeOption({
        id: 'opt_git_giveup',
        label: '諦めて寝る',
        description: '今日の作業はなかったことにする。精神的ダメージは最小限。',
        successEffect: {
          sanity: 5
        },
        successLog: "「git reset --hard」...美しい虚無だ。寝よう。"
      })
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
      lowRiskOption({
        id: 'opt_drowsiness_slap',
        label: '頬を叩く',
        description: '物理的衝撃で目を覚ます。',
        successRate: SUCCESS_RATES.LOW, // 60%
        successEffect: {
          hp: COSTS.HP.TINY,
          sanity: 5
        },
        successLog: "バチン！痛みが脳を刺激し、意識がクリアになった。",
        failureEffect: {
          hp: COSTS.HP.TINY,
          sanity: COSTS.SANITY.MEDIUM
        },
        failureLog: "痛いだけで眠気は消えない。惨めだ..."
      }),
      highRiskOption({
        id: 'opt_drowsiness_nap',
        label: '5分仮眠',
        description: '短時間の睡眠で回復を狙う。寝過ごすリスクあり。',
        successRate: SUCCESS_RATES.VERY_LOW, // 40%
        successEffect: {
          sanity: COSTS.SANITY.BOOST_LARGE,
          hp: 5,
          satiety: -SATIETY_CONSUMPTION.REST
        },
        successLog: "完璧なパワーナップ。脳が再起動した。",
        failureEffect: {
          sanity: COSTS.SANITY.LARGE
        },
        failureLog: "気づけば1時間経っていた...。自己嫌悪でSAN値が減る。"
      })
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
      safeOption({
        id: 'opt_rain_taxi',
        label: 'タクシーを使う',
        description: '金を払って快適に帰る。',
        successEffect: {
          money: -2000,
          hp: 5
        },
        successLog: "快適な移動。出費は痛いが、体調には代えられない。"
      }),
      lowRiskOption({
        id: 'opt_rain_call_friend',
        label: '友人に電話する',
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
          hp: COSTS.HP.SMALL,
          sanity: COSTS.SANITY.MEDIUM
        },
        failureLog: "電話は繋がらなかった...。雨の中、孤独を噛み締めながら帰った。"
      }),
      midRiskOption({
        id: 'opt_rain_run',
        label: '走って帰る',
        description: '気合で乗り切る。',
        successRate: SUCCESS_RATES.LOW, // 50%
        successEffect: {
          hp: COSTS.HP.TINY,
          sanity: 5
        },
        successLog: "ずぶ濡れだが、なんだか爽やかな気分だ。風邪も引かなそうだ。",
        failureEffect: {
          hp: COSTS.HP.LARGE,
          sanity: COSTS.SANITY.SMALL
        },
        failureLog: "完全に冷えた。明日熱が出るかもしれない..."
      })
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
      lowRiskOption({
        id: 'opt_bsod_wait',
        label: '待つ',
        description: 'OSの復旧機能を信じる。',
        successRate: SUCCESS_RATES.LOW, // 60%
        successEffect: {
          sanity: COSTS.SANITY.SMALL
        },
        successLog: "再起動後、自動保存ファイルが残っていた！OSに感謝。",
        failureEffect: {
          sanity: -25
        },
        failureLog: "データは消えていた。虚無だけが残った。"
      }),
      highRiskOption({
        id: 'opt_bsod_hit',
        label: '叩く',
        description: '昭和の修理法。精密機器には逆効果の可能性大。',
        successRate: 20,
        successEffect: {
          sanity: 20
        },
        successLog: "ガンッ！...画面が戻った！？奇跡だ。",
        failureEffect: {
          money: COSTS.MONEY.PENALTY_LARGE,
          sanity: COSTS.SANITY.CRITICAL
        },
        failureLog: "バキッという嫌な音がした。PCが物理的に壊れた..."
      }),
      safeOption({
        id: 'opt_bsod_giveup',
        label: '諦めてスマホを見る',
        description: '現実逃避。PCのことは忘れる。',
        successEffect: {
          sanity: 10,
          hp: 5
        },
        successLog: "今日はもう店じまいだ。猫の動画を見て癒やされた。"
      })
    ]
  },
  {
    id: 'turn_end_mystery_junk',
    trigger: 'turn_end',
    persona: 'SYSTEM',
    text: "【発掘】実験室のジャンク箱から、型番不明の謎のICチップを発見した。オーラを感じる。",
    type: 'mixed',
    weight: WEIGHTS.UNCOMMON,
    options: [
      safeOption({
        id: 'opt_junk_datasheet',
        label: '型番を特定する',
        description: '顕微鏡とテスターを使って地道に調べる。回路の勉強になる。',
        successEffect: {
          knowledge: { [SubjectId.CIRCUIT]: KNOWLEDGE_GAINS.MEDIUM },
           sanity: COSTS.SANITY.SMALL
        },
        successLog: "地道な測定の結果、廃盤になったレアなオペアンプだと判明した。回路特性への理解が深まった。"
      }),
      highRiskOption({
        id: 'opt_junk_test',
        label: '通電してみる',
        description: '男なら一発勝負。回路に組み込んで電源ON。',
        successRate: SUCCESS_RATES.RISKY, // 30%
        successEffect: {
          knowledge: { [SubjectId.CIRCUIT]: KNOWLEDGE_GAINS.LARGE },
          sanity: 15
        },
        successLog: "動いた！しかもこれ、超高性能なFPGAだ！この感動はプライスレス。",
        failureEffect: {
          hp: COSTS.HP.MEDIUM,
          sanity: COSTS.SANITY.MEDIUM
        },
        failureLog: "「逆電圧か！？」強烈な異臭と共にチップが破裂。飛散した破片が頬をかすめた。顔が煤だらけだ。"
      }),
      lowRiskOption({
        id: 'opt_junk_auction',
        label: 'ヤフオクに出す',
        description: '「動作未確認ジャンク」として出品。小銭を稼ぐ。',
        successRate: SUCCESS_RATES.HIGH, // 80%
        successEffect: {
          money: 3000
        },
        successLog: "「NCNR（ノークレーム・ノーリターン）」で出品したら、マニアが即決価格で落札してくれた。",
        failureEffect: {
          sanity: COSTS.SANITY.SMALL
        },
        failureLog: "「送料の方が高い」とクレームが来て、結局廃棄する羽目になった。徒労だ。"
      })
    ]
  }
];
