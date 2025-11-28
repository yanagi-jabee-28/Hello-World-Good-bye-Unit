
// カフェイン関連
export const CAFFEINE_DECAY = 15; // 毎ターンの自然減衰量 (増量: 10 -> 15)

export const CAFFEINE_THRESHOLDS = {
  AWAKE: 40,    // 覚醒ライン (効率1.2倍)
  ZONE: 100,    // 集中ライン (効率1.5倍, 微ダメージ)
  TOXICITY: 150 // 中毒ライン (効率2.0倍, 大ダメージ)
};

// 満腹度関連 (Satiety) - 胃のキャパシティ管理へ変更
export const SATIETY_CONSTANTS = {
  MAX: 100,
  DECAY: 5,      // 自然減少(基礎代謝)
  STARVING: 10,  // UI表示上の空腹ライン（ペナルティなし）
  STUFFED: 85,   // 満腹ライン (学習効率低下)
  STARVING_DMG_HP: 0,
  STARVING_DMG_SAN: 0,
  STUFFED_PENALTY: 0.9 // 満腹ペナルティ
};

// 行動別の空腹度消費 (Action-based Satiety Consumption)
export const SATIETY_CONSUMPTION = {
  // 基本行動
  STUDY: 18,       // 高負荷：脳を使うと糖分消費大 (12 -> 18)
  WORK: 22,        // 最高負荷：肉体労働 (18 -> 22)
  SOCIAL: 10,      // 中負荷：会話のストレス (8 -> 10)
  REST: 5,         // 低負荷：寝ている間も基礎代謝
  ESCAPISM: 10,    // 中負荷：ゲーム・動画鑑賞の集中力消費 (10 -> 10)
  
  // 時間帯補正（深夜は代謝が下がる）
  LATE_NIGHT_MULT: 0.7,  // 深夜は消費0.7倍
  
  // カフェイン補正
  CAFFEINE_ZONE_MULT: 1.3,    // カフェインで代謝UP
  CAFFEINE_TOXIC_MULT: 2.0,   // 中毒状態は激しく消費 (1.5 -> 2.0)
};

// 学習関連定数 [New]
export const STUDY_CONSTANTS = {
  // 過去問ボーナス: 累積枚数ごとの加算量 (逓減)
  // 1枚目: +10%, 2枚目: +5%, 3枚目: +3%, 4枚目以降: +2% (Max +20%付近)
  PAST_PAPER_BONUS_TABLE: [0, 0.10, 0.05, 0.03, 0.02], 
  
  MADNESS_THRESHOLD: 30, // 狂気ボーナス発動閾値(SAN)
  MADNESS_EFFICIENCY_BONUS: 1.3, // 狂気時の効率ボーナス
  MADNESS_HP_COST: 10, // 狂気時の追加HP消費
};

// バフ関連
export const BUFF_SOFT_CAP_ASYMPTOTE = 1.5; 

// イベント関連
export const EVENT_CONSTANTS = {
  RANDOM_PROBABILITY: 20, // ランダムイベント発生確率 (%)
  ISOLATION_THRESHOLD: 12, // 孤独判定までのターン数
  ISOLATION_DAMAGE: 3,     // 孤独時のSAN減少量
};