
import { TimeSlot, LogEntry } from '../types';

export interface WorkConfig {
  label: string;
  description: string;
  salary: number;
  hpCost: number;
  sanityCost: number;
  logText: string;
  logType: LogEntry['type'];
}

const MORNING_CONFIG: WorkConfig = {
  label: "早朝・午前シフト",
  description: "軽作業",
  salary: 2800,
  hpCost: 10,
  sanityCost: 5,
  logText: "【早朝シフト】生協で商品の搬入作業を行った。眠いが、小銭にはなる。",
  logType: 'info'
};

const DAY_CONFIG: WorkConfig = {
  label: "日中シフト",
  description: "肉体労働",
  salary: 4200,
  hpCost: 30,
  sanityCost: 10,
  logText: "【日中シフト】学食のランチラッシュ。戦場のような厨房でひたすら皿を洗った。時給以上の働きを強いられた気がする。",
  logType: 'info'
};

const EVENING_CONFIG: WorkConfig = {
  label: "塾講師バイト",
  description: "精神労働",
  salary: 6000,
  hpCost: 15,
  sanityCost: 25,
  logText: "【塾講師バイト】生意気な受験生に数学を教えた。「先生、それ説明わかりにくい」と言われ、精神を削られた。",
  logType: 'warning'
};

const NIGHT_CONFIG: WorkConfig = {
  label: "深夜緊急案件",
  description: "危険手当",
  salary: 10000,
  hpCost: 50,
  sanityCost: 45,
  logText: "【深夜・緊急案件】「サーバーが落ちた」と叩き起こされ、朝までトラブルシューティング。報酬はいいが、寿命が縮んだ音がした。",
  logType: 'danger'
};

export const WORK_CONFIGS: Record<TimeSlot, WorkConfig> = {
  [TimeSlot.MORNING]: MORNING_CONFIG,
  [TimeSlot.AM]: MORNING_CONFIG,
  [TimeSlot.NOON]: DAY_CONFIG,
  [TimeSlot.AFTERNOON]: DAY_CONFIG,
  [TimeSlot.AFTER_SCHOOL]: EVENING_CONFIG,
  [TimeSlot.NIGHT]: EVENING_CONFIG,
  [TimeSlot.LATE_NIGHT]: NIGHT_CONFIG,
};

export const getWorkConfig = (slot: TimeSlot): WorkConfig => {
  return WORK_CONFIGS[slot] || {
    label: "アルバイト",
    description: "資金獲得",
    salary: 2000,
    hpCost: 20,
    sanityCost: 10,
    logText: "【労働】臨時バイトをこなした。",
    logType: 'info'
  };
};
