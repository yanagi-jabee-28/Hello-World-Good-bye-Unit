
import { TimeSlot } from '../types';

const TIME_SLOT_ORDER = [
  TimeSlot.MORNING,
  TimeSlot.AM,
  TimeSlot.NOON,
  TimeSlot.AFTERNOON,
  TimeSlot.AFTER_SCHOOL,
  TimeSlot.NIGHT,
  TimeSlot.LATE_NIGHT
];

export const getNextTimeSlot = (current: TimeSlot): { slot: TimeSlot; isNextDay: boolean } => {
  const idx = TIME_SLOT_ORDER.indexOf(current);
  if (idx === -1 || idx === TIME_SLOT_ORDER.length - 1) {
    return { slot: TimeSlot.MORNING, isNextDay: true };
  }
  return { slot: TIME_SLOT_ORDER[idx + 1], isNextDay: false };
};
