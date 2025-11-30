
import { produce, Draft } from 'immer';
import { GameState, ActionType, GameAction, GameStatus, SubjectId, TimeSlot } from '../types';
import { ACTION_LOGS } from '../data/constants/logMessages';
import { executeEvent, recordEventOccurrence } from './eventManager';
import { pushLog } from './stateHelpers';
import { evaluateExam } from './examEvaluation';
import { applyEffect } from './effectProcessor';
import { INITIAL_STATE, INIT_KNOWLEDGE, INIT_RELATIONSHIPS } from '../config/initialValues';
import { processTurnEnd } from './turnManager';
import { selectWeakestSubject } from './studyAutoSelect';
import { ALL_EVENTS } from '../data/events';
import { STUDY_CONSTANTS } from '../config/gameConstants';
import { joinMessages } from '../utils/logFormatter';

// Handlers (Now expecting Draft<GameState>)
import { handleStudy, handleStudyAll } from './handlers/study';
import { handleRest, handleEscapism } from './handlers/rest';
import { handleWork } from './handlers/work';
import { handleAskProfessor, handleAskSenior, handleRelyFriend } from './handlers/social';
import { handleBuyItem, handleUseItem } from './handlers/items';

export { INITIAL_STATE };

// 動的科目選択を適用するイベントオプションIDのリスト
const DYNAMIC_SUBJECT_OPTIONS = [
  'opt_prof_ask_exam',   // 教授: 試験について聞く
  'opt_senior_past_paper', // 先輩: 過去問入手
  'opt_friend_study'     // 友人: 一緒に勉強
];

