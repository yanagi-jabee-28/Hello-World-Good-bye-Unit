
// カフェイン関連
export const CAFFEINE_DECAY = 10; // 毎ターンの自然減衰量

export const CAFFEINE_THRESHOLDS = {
  AWAKE: 40,    // 覚醒ライン (効率1.2倍)
  ZONE: 100,    // 集中ライン (効率1.5倍, 微ダメージ)
  TOXICITY: 150 // 中毒ライン (効率2.0倍, 大ダメージ)
};

// バフ関連
export const BUFF_MULTIPLIER_CAP = 3.0; // バフによる倍率上昇の上限

// イベント関連
export const EVENT_CONSTANTS = {
  RANDOM_PROBABILITY: 20, // ランダムイベント発生確率 (%) - was 30
  ISOLATION_THRESHOLD: 12, // 孤独判定までのターン数 - was 9
  ISOLATION_DAMAGE: 5,     // 孤独時のSAN減少量 - was 8
};
