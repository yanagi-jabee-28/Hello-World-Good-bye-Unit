
import { useReducer, useEffect } from 'react';
import { gameReducer, INITIAL_STATE } from '../logic/reducer';
import { saveGame, loadGame } from '../logic/storage';

export const useGameEngine = () => {
  // Initialize state from storage if available, otherwise use INITIAL_STATE
  // useReducerの第3引数(init)を使用して遅延初期化を行う
  const [state, dispatch] = useReducer(gameReducer, INITIAL_STATE, (defaultState) => {
    if (typeof window === 'undefined') return defaultState; // SSR対策(念のため)
    
    const saved = loadGame();
    if (saved) {
      // バージョンアップなどでフィールドが増えた場合に備え、デフォルト値にセーブデータをマージする
      // 特にネストされたオブジェクト(debugFlags等)は浅いコピーだと消える可能性があるため丁寧にマージする
      return { 
        ...defaultState, 
        ...saved,
        debugFlags: { 
          ...defaultState.debugFlags, 
          ...(saved.debugFlags || {}) 
        },
        uiScale: saved.uiScale || defaultState.uiScale
      };
    }
    return defaultState;
  });

  // Auto-save whenever state changes
  useEffect(() => {
    saveGame(state);
  }, [state]);

  return { state, dispatch };
};
