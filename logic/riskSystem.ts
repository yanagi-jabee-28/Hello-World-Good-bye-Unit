
import { GameState, SubjectId, TimeSlot, GameEventOption, GameEventEffect, ItemId } from '../types';
import { WORK_CONFIGS } from '../data/work';
import { ITEMS } from '../data/items';
import { CAFFEINE_THRESHOLDS, STUDY_CONSTANTS, SATIETY_CONSUMPTION } from '../config/gameConstants';

// Helper to calculate potential new value
const predictValue = (current: number, change: number, max: number): number => {
  return Math.min(Math.max(current + change, -999), max);
};

// Check if a change results in death
const isFatal = (state: GameState, effect: GameEventEffect): boolean => {
  if (effect.hp !== undefined) {
    if (state.hp + effect.hp <= 0) return true;
  }
  if (effect.sanity !== undefined) {
    if (state.sanity + effect.sanity <= 0) return true;
  }
  return false;
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

  return (state.hp - hpCost <= 0) || (state.sanity - sanityCost <= 0);
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

  return (state.hp - hpCost <= 0) || (state.sanity - sanityCost <= 0);
};

// --- ITEM RISK ---
export const predictItemRisk = (state: GameState, itemId: ItemId): boolean => {
  const item = ITEMS[itemId];
  if (!item || !item.effects) return false;
  return isFatal(state, item.effects);
};

// --- EVENT OPTION RISK ---
export const predictOptionRisk = (state: GameState, option: GameEventOption): boolean => {
  // Check success effect
  if (option.successEffect && isFatal(state, option.successEffect)) {
    return true;
  }
  // Check failure effect
  if (option.failureEffect && isFatal(state, option.failureEffect)) {
    return true;
  }
  return false;
};
