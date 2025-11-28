
/**
 * 数値計算ユーティリティ
 * 防御的プログラミングを行い、null/undefined/空配列に対して安全な値を返す
 */

/** 平均値（空配列は0） */
export const average = (nums: number[]): number => {
  if (!nums || nums.length === 0) return 0;
  const sum = nums.reduce((acc, n) => acc + n, 0);
  return sum / nums.length;
};

/** 最大値（空配列はdefaultValue） */
export const maxOrDefault = (nums: number[], defaultValue = 0): number => {
  if (!nums || nums.length === 0) return defaultValue;
  return nums.reduce((m, n) => (n > m ? n : m), nums[0]);
};

/** 最小値（空配列はdefaultValue） */
export const minOrDefault = (nums: number[], defaultValue = 0): number => {
  if (!nums || nums.length === 0) return defaultValue;
  return nums.reduce((m, n) => (n < m ? n : m), nums[0]);
};

/** 整数丸め（四捨五入） */
export const round = (n: number): number => Math.round(n);

/** 切り捨て */
export const floor = (n: number): number => Math.floor(n);

/** 確率表示用フォーマッタ (例: "成功率: 50%") */
export const formatSuccessRate = (rate: number): string => `成功率: ${Math.round(rate)}%`;
