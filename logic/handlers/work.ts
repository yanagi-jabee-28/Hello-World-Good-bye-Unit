
import { GameState } from '../../types';
import { clamp, formatDelta, joinMessages } from '../../utils/common';
import { pushLog } from '../stateHelpers';
import { getWorkConfig } from '../../data/work';

export const handleWork = (state: GameState): GameState => {
  const config = getWorkConfig(state.timeSlot);
  
  // State Update
  state.money += config.salary;
  state.hp = clamp(state.hp - config.hpCost, 0, state.maxHp);
  state.sanity = clamp(state.sanity - config.sanityCost, 0, state.maxSanity);
  
  const details = joinMessages([
    `資金+¥${config.salary.toLocaleString()}`,
    formatDelta('HP', -config.hpCost),
    formatDelta('SAN', -config.sanityCost)
  ], ', ');

  pushLog(state, `${config.logText}\n(${details})`, config.logType);
  return state;
};
