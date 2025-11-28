
import { GameEvent, TimeSlot } from '../../types';
import { WEIGHTS, COOLDOWNS, RECOVERY_VALS, COSTS, SUCCESS_RATES } from '../../config/gameBalance';
import { Effect } from '../presets/effectTemplates';
import { highRiskOption, lowRiskOption, safeOption } from '../builders';

/**
 * WORK EVENTS
 * 通常の結果イベントと、選択肢が発生するトラブルイベントを定義
 */
export const WORK_EVENTS: GameEvent[] = [
  // ==========================================
  // BRANCHING EVENTS (Troubles & Opportunities)
  // ==========================================
  {
    id: 'work_trouble_server_down',
    trigger: 'action_work',
    text: "【障害】「サーバーが落ちた！」現場は阿鼻叫喚だ。マニュアル通りの復旧手順は通用しない。",
    type: 'mixed',
    category: 'work_branching',
    weight: WEIGHTS.RARE, // 時折発生
    conditions: { timeSlots: [TimeSlot.NIGHT, TimeSlot.LATE_NIGHT] },
    coolDownTurns: COOLDOWNS.LONG,
    options: [
      highRiskOption({
        id: 'opt_work_fix_force',
        label: '力技で復旧',
        description: 'リスクを負って独自パッチを当てる。成功すれば英雄、失敗すれば戦犯。',
        successRate: SUCCESS_RATES.VERY_LOW, // 40%
        successEffect: {
          money: 15000, // Bonus
          hp: COSTS.HP.LARGE,
          sanity: COSTS.SANITY.MEDIUM
        },
        successLog: "「神か！？」独自のパッチが奇跡的に噛み合った。特別ボーナスが支給された。",
        failureEffect: {
          hp: COSTS.HP.HUGE,
          sanity: COSTS.SANITY.CRITICAL,
          money: 2000 // Base pay only
        },
        failureLog: "二次被害が発生...。朝まで泥沼の復旧作業に従事させられた。"
      }),
      lowRiskOption({
        id: 'opt_work_fix_manual',
        label: '地道にログ解析',
        description: '徹夜覚悟で原因を特定する。',
        successRate: SUCCESS_RATES.VERY_HIGH, // 90%
        successEffect: {
          money: COSTS.MONEY.REWARD_LARGE, // Overtime pay
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
          money: 1000, // Minimum pay
          sanity: COSTS.SANITY.SMALL
        },
        successLog: "「すいません、限界です...」現場を後にした。罪悪感が残る。"
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
          money: 5000,
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
          money: 0, // Fired/Penalized
          sanity: COSTS.SANITY.MEDIUM
        },
        failureLog: "「生意気だ！」火に油を注ぎ、バイトをクビ（即日退勤）になった。"
      })
    ]
  },

  // ==========================================
  // RESULT EVENTS (Normal Outcomes)
  // ==========================================
  
  // --- NIGHT / LATE NIGHT (High Risk/Return) ---
  {
    id: 'work_night_critical_success',
    trigger: 'action_work',
    text: "【神対応】再起動一発で障害復旧。余った時間で技術書を読み、特別手当まで出た。",
    type: 'good',
    category: 'work_result',
    weight: 15,
    conditions: { timeSlots: [TimeSlot.LATE_NIGHT] },
    effect: {
      ...Effect.Item.Earn(3000), // Bonus on top of base
      sanity: 10, // Less sanity cost (recover relative to base)
      hp: 10 // Less HP cost
    }
  },
  {
    id: 'work_night_success',
    trigger: 'action_work',
    text: "【順調】ログ調査だけで原因特定。平和な夜だった。",
    type: 'good',
    category: 'work_result',
    weight: 30,
    conditions: { timeSlots: [TimeSlot.LATE_NIGHT] },
    effect: {
      ...Effect.Item.Earn(1000),
      sanity: 5
    }
  },
  {
    id: 'work_night_normal',
    trigger: 'action_work',
    text: "【完了】スパゲッティコードの海を泳ぎ切った。報酬は手に入れたが、人間として大切な何かを失った気がする。",
    type: 'flavor',
    category: 'work_result',
    weight: 35,
    conditions: { timeSlots: [TimeSlot.LATE_NIGHT] },
    effect: {} // Base values apply
  },
  {
    id: 'work_night_failure',
    trigger: 'action_work',
    text: "【泥沼】原因不明のエラー。朝までログと睨めっこする羽目になった。",
    type: 'bad',
    category: 'work_result',
    weight: 15,
    conditions: { timeSlots: [TimeSlot.LATE_NIGHT] },
    effect: {
      hp: COSTS.HP.SMALL, // Extra cost
      sanity: COSTS.SANITY.MEDIUM
    }
  },
  {
    id: 'work_night_critical_failure',
    trigger: 'action_work',
    text: "【炎上】「DBをDROPしました」...新人のミスをカバーするため、命を削って復旧作業を行った。",
    type: 'bad',
    category: 'work_result',
    weight: 5,
    conditions: { timeSlots: [TimeSlot.LATE_NIGHT] },
    effect: {
      money: COSTS.MONEY.PENALTY_MEDIUM, // Penalty (reduced salary)
      hp: COSTS.HP.LARGE,
      sanity: COSTS.SANITY.HUGE
    }
  },

  // --- DAYTIME / EVENING (Medium) ---
  {
    id: 'work_day_lucky',
    trigger: 'action_work',
    text: "【臨時収入】現場リーダーに気に入られ、こっそりボーナスを握らされた。",
    type: 'good',
    category: 'work_result',
    weight: 10,
    conditions: { timeSlots: [TimeSlot.NOON, TimeSlot.AFTERNOON, TimeSlot.AFTER_SCHOOL, TimeSlot.NIGHT] },
    effect: {
      ...Effect.Item.Earn(2000),
      sanity: 5
    }
  },
  {
    id: 'work_day_normal',
    trigger: 'action_work',
    text: "【完了】シフトを無事に終えた。身体が重いが、財布は潤った。",
    type: 'flavor',
    category: 'work_result',
    weight: 60,
    conditions: { timeSlots: [TimeSlot.NOON, TimeSlot.AFTERNOON, TimeSlot.AFTER_SCHOOL, TimeSlot.NIGHT] },
    effect: {}
  },
  {
    id: 'work_day_trouble',
    trigger: 'action_work',
    text: "【トラブル】客からの理不尽なクレーム対応で時間を浪費した。精神的に疲れた...",
    type: 'bad',
    category: 'work_result',
    weight: 30,
    conditions: { timeSlots: [TimeSlot.NOON, TimeSlot.AFTERNOON, TimeSlot.AFTER_SCHOOL, TimeSlot.NIGHT] },
    effect: {
      money: -500, // Reduced salary
      sanity: COSTS.SANITY.MEDIUM
    }
  },

  // --- MORNING / AM (Low Risk) ---
  {
    id: 'work_morning_refresh',
    trigger: 'action_work',
    text: "【爽快】朝日を浴びて作業完了。身体を動かして逆に目が覚めた。",
    type: 'good',
    category: 'work_result',
    weight: 20,
    conditions: { timeSlots: [TimeSlot.MORNING, TimeSlot.AM] },
    effect: {
      sanity: 5,
      hp: 5 // Recover
    }
  },
  {
    id: 'work_morning_normal',
    trigger: 'action_work',
    text: "【完了】眠い目をこすりながら作業を終えた。割に合わない気がするが、背に腹は代えられない。",
    type: 'flavor',
    category: 'work_result',
    weight: 80,
    conditions: { timeSlots: [TimeSlot.MORNING, TimeSlot.AM] },
    effect: {}
  }
];
