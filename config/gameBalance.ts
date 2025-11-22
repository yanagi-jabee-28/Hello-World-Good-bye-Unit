
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
  TINY: 3,     // 些細なヒント
  SMALL: 5,    // 通常の学習支援
  MEDIUM: 10,  // 有益な情報
  LARGE: 15,   // 重要な試験対策
  HUGE: 20,    // 核心的リーク/過去問
};

export const RECOVERY_VALS = {
  MINOR: 5,
  SMALL: 10,
  MODERATE: 15,
  LARGE: 20,
  HUGE: 30,
};

export const REL_GAINS = {
  SMALL: 3,
  Qm: 5,     // Quarter match (minor interaction)
  MEDIUM: 8,
  LARGE: 10,
  HUGE: 15,
  XY: 25,    // Gift bonus
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
