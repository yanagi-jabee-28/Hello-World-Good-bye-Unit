
import { GameEvent, RelationshipId, SubjectId, ItemId } from '../../../types';
import { WEIGHTS, COOLDOWNS, REL_TIERS, KNOWLEDGE_GAINS, REL_GAINS, COSTS, SUCCESS_RATES, RECOVERY_VALS } from '../../../config/gameBalance';
import { SATIETY_CONSUMPTION } from '../../../config/gameConstants';
import { safeOption, createOption, midRiskOption, lowRiskOption, highRiskOption } from '../../builders';

export const friendBranching: GameEvent[] = [
  {
    id: 'friend_interaction_menu',
    trigger: 'action_friend',
    persona: 'FRIEND',
    text: "【友人】「よっ。これからどうする？」",
    type: 'mixed',
    weight: 0, 
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
          hp: COSTS.HP.LARGE, // Costs HP to listen
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
        successRate: 85, 
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
          money: COSTS.MONEY.REWARD_LARGE,
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
  }
];