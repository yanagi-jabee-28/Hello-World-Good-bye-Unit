
import { GameEvent, RelationshipId, SubjectId, ItemId, TimeSlot } from '../../../types';
import { WEIGHTS, COOLDOWNS, REL_TIERS, KNOWLEDGE_GAINS, REL_GAINS, COSTS, SUCCESS_RATES, RECOVERY_VALS } from '../../../config/gameBalance';
import { safeOption, midRiskOption, lowRiskOption, highRiskOption } from '../../builders';

export const seniorBranching: GameEvent[] = [
  {
    id: 'senior_interaction_menu',
    trigger: 'action_senior',
    persona: 'SENIOR',
    text: "【先輩】「おっ、どうした？なんか用か？」",
    type: 'mixed',
    weight: 0, 
    options: [
      safeOption({
        id: 'opt_senior_meal',
        label: 'ご飯に行きましょう',
        description: '奢ってもらって回復する。',
        successEffect: {
          hp: RECOVERY_VALS.LARGE,
          sanity: RECOVERY_VALS.SMALL,
          satiety: 60,
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
  }
];
