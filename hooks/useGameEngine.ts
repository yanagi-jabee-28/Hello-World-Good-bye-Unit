
import { useReducer } from 'react';
import { gameReducer, INITIAL_STATE } from '../logic/reducer';

export const useGameEngine = () => {
  const [state, dispatch] = useReducer(gameReducer, INITIAL_STATE);
  return { state, dispatch };
};
