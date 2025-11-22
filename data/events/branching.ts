
import { GameEvent, RelationshipId, SubjectId, ItemId } from '../../types';
import { WEIGHTS, COOLDOWNS, REL_TIERS } from '../../config/gameBalance';

export const BRANCHING_EVENTS: GameEvent[] = [
  // --- PROFESSOR EVENTS ---
  {
    id: 'prof_special_task',
    trigger: 'action_professor',
    text: "【打診】教授から研究室のデータ整理を手伝わないかと誘われた。「君なら信用できると思ってね」",
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

  // --- SENIOR EVENTS ---
  {
    id: 'senior_gamble_offer',
    trigger: 'action_senior',
    text: "【賭け】「おい、ちょっと面白いバイトがあるんだが」先輩が怪しい話を持ちかけてきた。ハイリスク・ハイリターンな匂いがする。",
    type: 'mixed',
    weight: WEIGHTS.RARE,
    conditions: { minRelationship: REL_TIERS.MID },
    options: [
      {
        id: 'opt_senior_gamble_yes',
        label: '乗る',
        risk: 'high',
        description: '成功率50%。成功で大金、失敗で時間と体力を浪費。',
        successRate: 50,
        successEffect: {
          money: 10000,
          relationships: { [RelationshipId.SENIOR]: 10 }
        },
        successLog: "予想外に上手くいった！濡れ手に粟の大金を手に入れた。",
        failureEffect: {
          hp: -40,
          money: -2000,
          sanity: -20
        },
        failureLog: "完全に騙された。タダ働きさせられた挙句、自腹を切る羽目に..."
      },
      {
        id: 'opt_senior_gamble_no',
        label: 'やめておく',
        risk: 'safe',
        description: '君子危うきに近寄らず。',
        successRate: 100,
        successEffect: {},
        successLog: "「ちぇっ、つまんねーの」先輩は肩をすくめて去っていった。"
      }
    ]
  },

  // --- FRIEND EVENTS ---
  {
    id: 'friend_midnight_call',
    trigger: 'action_friend',
    text: "【着信】深夜2時、友人から通話がかかってきた。間違いなく愚痴か遊びの誘いだ。",
    type: 'mixed',
    weight: WEIGHTS.UNCOMMON,
    options: [
      {
        id: 'opt_friend_call_answer',
        label: '出る',
        risk: 'low',
        description: '朝まで付き合う。SAN値は回復するが、体力は削れる。',
        successRate: 100,
        successEffect: {
          sanity: 30,
          hp: -20,
          relationships: { [RelationshipId.FRIEND]: 10 }
        },
        successLog: "朝までゲームと愚痴で盛り上がった。ストレスは吹き飛んだが、目の下がクマだらけだ。"
      },
      {
        id: 'opt_friend_call_ignore',
        label: '無視する',
        risk: 'low',
        description: '睡眠を優先する。孤独感が増すかもしれない。',
        successRate: 80,
        successEffect: {
          hp: 5
        },
        successLog: "着信を無視して寝た。英断だ。",
        failureEffect: {
          sanity: -5,
          relationships: { [RelationshipId.FRIEND]: -5 }
        },
        failureLog: "着信音が鳴り止まず、罪悪感で眠れなかった..."
      }
    ]
  },

  // --- TURN END EVENTS ---
  {
    id: 'turn_end_lost_wallet',
    trigger: 'turn_end',
    text: "【紛失】財布が見当たらない...。最後に立ち寄ったコンビニか？",
    type: 'bad',
    weight: WEIGHTS.RARE,
    options: [
      {
        id: 'opt_wallet_search',
        label: '必死に探す',
        risk: 'high',
        description: '見つかる確率は五分五分。見つからなければ徒労に終わる。',
        successRate: 60,
        successEffect: {
          sanity: -5,
          hp: -10
        },
        successLog: "ゴミ箱の横に落ちていた！中身も無事だ。心底ホッとした。",
        failureEffect: {
          sanity: -20,
          hp: -20,
          money: -5000
        },
        failureLog: "数時間探し回ったが見つからなかった...。金も時間も失った。"
      },
      {
        id: 'opt_wallet_ignore',
        label: '諦めて寝る',
        risk: 'safe',
        description: '金は諦める。メンタルケアを優先。',
        successRate: 100,
        successEffect: {
          money: -5000
        },
        successLog: "「勉強代だ」と割り切って寝ることにした。悔しいが、時間は貴重だ。"
      }
    ]
  }
];
