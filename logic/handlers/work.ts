
import { GameState } from '../../types';
import { clamp, formatDelta, joinMessages } from '../../utils/common';
import { pushLog } from '../stateHelpers';

export const handleWork = (state: GameState): GameState => {
  // 報酬を減らし、コストを上げることで「安易な金策」を封じる
  const moneyEarned = 4000; 
  const hpCost = 30; // かなり疲れる
  const sanityCost = 20;
  
  state.money += moneyEarned;
  state.hp = clamp(state.hp - hpCost, 0, state.maxHp);
  state.sanity = clamp(state.sanity - sanityCost, 0, state.maxSanity);
  
  const details = joinMessages([
    `資金+¥${moneyEarned}`,
    formatDelta('HP', -hpCost),
    formatDelta('SAN', -sanityCost)
  ], ', ');

  pushLog(state, `【労働】過酷なシフトをこなした。得た金以上に、魂の一部を失った気がする。\n(${details})`, 'info');
  return state;
};
