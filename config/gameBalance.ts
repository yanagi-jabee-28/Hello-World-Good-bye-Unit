
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
