import { TimeSlot } from '../types';

/**
 * Returns availability status for NPCs based on current time slot.
 */
export const getAvailability = (timeSlot: TimeSlot) => {
  return {
    // Professor: AM/PM(Lecture), Noon(Lunch), AfterSchool(Office Hour). Not Morning, Night.
    professor: [TimeSlot.AM, TimeSlot.NOON, TimeSlot.AFTERNOON, TimeSlot.AFTER_SCHOOL].includes(timeSlot),
    
    // Senior: Noon onwards (They wake up late and stay late)
    senior: [TimeSlot.NOON, TimeSlot.AFTERNOON, TimeSlot.AFTER_SCHOOL, TimeSlot.NIGHT, TimeSlot.LATE_NIGHT].includes(timeSlot),
    
    // Friend: Not Late Night
    friend: timeSlot !== TimeSlot.LATE_NIGHT,
  };
};

/**
 * Returns a localized hint string for studying efficiency.
 */
export const getStudyHint = (timeSlot: TimeSlot, caffeine: number): string => {
  switch (timeSlot) {
    case TimeSlot.MORNING: return "効率: 最高 (登校前の冴え)";
    case TimeSlot.AM: return "効率: 普通 (午前の講義)";
    case TimeSlot.NOON: return caffeine > 50 ? "効率: 維持 (カフェイン覚醒)" : "効率: 低 (昼休み/騒音)";
    case TimeSlot.AFTERNOON: return "効率: やや低 (午後の眠気)";
    case TimeSlot.AFTER_SCHOOL: return "効率: 高 (放課後の集中)";
    case TimeSlot.NIGHT: return "効率: やや低 (疲労)";
    case TimeSlot.LATE_NIGHT: return "効率: ギャンブル (ゾーン判定)";
    default: return "効率: 普通";
  }
};

/**
 * Returns a localized hint string for resting.
 */
export const getRestHint = (timeSlot: TimeSlot, caffeine: number): string => {
  if (caffeine > 80) return "警告: 精神汚染 (SAN減少/不眠)";
  if (timeSlot === TimeSlot.LATE_NIGHT) return "熟睡 (大回復)";
  if (timeSlot === TimeSlot.MORNING) return "二度寝 (中回復)";
  return "仮眠/休憩 (小回復)";
};