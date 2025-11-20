
import { GameState, LogEntry } from '../types';

export const pushLog = (state: GameState, text: string, type: LogEntry['type'] = 'info') => {
  state.logs.push({
    id: Math.random().toString(36).substr(2, 9),
    text,
    type,
    timestamp: `DAY ${state.day} ${state.timeSlot}`
  });
};