export const gameReducer = (state: GameState, action: GameAction): GameState => {
  // Non-draftable actions (Returning new state directly)
  if (action.type === ActionType.LOAD_STATE) {
    const loadedState = action.payload;
    return { 
      ...INITIAL_STATE, 
      ...loadedState,
      uiScale: loadedState.uiScale || INITIAL_STATE.uiScale,
      debugFlags: { ...INITIAL_STATE.debugFlags, ...(loadedState.debugFlags || {}) },
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
  }

  if (action.type === ActionType.FULL_RESET) {
    return { ...INITIAL_STATE };
  }

  if (action.type === ActionType.SOFT_RESET) {
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
  }

  if (action.type === ActionType.HARD_RESTART) {
    return {
      ...INITIAL_STATE,
      uiScale: state.uiScale,
      debugFlags: state.debugFlags,
      logs: [{
        id: Math.random().toString(36).substr(2, 9),
        text: `${ACTION_LOGS.START}\n${ACTION_LOGS.SYSTEM.RESET_HARD}`,
        type: 'system',
        timestamp: 'DAY 1 08:00'
      }],
    };
  }

  if (action.type === ActionType.RESTART) {
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
      }]
    };
  }

  // --- Immer Producer ---
  return produce(state, (draft: Draft<GameState>) => {
    // Global Debug/UI Toggles (No time pass)
    if (action.type === ActionType.TOGGLE_DEBUG_FLAG) {
      draft.debugFlags[action.payload] = !draft.debugFlags[action.payload];
      return;
    }
    if (action.type === ActionType.SET_UI_SCALE) {
      draft.uiScale = action.payload;
      return;
    }

    if (draft.status !== GameStatus.PLAYING) return;

    let timeAdvanced = true;

    // --- Event Resolution ---
    if (action.type === ActionType.RESOLVE_EVENT) {
      const { optionId } = action.payload;
      const event = draft.pendingEvent;
      
      if (event && event.options) {
        const option = event.options.find(o => o.id === optionId);
        if (option) {
          const isSuccess = Math.random() * 100 < option.successRate;
          let chainTargetId: string | null = null;
          
          if (isSuccess) {
            let effect = option.successEffect;
            // Dynamic Subject Selection
            if (effect && effect.knowledge && DYNAMIC_SUBJECT_OPTIONS.includes(option.id)) {
              const targetSubject = selectWeakestSubject(draft.knowledge as Record<SubjectId, number>);
              const amounts = Object.values(effect.knowledge);
              const amount = amounts.length > 0 ? amounts[0] : 10;
              effect = { ...effect, knowledge: { [targetSubject]: amount } };
            }
            
            let details: string[] = [];
            if (effect) {
              details = applyEffect(draft, effect);
            }
            pushLog(draft, `${event.text}\n\n▶ 選択: ${option.label}\n${option.successLog}\n(${details.join(', ')})`, 'success');

            if (option.chainEventId) chainTargetId = option.chainEventId;
            else if (option.chainTrigger) {
               executeEvent(draft, option.chainTrigger, "特に何も起きなかった...");
            }

          } else {
            const effect = option.failureEffect || option.successEffect;
            let details: string[] = [];
            if (effect) {
              details = applyEffect(draft, effect);
            }
            pushLog(draft, `${event.text}\n\n▶ 選択: ${option.label}\n${option.failureLog || "失敗..."}\n(${details.join(', ')})`, 'danger');
            
            if (option.chainEventId) chainTargetId = option.chainEventId;
          }

          // Chain Execution
          if (chainTargetId) {
             const nextEvent = ALL_EVENTS.find(e => e.id === chainTargetId);
             if (nextEvent) {
                recordEventOccurrence(draft, nextEvent.id);
                if (nextEvent.options) {
                   draft.pendingEvent = nextEvent; // Next event is interactive
                   return; // Early return to keep pendingEvent
                } else {
                   const chainedDetails = applyEffect(draft, nextEvent.effect || {});
                   const detailsStr = joinMessages(chainedDetails, ', ');
                   pushLog(draft, detailsStr ? `${nextEvent.text}\n(${detailsStr})` : nextEvent.text, nextEvent.type === 'good' ? 'success' : 'info');
                }
             }
          }
        }
      }
      draft.pendingEvent = null;
      timeAdvanced = false;
    } 
    // Block regular actions if pending event
    else if (draft.pendingEvent) {
      return;
    } 
    // --- Regular Actions ---
    else {
      switch (action.type) {
        case ActionType.STUDY:
          handleStudy(draft, action.payload);
          if (draft.sanity < 30) draft.flags.madnessStack = Math.min(4, draft.flags.madnessStack + 1);
          break;
        case ActionType.STUDY_ALL:
          if (draft.timeSlot === TimeSlot.AM || draft.timeSlot === TimeSlot.AFTERNOON) {
             handleStudyAll(draft);
             timeAdvanced = false;
          } else {
             handleStudyAll(draft);
             if (draft.sanity < STUDY_CONSTANTS.MADNESS_THRESHOLD) draft.flags.madnessStack = Math.min(4, draft.flags.madnessStack + 1);
          }
          break;
        case ActionType.REST:
          handleRest(draft);
          break;
        case ActionType.WORK:
          handleWork(draft);
          break;
        case ActionType.ESCAPISM:
          handleEscapism(draft);
          break;
        case ActionType.ASK_PROFESSOR:
          handleAskProfessor(draft);
          draft.lastSocialTurn = draft.turnCount; 
          break;
        case ActionType.ASK_SENIOR:
          handleAskSenior(draft);
          draft.lastSocialTurn = draft.turnCount; 
          break;
        case ActionType.RELY_FRIEND:
          handleRelyFriend(draft);
          draft.lastSocialTurn = draft.turnCount; 
          break;
        case ActionType.BUY_ITEM:
          handleBuyItem(draft, action.payload);
          timeAdvanced = false;
          break;
        case ActionType.USE_ITEM:
          handleUseItem(draft, action.payload);
          timeAdvanced = false;
          break;
      }
    }

    // --- Turn Processing & Game Over Checks ---
    if (timeAdvanced) {
      const isResting = action.type === ActionType.REST || action.type === ActionType.ESCAPISM;
      processTurnEnd(draft, isResting);
    }

    if (draft.day > 7) {
      const metrics = evaluateExam(draft as GameState); // Cast to GameState for read-only helper
      draft.status = metrics.passed ? GameStatus.VICTORY : GameStatus.FAILURE;
      draft.pendingEvent = null; 
      if (draft.status === GameStatus.VICTORY) pushLog(draft, ACTION_LOGS.SYSTEM.VICTORY, 'success');
      else pushLog(draft, ACTION_LOGS.SYSTEM.FAILURE, 'danger');
    } else if (draft.hp <= 0) {
      draft.status = GameStatus.GAME_OVER_HP;
      draft.pendingEvent = null;
      pushLog(draft, ACTION_LOGS.SYSTEM.GAME_OVER_HP, 'danger');
    } else if (draft.sanity <= 0) {
      draft.status = GameStatus.GAME_OVER_SANITY;
      draft.pendingEvent = null;
      pushLog(draft, ACTION_LOGS.SYSTEM.GAME_OVER_MADNESS, 'danger');
    }
  });
};
