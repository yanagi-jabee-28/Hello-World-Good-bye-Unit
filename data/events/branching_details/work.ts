
import { GameEvent, SubjectId, TimeSlot, RelationshipId } from '../../../types';
import { WEIGHTS, COOLDOWNS, REL_TIERS, KNOWLEDGE_GAINS, REL_GAINS, COSTS, SUCCESS_RATES } from '../../../config/gameBalance';
import { SATIETY_CONSUMPTION } from '../../../config/gameConstants';
import { lowRiskOption, highRiskOption, safeOption, midRiskOption } from '../../builders';

export const workBranching: GameEvent[] = [
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
        failureLog: "スクレイピング先のサイト構造が変わっていて動作せず。修正依頼で泥沼化し、結局キャンセルに..."
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
        successLog: "「これは期待以上です！」追加報酬＋高評価レビューを獲得。エンジニアとしての自信がついた。",
        failureEffect: {
          hp: COSTS.HP.HUGE,
          sanity: -25,
          satiety: COSTS.SATIETY.XL,
          money: COSTS.MONEY.PENALTY_MEDIUM
        },
        failureLog: "作り込みすぎて納期に間に合わず。仕様変更トラブルにも発展し、評価は最悪だ..."
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
          money: 5000,
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
        failureLog: "スクリプトがバグって納品データが破損！ 手動でやり直す羽目になり、倍の時間がかかった..."
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
  {
    id: 'work_trouble_server_down',
    trigger: 'action_work',
    text: "【障害】「サーバーが落ちた！」現場は阿鼻叫喚だ。マニュアル通りの復旧手順は通用しない。",
    type: 'mixed',
    category: 'work_branching',
    weight: WEIGHTS.RARE,
    conditions: { timeSlots: [TimeSlot.NIGHT, TimeSlot.LATE_NIGHT] },
    coolDownTurns: COOLDOWNS.LONG,
    options: [
      highRiskOption({
        id: 'opt_work_fix_force',
        label: '力技で復旧',
        description: 'リスクを負って独自パッチを当てる。成功すれば英雄、失敗すれば戦犯。',
        successRate: SUCCESS_RATES.VERY_LOW, // 40%
        successEffect: {
          money: 15000, // Includes base salary + bonus
          hp: COSTS.HP.LARGE,
          sanity: COSTS.SANITY.MEDIUM
        },
        successLog: "「神か！？」独自のパッチが奇跡的に噛み合った。特別ボーナスが支給された。",
        failureEffect: {
          hp: COSTS.HP.HUGE,
          sanity: COSTS.SANITY.CRITICAL,
          money: 2000 // Base pay only (reduced)
        },
        failureLog: "二次被害が発生...。朝まで泥沼の復旧作業に従事させられた。現場の視線が痛い。"
      }),
      lowRiskOption({
        id: 'opt_work_fix_manual',
        label: '地道にログ解析',
        description: '徹夜覚悟で原因を特定する。',
        successRate: SUCCESS_RATES.VERY_HIGH, // 90%
        successEffect: {
          money: COSTS.MONEY.REWARD_LARGE, // ~8000 (standard night pay)
          hp: COSTS.HP.CRITICAL,
          sanity: COSTS.SANITY.HUGE
        },
        successLog: "朝日が昇る頃、ようやく原因を特定・修正した。身体はボロボロだが、信頼は得た。"
      }),
      safeOption({
        id: 'opt_work_escape',
        label: '体調不良で帰る',
        description: 'これ以上の責任は負えない。',
        successEffect: {
          money: 3000, // Reduced pay
          sanity: COSTS.SANITY.SMALL
        },
        successLog: "「すいません、限界です...」現場を後にした。罪悪感が残るが、日当の一部は貰えた。"
      })
    ]
  },
  {
    id: 'work_trouble_claim',
    trigger: 'action_work',
    text: "【理不尽】「話が違う！」クライアント（または保護者）が激怒している。担当者は不在だ。",
    type: 'mixed',
    category: 'work_branching',
    weight: WEIGHTS.UNCOMMON,
    conditions: { timeSlots: [TimeSlot.AFTER_SCHOOL, TimeSlot.NOON, TimeSlot.AFTERNOON] },
    coolDownTurns: COOLDOWNS.MEDIUM,
    options: [
      safeOption({
        id: 'opt_work_apologize',
        label: 'ひたすら謝る',
        description: '精神を削って嵐が過ぎるのを待つ。',
        successEffect: {
          money: 5000, // Standard day pay
          sanity: -25
        },
        successLog: "1時間サンドバッグになった。給料分は働いたはずだ。"
      }),
      highRiskOption({
        id: 'opt_work_argue',
        label: '論理的に反論',
        description: '相手の矛盾を突く。成功すればスカッとするが...',
        successRate: SUCCESS_RATES.RISKY, // 30%
        successEffect: {
          money: 5000,
          sanity: 10
        },
        successLog: "完全論破。相手はぐうの音も出ずに引き下がった。精神衛生上とても良い。",
        failureEffect: {
          money: 1000, // Fired/Penalized
          sanity: COSTS.SANITY.MEDIUM
        },
        failureLog: "「生意気だ！」火に油を注ぎ、バイトをクビ（即日退勤・減給）になった。"
      })
    ]
  },
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
        failureLog: "【緊急】セキュリティチームに検知され、事情聴取を受けた。処分は免れたが、ブラックリスト入りした..."
      }),
      safeOption({
        id: 'opt_bug_ignore',
        label: '何もしない',
        description: '見なかったことにする。',
        successEffect: { sanity: COSTS.SANITY.SMALL },
        successLog: "関わらないのが一番だ。静観を決め込んだ。"
      })
    ]
  }
];