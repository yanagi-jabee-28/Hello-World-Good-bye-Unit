
import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { persist, createJSONStorage } from 'zustand/middleware';
import { GameState, SubjectId, ItemId, GameStatus, UiScale, DebugFlags, TimeSlot } from '../types';
import { INITIAL_STATE, INIT_KNOWLEDGE, INIT_RELATIONSHIPS } from '../config/initialValues';
import { ACTION_LOGS } from '../data/constants/logMessages';
import { pushLog } from './stateHelpers';
import { evaluateExam } from './examEvaluation';
import { processTurnEnd } from './turnManager';
import { STUDY_CONSTANTS } from '../config/gameConstants';

// Handlers
import { handleStudy, handleStudyAll } from './handlers/study';
import { handleRest, handleEscapism } from './handlers/rest';
import { handleWork } from './handlers/work';
import { handleAskProfessor, handleAskSenior, handleRelyFriend } from './handlers/social';
import { handleBuyItem, handleUseItem } from './handlers/items';
import { resolveEvent } from './handlers/eventResolver';

interface GameActions {
  // Core Actions
  study: (subjectId: SubjectId) => void;
  studyAll: () => void;
  rest: () => void;
  work: () => void;
  escapism: () => void;
  
  // Social Actions
  askProfessor: () => void;
  askSenior: () => void;
  relyFriend: () => void;
  
  // Item Actions
  buyItem: (itemId: ItemId) => void;
  useItem: (itemId: ItemId) => void;
  
  // Event & System
  resolveEvent: (optionId: string) => void;
  loadState: (state: GameState) => void;
  restart: () => void; // Added
  fullReset: () => void;
  softReset: () => void;
  hardRestart: () => void;
  setUiScale: (scale: UiScale) => void;
  toggleDebugFlag: (flag: keyof DebugFlags) => void;
}

type GameStore = GameState & { actions: GameActions };

