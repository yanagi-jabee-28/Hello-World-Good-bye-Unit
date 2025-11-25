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
  salary: 2200, // Reduced: 2800 -> 2200
  hpCost: 15,   // Increased cost: 10 -> 15
  sanityCost: 5,
  logText: "【早朝シフト】眠い目をこすりながら搬入作業。割に合わない気がするが、背に腹は代えられない。",
  logType: 'info'
};

const DAY_CONFIG: WorkConfig = {
  label: "日中シフト",
  description: "肉体労働",
  salary: 3500, // Reduced: 4200 -> 3500
  hpCost: 35,   // Increased cost: 30 -> 35
  sanityCost: 15,
  logText: "【日中シフト】戦場のようなランチラッシュを捌いた。身体が鉛のように重い。",
  logType: 'info'
};

const EVENING_CONFIG: WorkConfig = {
  label: "塾講師バイト",
  description: "精神労働",
  salary: 5000, // Reduced: 6000 -> 5000
  hpCost: 15,
  sanityCost: 30, // Increased cost: 25 -> 30
  logText: "【塾講師バイト】「先生、ここ学校で習ってない」...理不尽なクレームに笑顔で耐え、精神を削った。",
  logType: 'warning'
};

const NIGHT_CONFIG: WorkConfig = {
  label: "深夜緊急案件",
  description: "危険手当",
  salary: 8500, // Reduced: 10000 -> 8500
  hpCost: 45,   // Adjusted: 60 -> 45 (To prevent insta-death on critical fail)
  sanityCost: 40, // Adjusted: 50 -> 40
  logText: "【深夜・緊急案件】スパゲッティコードの海を泳ぎ切った。報酬は手に入れたが、人間として大切な何かを失った気がする。",
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
    salary: 1500,
    hpCost: 20,
    sanityCost: 10,
    logText: "【労働】単発バイトをこなした。",
    logType: 'info'
  };
};