
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
  let hint = "";
  switch (timeSlot) {
    case TimeSlot.MORNING: hint = "効率: 最高 (登校前の冴え)"; break;
    case TimeSlot.AM: hint = "効率: 普通 (午前の講義)"; break;
    case TimeSlot.NOON: hint = caffeine > 50 ? "効率: 維持 (カフェイン覚醒)" : "効率: 低 (昼休み)"; break;
    case TimeSlot.AFTERNOON: hint = "効率: やや低 (午後の睡魔)"; break;
    case TimeSlot.AFTER_SCHOOL: hint = "効率: 高 (放課後の集中)"; break;
    case TimeSlot.NIGHT: hint = "効率: やや低 (疲労)"; break;
    case TimeSlot.LATE_NIGHT: hint = "効率: ギャンブル (深夜のゾーン判定)"; break;
    default: hint = "効率: 普通";
  }

  if (caffeine >= 150) return "警告: 中毒 (効率UP / 激しい消耗)";
  if (caffeine >= 100) return "効率: ブースト (ゾーン状態)";
  
  return hint;
};

/**
 * Returns a localized hint string for resting.
 */
export const getRestHint = (timeSlot: TimeSlot, caffeine: number): string => {
  if (caffeine > 120) return "警告: 精神汚染 (睡眠障害)";
  if (timeSlot === TimeSlot.LATE_NIGHT) return "熟睡 (大回復)";
  if (timeSlot === TimeSlot.MORNING) return "二度寝 (中回復)";
  return "仮眠/休憩 (小回復)";
};
