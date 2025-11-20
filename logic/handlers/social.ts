
import { GameState, RelationshipId, SubjectId } from '../../types';
import { clamp } from '../../utils/common';
import { executeEvent } from '../eventManager';

export const handleAskProfessor = (state: GameState): GameState => {
  let newState = executeEvent(state, 'action_professor', "教授室は留守のようだ。");
  
  // Bonus if relationship improved
  if (newState.relationships[RelationshipId.PROFESSOR] > state.relationships[RelationshipId.PROFESSOR]) {
      const subIds = Object.values(SubjectId);
      const target = subIds[Math.floor(Math.random() * subIds.length)];
      newState.knowledge[target] = clamp(newState.knowledge[target] + 5, 0, 100);
  }
  return newState;
};

export const handleAskSenior = (state: GameState): GameState => {
  return executeEvent(state, 'action_senior', "先輩は見当たらなかった。");
};

export const handleRelyFriend = (state: GameState): GameState => {
  return executeEvent(state, 'action_friend', "友人は忙しいようだ。");
};
