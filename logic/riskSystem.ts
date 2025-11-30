
import { GameState, SubjectId, TimeSlot, GameEventOption, GameEventEffect, ItemId } from '../types';
import { WORK_CONFIGS } from '../data/work';
import { ITEMS } from '../data/items';
import { CAFFEINE_THRESHOLDS, STUDY_CONSTANTS, SATIETY_CONSUMPTION } from '../config/gameConstants';
import { RISK_PREDICTION } from '../config/gameBalance';

/**
 * リスク予測ロジック v2.0
 * Directモード: 確定コストのみで死亡判定
 * Predictiveモード: 確率的失敗やイベントによる追加ダメージを含めて判定（「運が悪ければ死ぬ」を検知）
 */

// Helper to check if a change results in death
const checkFatal = (current: number, cost: number): boolean => {
  return current + cost <= 0;
};

// --- STUDY RISK ---
const getStudyPressure = (day: number): number => {
  if (day <= 3) return 1.0;
  if (day <= 5) return 1.1;
  return 1.25; 
};

export const predictStudyRisk = (state: GameState): boolean => {
  const pressure = getStudyPressure(state.day);
  let hpCost = Math.floor(10 * pressure);
  let sanityCost = Math.floor(10 * pressure);

  // TimeSlot Modifiers
  switch (state.timeSlot) {
    case TimeSlot.AFTERNOON:
      hpCost += 2;
      break;
    case TimeSlot.NIGHT:
      hpCost += 5;
      break;
    case TimeSlot.LATE_NIGHT:
      sanityCost += 20;
      hpCost += 10;
      break;
  }

  // Caffeine Modifiers
  if (state.caffeine >= CAFFEINE_THRESHOLDS.TOXICITY) {
    hpCost += 15;
    sanityCost += 15;
  } else if (state.caffeine >= CAFFEINE_THRESHOLDS.ZONE) {
    hpCost += 5;
    sanityCost += 5;
  }

  // Madness Modifier
  if (state.sanity < STUDY_CONSTANTS.MADNESS_THRESHOLD) {
    hpCost += STUDY_CONSTANTS.MADNESS_HP_COST;
  }

  // Predictive Buffer (Study events rarely damage, but randomness exists)
  if (state.debugFlags.riskPredictionMode === 'predictive') {
    hpCost += RISK_PREDICTION.STUDY_VARIANCE.HP;
    sanityCost += RISK_PREDICTION.STUDY_VARIANCE.SANITY;
  }

  return checkFatal(state.hp, -hpCost) || checkFatal(state.sanity, -sanityCost);
};

// --- WORK RISK ---
export const predictWorkRisk = (state: GameState): boolean => {
  const config = WORK_CONFIGS[state.timeSlot];
  if (!config) return false;

  let hpCost = config.hpCost;
  let sanityCost = config.sanityCost;

  if (state.caffeine >= CAFFEINE_THRESHOLDS.TOXICITY) {
    hpCost = Math.floor(hpCost * 1.5);
    sanityCost = Math.floor(sanityCost * 1.5);
  } else if (state.caffeine >= CAFFEINE_THRESHOLDS.ZONE) {
    hpCost = Math.floor(hpCost * 1.2);
  } else if (state.caffeine >= CAFFEINE_THRESHOLDS.AWAKE) {
    hpCost = Math.floor(hpCost * 1.1);
  }

  // Predictive Buffer (Work often has failure events)
  if (state.debugFlags.riskPredictionMode === 'predictive') {
    hpCost += RISK_PREDICTION.WORK_FAILURE_BUFFER.HP;
    sanityCost += RISK_PREDICTION.WORK_FAILURE_BUFFER.SANITY;
  }

  return checkFatal(state.hp, -hpCost) || checkFatal(state.sanity, -sanityCost);
};

// --- ITEM RISK ---
export const predictItemRisk = (state: GameState, itemId: ItemId): boolean => {
  const item = ITEMS[itemId];
  if (!item || !item.effects) return false;

  // Base effect check
  let hpCost = 0;
  let sanityCost = 0;

  // Apply direct costs if they are damage
  if (item.effects.hp && item.effects.hp < 0) {
     hpCost += Math.abs(item.effects.hp);
  }
  if (item.effects.sanity && item.effects.sanity < 0) {
     sanityCost += Math.abs(item.effects.sanity);
  }

  // Predictive check for failure probability items
  if (state.debugFlags.riskPredictionMode === 'predictive') {
     // USB Memory etc. have failure chance
     if (itemId === ItemId.USB_MEMORY || itemId === ItemId.VERIFIED_PAST_PAPERS) {
        hpCost += RISK_PREDICTION.ITEM_FAILURE_BUFFER.HP;
        sanityCost += RISK_PREDICTION.ITEM_FAILURE_BUFFER.SANITY;
     }
  }

  return checkFatal(state.hp, -hpCost) || checkFatal(state.sanity, -sanityCost);
};

// --- EVENT OPTION RISK ---
export const predictOptionRisk = (state: GameState, option: GameEventOption): boolean => {
  const mode = state.debugFlags.riskPredictionMode;

  // Check success effect (Always check, as some successes have costs)
  if (option.successEffect) {
    if (option.successEffect.hp && checkFatal(state.hp, option.successEffect.hp)) return true;
    if (option.successEffect.sanity && checkFatal(state.sanity, option.successEffect.sanity)) return true;
  }

  // Check failure effect (Usually only relevant in Predictive mode, or if success rate is very low?)
  // For safety, Direct mode also checks failure if it's guaranteed (successRate 0), but predictive checks possibilities.
  
  if (mode === 'predictive' && option.failureEffect) {
    if (option.failureEffect.hp && checkFatal(state.hp, option.failureEffect.hp)) return true;
    if (option.failureEffect.sanity && checkFatal(state.sanity, option.failureEffect.sanity)) return true;
  }

  // Special case: Risk level 'high' options often imply danger beyond immediate effect
  if (mode === 'predictive' && option.risk === 'high') {
     // Heuristic: if low stats, flag high risk options as lethal
     if (state.hp < 20 || state.sanity < 20) return true;
  }

  return false;
};
