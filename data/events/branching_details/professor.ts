
import { GameEvent, RelationshipId, SubjectId, ItemId } from '../../../types';
import { WEIGHTS, COOLDOWNS, REL_TIERS, KNOWLEDGE_GAINS, REL_GAINS, COSTS, SUCCESS_RATES } from '../../../config/gameBalance';
import { SATIETY_CONSUMPTION } from '../../../config/gameConstants';
import { lowRiskOption, highRiskOption, createOption, safeOption } from '../../builders';

export const professorBranching: GameEvent[] = [
  {
    id: 'prof_interaction_menu',
    trigger: 'action_professor',
    persona: 'PROFESSOR',
    text: "【教授室】教授は在室のようだ。どうする？",
    type: 'mixed',
    weight: 0, 
    options: [
      lowRiskOption({
        id: 'opt_prof_ask_exam',
        label: '今回の試験について聞く',
        description: '出題傾向を探る。確実な情報が得られる。',
        successRate: SUCCESS_RATES.VERY_HIGH, // 90%
        successEffect: {
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
  }
];
