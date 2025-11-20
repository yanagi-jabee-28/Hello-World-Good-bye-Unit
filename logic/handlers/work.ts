
import { GameState } from '../../types';
import { clamp, formatDelta, joinMessages } from '../../utils/common';
import { pushLog } from '../stateHelpers';

export const handleWork = (state: GameState): GameState => {
  const moneyEarned = 5000; // Increased from 3500
  const hpCost = 25;
  const sanityCost = 15;
  
  state.money += moneyEarned;
  state.hp = clamp(state.hp - hpCost, 0, state.maxHp);
  state.sanity = clamp(state.sanity - sanityCost, 0, state.maxSanity);
  
  const details = joinMessages([
    `資金+¥${moneyEarned}`,
    formatDelta('HP', -hpCost),
    formatDelta('SAN', -sanityCost)
  ], ', ');

  pushLog(state, `【労働】ブラックバイトで魂を切り売りした。疲労困憊だが、金は手に入った。\n(${details})`, 'info');
  return state;
};
