
/**
 * Random Number Generator Utility
 * 乱数生成を一元管理し、将来的なシード値対応やテスト容易性を確保する
 */

export const rng = {
  /**
   * 0以上1未満の乱数を返す
   */
  random: (): number => Math.random(),

  /**
   * 指定された確率(%)でtrueを返す
   */
  chance: (percentage: number): boolean => Math.random() * 100 < percentage,

  /**
   * 配列からランダムに1つの要素を選ぶ
   */
  pick: <T>(arr: T[]): T | undefined => {
    if (arr.length === 0) return undefined;
    return arr[Math.floor(Math.random() * arr.length)];
  },

  /**
   * min以上max以下の整数を返す
   */
  range: (min: number, max: number): number => {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }
};
