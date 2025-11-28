
/**
 * GAME BALANCE CONSTANTS
 * 一元管理されたバランス調整用定数定義
 */

// --- RELATIONSHIP THRESHOLDS (友好度階層) ---
export const REL_TIERS = {
  LOW: 0,     // 初対面 - 顔見知り
  MID: 30,    // 信頼関係の始まり (アイテム交換など)
  HIGH: 60,   // 親密 (重要な情報の共有)
  ELITE: 80,  // 運命共同体 (核心的リーク、最強アイテム)
};

// --- REWARD VALUES (報酬量) ---
export const KNOWLEDGE_GAINS = {
  TINY: 4,
  SMALL: 7,
  MEDIUM: 12,
  LARGE: 18,
  HUGE: 25,
};

export const RECOVERY_VALS = {
  MINOR: 3,     // 5 -> 3
  SMALL: 8,     // 10 -> 8
  MODERATE: 15, // 20 -> 15 (回復量を抑制)
  LARGE: 25,    // 30 -> 25
  HUGE: 40,     // 50 -> 40
};

export const REL_GAINS = {
  SMALL: 2,    // 3 -> 2
  Qm: 4,       // 5 -> 4
  MEDIUM: 7,   // 8 -> 7
  LARGE: 10,   // 12 -> 10 (友好度を上げにくくする)
  HUGE: 18,    // 20 -> 18
  XY: 25,      // Gift bonus
};

// --- PROBABILITY WEIGHTS (発生重み) ---
export const WEIGHTS = {
  COMMON: 50,     // 頻出 (1/2程度)
  UNCOMMON: 30,   // 時折発生 (1/3程度)
  RARE: 15,       // レア (1/6程度)
  LEGENDARY: 5,   // 激レア (1/20程度)
  ONE_OFF: 100,   // 条件を満たしたら優先的に発生させたい場合
};

// --- COOLDOWNS (再発生制限ターン数) ---
export const COOLDOWNS = {
  SHORT: 2,
  MEDIUM: 5,
  LONG: 10,
};

// --- SUCCESS RATES (成功確率) [New] ---
export const SUCCESS_RATES = {
  GUARANTEED: 100,
  VERY_HIGH: 90,
  HIGH: 80,
  MID: 70, // 標準的な成功率
  LOW: 60,
  VERY_LOW: 40,
  RISKY: 30,
} as const;

// --- GENERIC COSTS & REWARDS (汎用コスト・報酬) [New] ---
// Balance Patch v2.1: Rewards decreased
export const COSTS = {
  HP: {
    TINY: -5,
    SMALL: -10,
    MEDIUM: -15,
    LARGE: -20,
    HUGE: -30,
    CRITICAL: -40,
  },
  SANITY: {
    TINY: -3,
    SMALL: -5,
    MEDIUM: -10,
    LARGE: -15,
    HUGE: -20,
    CRITICAL: -30,
    BOOST_MID: 15,
    BOOST_LARGE: 25,
    RECOVER_SMALL: 5,
  },
  MONEY: {
    PENALTY_SMALL: -1000,
    PENALTY_MEDIUM: -3000,
    PENALTY_MID: -3000,
    PENALTY_LARGE: -5000,
    REWARD_SMALL: 1500, // 2000 -> 1500
    REWARD_MEDIUM: 4000, // 5000 -> 4000
    REWARD_LARGE: 8000, // 10000 -> 8000
    LARGE_REWARD: 8000,
    REWARD_HUGE: 15000, // 20000 -> 15000
    XL_REWARD: 22000, // 30000 -> 22000
  },
  SATIETY: {
    TINY: -5,
    SMALL: -10,
    MEDIUM: -20,
    LARGE: -30,
    XL: -40,
    XXL: -60,
  }
} as const;
