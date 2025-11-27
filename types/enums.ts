
export enum SubjectId {
  MATH = 'MATH',
  ALGO = 'ALGO',
  CIRCUIT = 'CIRCUIT',
  HUMANITIES = 'HUMANITIES',
}

export enum TimeSlot {
  MORNING = '朝',
  AM = '午前',
  NOON = '昼',
  AFTERNOON = '午後',
  AFTER_SCHOOL = '放課後',
  NIGHT = '夜',
  LATE_NIGHT = '深夜',
}

export enum RelationshipId {
  PROFESSOR = 'PROFESSOR',
  SENIOR = 'SENIOR',
  FRIEND = 'FRIEND',
}

export enum GameStatus {
  PLAYING = 'PLAYING',
  GAME_OVER_HP = 'GAME_OVER_HP', // Hospitalized
  GAME_OVER_SANITY = 'GAME_OVER_SANITY', // Dropped out
  VICTORY = 'VICTORY', // Passed exams
  FAILURE = 'FAILURE', // Failed exams
}

export enum ItemId {
  USB_MEMORY = 'USB_MEMORY',
  MINERAL_WATER = 'MINERAL_WATER', // Decaf / HP small
  BLACK_COFFEE = 'BLACK_COFFEE',
  GUMMY_CANDY = 'GUMMY_CANDY', // Sanity small
  PROTEIN_BAR = 'PROTEIN_BAR', // HP medium
  HIGH_CACAO_CHOCO = 'HIGH_CACAO_CHOCO',
  CAFE_LATTE = 'CAFE_LATTE',
  ENERGY_DRINK = 'ENERGY_DRINK',
  HERBAL_TEA = 'HERBAL_TEA', // Decaf large / Sanity medium
  CUP_RAMEN = 'CUP_RAMEN',
  HOT_EYE_MASK = 'HOT_EYE_MASK',
  EARPLUGS = 'EARPLUGS',
  REFERENCE_BOOK = 'REFERENCE_BOOK',
  GAMING_SUPPLEMENT = 'GAMING_SUPPLEMENT',
  SMART_DRUG = 'SMART_DRUG',
  GIFT_SWEETS = 'GIFT_SWEETS',
  // --- New Hunger Items ---
  RICE_BALL = 'RICE_BALL', // Cheap, High Satiety
  ENERGY_JELLY = 'ENERGY_JELLY', // Efficient, Low Satiety
  DIGESTIVE_ENZYME = 'DIGESTIVE_ENZYME', // Reduces Satiety
}

export enum ActionType {
  STUDY = 'STUDY',
  REST = 'REST',
  ESCAPISM = 'ESCAPISM',
  ASK_SENIOR = 'ASK_SENIOR',
  ASK_PROFESSOR = 'ASK_PROFESSOR',
  RELY_FRIEND = 'RELY_FRIEND',
  USE_ITEM = 'USE_ITEM',
  RESTART = 'RESTART',
  WORK = 'WORK',
  BUY_ITEM = 'BUY_ITEM',
  RESOLVE_EVENT = 'RESOLVE_EVENT', // イベントの選択肢を決定
  LOAD_STATE = 'LOAD_STATE', // New: セーブデータロード用
  FULL_RESET = 'FULL_RESET', // New: 全データ消去・完全リセット用
  SOFT_RESET = 'SOFT_RESET', // New: セーブデータ残して強くてニューゲーム相当のリセット
  HARD_RESTART = 'HARD_RESTART', // New: 継承なしの強くてニューゲーム（周回諦め）
  SET_UI_SCALE = 'SET_UI_SCALE', // UIサイズ変更
}
