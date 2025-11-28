
import { TimeSlot } from '../types';
import { CAFFEINE_THRESHOLDS } from '../config/gameConstants';

/**
 * Returns availability status for NPCs based on current time slot.
 */
export const getAvailability = (timeSlot: TimeSlot) => {
  return {
    // Professor: Morning(Early), AM/PM(Lecture), Noon(Lunch), AfterSchool(Office Hour). Not Night, Late Night.
    professor: [TimeSlot.MORNING, TimeSlot.AM, TimeSlot.NOON, TimeSlot.AFTERNOON, TimeSlot.AFTER_SCHOOL].includes(timeSlot),
    
    // Senior: Noon onwards (They wake up late and stay late)
    senior: [TimeSlot.NOON, TimeSlot.AFTERNOON, TimeSlot.AFTER_SCHOOL, TimeSlot.NIGHT, TimeSlot.LATE_NIGHT].includes(timeSlot),
    
    // Friend: Always available (Even late night gaming)
    friend: true,
  };
};

/**
 * Returns a localized hint string for studying efficiency.
 */
export const getStudyHint = (timeSlot: TimeSlot, caffeine: number): string => {
  let hint = "";
  switch (timeSlot) {
    case TimeSlot.MORNING: hint = "効率: 高 (登校前の冴え)"; break;
    case TimeSlot.AM: hint = "効率: 普通 (講義)"; break;
    case TimeSlot.NOON: hint = "効率: やや低 (昼休み)"; break;
    case TimeSlot.AFTERNOON: hint = "効率: 普通 (演習)"; break;
    case TimeSlot.AFTER_SCHOOL: hint = "効率: 高 (放課後の集中)"; break;
    case TimeSlot.NIGHT: hint = "効率: やや低 (疲労)"; break;
    case TimeSlot.LATE_NIGHT: hint = "効率: 最高 (深夜の静寂・高コスト)"; break;
    default: hint = "効率: 普通";
  }

  if (caffeine >= CAFFEINE_THRESHOLDS.TOXICITY) return "警告: 中毒 (限界突破 / HP・SAN激減)";
  if (caffeine >= CAFFEINE_THRESHOLDS.ZONE) return "効率: ZONE (集中モード / 微ダメージ)";
  if (caffeine >= CAFFEINE_THRESHOLDS.AWAKE) return "効率: 覚醒 (ブースト)";
  
  return hint;
};

/**
 * Returns a localized hint string for resting.
 */
export const getRestHint = (timeSlot: TimeSlot, caffeine: number): string => {
  if (caffeine >= CAFFEINE_THRESHOLDS.TOXICITY) return "警告: 精神汚染 (睡眠障害)";
  if (timeSlot === TimeSlot.LATE_NIGHT) return "熟睡 (大回復)";
  if (timeSlot === TimeSlot.MORNING) return "二度寝 (中回復)";
  return "仮眠/休憩 (小回復)";
};
