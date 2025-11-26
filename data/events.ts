
import { GameEvent } from '../types';
import { PROFESSOR_EVENTS } from './events/professor';
import { SENIOR_EVENTS } from './events/senior';
import { FRIEND_EVENTS } from './events/friend';
import { TURN_END_EVENTS } from './events/turnEnd';
import { BRANCHING_EVENTS } from './events/branching';
import { WORK_EVENTS } from './events/work';

/**
 * ALL_EVENTS Aggregation
 * 各モジュールからイベントを集約して公開
 */
export const ALL_EVENTS: GameEvent[] = [
  ...PROFESSOR_EVENTS,
  ...SENIOR_EVENTS,
  ...FRIEND_EVENTS,
  ...TURN_END_EVENTS,
  ...BRANCHING_EVENTS,
  ...WORK_EVENTS
];