export const useGameStore = create<GameStore>()(
  persist(
    immer((set, get) => ({
      ...INITIAL_STATE,

      actions: {
        study: (subjectId) => set((state) => {
          if (state.pendingEvent || state.status !== GameStatus.PLAYING) return;
          handleStudy(state, subjectId);
          if (state.sanity < 30) state.flags.madnessStack = Math.min(4, state.flags.madnessStack + 1);
          processTurnEnd(state, false);
          checkGameOver(state);
        }),

        studyAll: () => set((state) => {
          if (state.pendingEvent || state.status !== GameStatus.PLAYING) return;
          
          if (state.timeSlot === TimeSlot.AM || state.timeSlot === TimeSlot.AFTERNOON) {
             handleStudyAll(state);
             // No turn end for class time error in handleStudyAll logic
          } else {
             handleStudyAll(state);
             if (state.sanity < STUDY_CONSTANTS.MADNESS_THRESHOLD) state.flags.madnessStack = Math.min(4, state.flags.madnessStack + 1);
             processTurnEnd(state, false);
             checkGameOver(state);
          }
        }),

        rest: () => set((state) => {
          if (state.pendingEvent || state.status !== GameStatus.PLAYING) return;
          handleRest(state);
          processTurnEnd(state, true);
          checkGameOver(state);
        }),

        work: () => set((state) => {
          if (state.pendingEvent || state.status !== GameStatus.PLAYING) return;
          handleWork(state);
          // handleWork might trigger an event. If so, don't advance turn yet (logic handles this via pendingEvent check in UI)
          if (!state.pendingEvent) {
            processTurnEnd(state, false);
            checkGameOver(state);
          }
        }),

        escapism: () => set((state) => {
          if (state.pendingEvent || state.status !== GameStatus.PLAYING) return;
          handleEscapism(state);
          processTurnEnd(state, true); // Treating escapism as "rest" for sleep debt purposes? Logic says REST/ESCAPISM passes isResting=true
          checkGameOver(state);
        }),

        askProfessor: () => set((state) => {
          if (state.pendingEvent || state.status !== GameStatus.PLAYING) return;
          handleAskProfessor(state);
          state.lastSocialTurn = state.turnCount;
          if (!state.pendingEvent) {
            processTurnEnd(state, false);
            checkGameOver(state);
          }
        }),

        askSenior: () => set((state) => {
          if (state.pendingEvent || state.status !== GameStatus.PLAYING) return;
          handleAskSenior(state);
          state.lastSocialTurn = state.turnCount;
          if (!state.pendingEvent) {
            processTurnEnd(state, false);
            checkGameOver(state);
          }
        }),

        relyFriend: () => set((state) => {
          if (state.pendingEvent || state.status !== GameStatus.PLAYING) return;
          handleRelyFriend(state);
          state.lastSocialTurn = state.turnCount;
          if (!state.pendingEvent) {
            processTurnEnd(state, false);
            checkGameOver(state);
          }
        }),

        buyItem: (itemId) => set((state) => {
          if (state.status !== GameStatus.PLAYING) return;
          handleBuyItem(state, itemId);
          // Buying doesn't advance time
        }),

        useItem: (itemId) => set((state) => {
          if (state.status !== GameStatus.PLAYING) return;
          handleUseItem(state, itemId);
          // Item use doesn't advance time
          checkGameOver(state);
        }),

        resolveEvent: (optionId) => set((state) => {
          resolveEvent(state, optionId);
          // If event resolution didn't chain into another interactive event, advance time
          if (!state.pendingEvent) {
             processTurnEnd(state, false);
             checkGameOver(state);
          }
        }),

        loadState: (loadedState) => set((state) => {
          // Keep existing uiScale and debugFlags if not present in loaded state
          return {
            ...INITIAL_STATE,
            ...loadedState,
            uiScale: loadedState.uiScale || state.uiScale,
            debugFlags: { ...state.debugFlags, ...(loadedState.debugFlags || {}) },
            logs: [
              ...loadedState.logs,
              {
                id: Math.random().toString(36).substr(2, 9),
                text: ACTION_LOGS.SYSTEM.LOADED,
                type: 'system',
                timestamp: `DAY ${loadedState.day} ${loadedState.timeSlot}`
              }
            ]
          };
        }),

        restart: () => set((state) => {
          const inheritedKnowledge = { ...INIT_KNOWLEDGE };
          let inherited = false;
          (Object.keys(state.knowledge) as SubjectId[]).forEach((id) => {
            if (state.knowledge[id] > 0) {
              inheritedKnowledge[id] = Math.floor(state.knowledge[id] / 2);
              inherited = true;
            }
          });
          const restartLogText = inherited 
            ? `${ACTION_LOGS.START}\n${ACTION_LOGS.SYSTEM.RESTART_MSG}`
            : ACTION_LOGS.START;

          return {
            ...INITIAL_STATE,
            knowledge: inheritedKnowledge,
            relationships: { ...INIT_RELATIONSHIPS },
            inventory: { ...INITIAL_STATE.inventory },
            uiScale: state.uiScale,
            debugFlags: state.debugFlags,
            logs: [{
              id: Math.random().toString(36).substr(2, 9),
              text: restartLogText,
              type: 'system',
              timestamp: 'DAY 1 08:00'
            }],
          };
        }),

        fullReset: () => set(() => ({ ...INITIAL_STATE })),

        softReset: () => set((state) => {
          const inheritedKnowledge = { ...INIT_KNOWLEDGE };
          let inherited = false;
          (Object.keys(state.knowledge) as SubjectId[]).forEach((id) => {
            if (state.knowledge[id] > 0) {
              inheritedKnowledge[id] = Math.floor(state.knowledge[id] / 2);
              inherited = true;
            }
          });
          const resetLogText = inherited 
            ? `${ACTION_LOGS.START}\n${ACTION_LOGS.SYSTEM.RESET_INHERIT}`
            : ACTION_LOGS.START;

          return {
            ...INITIAL_STATE,
            knowledge: inheritedKnowledge,
            relationships: { ...INIT_RELATIONSHIPS },
            inventory: { ...INITIAL_STATE.inventory },
            uiScale: state.uiScale,
            debugFlags: state.debugFlags,
            logs: [{
              id: Math.random().toString(36).substr(2, 9),
              text: resetLogText,
              type: 'system',
              timestamp: 'DAY 1 08:00'
            }],
          };
        }),

        hardRestart: () => set((state) => ({
          ...INITIAL_STATE,
          uiScale: state.uiScale,
          debugFlags: state.debugFlags,
          logs: [{
            id: Math.random().toString(36).substr(2, 9),
            text: `${ACTION_LOGS.START}\n${ACTION_LOGS.SYSTEM.RESET_HARD}`,
            type: 'system',
            timestamp: 'DAY 1 08:00'
          }],
        })),

        setUiScale: (scale) => set((state) => { state.uiScale = scale; }),
        
        toggleDebugFlag: (flag) => set((state) => { 
          if (flag === 'riskPredictionMode') {
             state.debugFlags.riskPredictionMode = state.debugFlags.riskPredictionMode === 'direct' ? 'predictive' : 'direct';
          } else {
             // @ts-ignore - Boolean toggling safe here due to strict key checking above
             state.debugFlags[flag] = !state.debugFlags[flag]; 
          }
        }),
      }
    })),
    {
      name: 'rsa_adventure_store',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => {
        // Exclude actions from persistence
        const { actions, ...rest } = state;
        return rest;
      }
    }
  )
);

// Helper to check game over conditions
const checkGameOver = (state: GameState) => {
  if (state.day > 7) {
    const metrics = evaluateExam(state);
    state.status = metrics.passed ? GameStatus.VICTORY : GameStatus.FAILURE;
    state.pendingEvent = null;
    if (state.status === GameStatus.VICTORY) pushLog(state, ACTION_LOGS.SYSTEM.VICTORY, 'success');
    else pushLog(state, ACTION_LOGS.SYSTEM.FAILURE, 'danger');
  } else if (state.hp <= 0) {
    state.status = GameStatus.GAME_OVER_HP;
    state.pendingEvent = null;
    pushLog(state, ACTION_LOGS.SYSTEM.GAME_OVER_HP, 'danger');
  } else if (state.sanity <= 0) {
    state.status = GameStatus.GAME_OVER_SANITY;
    state.pendingEvent = null;
    pushLog(state, ACTION_LOGS.SYSTEM.GAME_OVER_MADNESS, 'danger');
  }
};
