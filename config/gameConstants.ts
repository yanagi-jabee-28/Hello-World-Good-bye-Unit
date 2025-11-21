
// カフェイン関連
export const CAFFEINE_DECAY = 10; // 毎ターンの自然減衰量

export const CAFFEINE_THRESHOLDS = {
  AWAKE: 40,    // 覚醒ライン (効率1.2倍)
  ZONE: 100,    // 集中ライン (効率1.5倍, 微ダメージ)
  TOXICITY: 150 // 中毒ライン (効率2.0倍, 大ダメージ)
};

// バフ関連
// BUFF_MULTIPLIER_CAP を廃止し、漸近線(Soft Cap)を使用
export const BUFF_SOFT_CAP_ASYMPTOTE = 2.5; // 倍率の増加分がこの値に漸近する（実質最大倍率 = 1 + 2.5 = 3.5倍付近）

// イベント関連
export const EVENT_CONSTANTS = {
  RANDOM_PROBABILITY: 20, // ランダムイベント発生確率 (%)
  ISOLATION_THRESHOLD: 12, // 孤独判定までのターン数 (緩和: 9 -> 12)
  ISOLATION_DAMAGE: 3,     // 孤独時のSAN減少量 (緩和: 5 -> 3)
};
