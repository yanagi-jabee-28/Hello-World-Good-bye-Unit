
import { GameState, ActionType, GameAction, GameStatus, SubjectId } from '../types';
import { clamp, chance } from '../utils/common';
import { ACTION_LOGS } from '../data/constants/logMessages';
import { executeEvent } from './eventManager';
import { pushLog } from './stateHelpers';
import { evaluateExam } from './examEvaluation';
import { applyEffect } from './effectProcessor';
import { INITIAL_STATE, INIT_KNOWLEDGE, INIT_RELATIONSHIPS } from '../config/initialValues';
import { processTurnEnd } from './turnManager';
import { selectWeakestSubject } from './studyAutoSelect';

// Handlers
import { handleStudy } from './handlers/study';
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
  // セーブデータのロード
  if (action.type === ActionType.LOAD_STATE) {
    const loadedState = action.payload;
    return { 
      ...INITIAL_STATE, 
      ...loadedState,
      // Ensure uiScale exists even for old saves
      uiScale: loadedState.uiScale || INITIAL_STATE.uiScale,
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

  // UI設定の変更 (このアクションはターンを経過させない)
  if (action.type === ActionType.SET_UI_SCALE) {
    return {
      ...state,
      uiScale: action.payload
    };
  }

  // 完全リセット（Factory Reset）
  if (action.type === ActionType.FULL_RESET) {
    return { ...INITIAL_STATE };
  }

  // 強くてニューゲーム（手動ソフトリセット）
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
      uiScale: state.uiScale, // Keep UI setting
      logs: [{
        id: Math.random().toString(36).substr(2, 9),
        text: resetLogText,
        type: 'system',
        timestamp: 'DAY 1 08:00'
      }],
    };
  }

  // ニューゲーム（手動ハードリスタート）
  if (action.type === ActionType.HARD_RESTART) {
    return {
      ...INITIAL_STATE,
      uiScale: state.uiScale, // Keep UI setting
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
      uiScale: state.uiScale, // Keep UI setting
      logs: [{
        id: Math.random().toString(36).substr(2, 9),
        text: restartLogText,
        type: 'system',
        timestamp: 'DAY 1 08:00'
      }]
    };
  }

  if (state.status !== GameStatus.PLAYING) {
    return state;
  }

  let newState = { ...state };
  newState.knowledge = { ...state.knowledge };
  newState.relationships = { ...state.relationships };
  newState.inventory = { ...state.inventory };
  newState.eventStats = { ...state.eventStats };
  newState.activeBuffs = [...state.activeBuffs];
  newState.logs = [...state.logs];
  newState.flags = { ...state.flags };
  
  // 分岐イベント選択の処理
  if (action.type === ActionType.RESOLVE_EVENT) {
    const { optionId } = action.payload;
    const event = newState.pendingEvent;
    
    if (event && event.options) {
      const option = event.options.find(o => o.id === optionId);
      if (option) {
        const isSuccess = Math.random() * 100 < option.successRate;
        
        if (isSuccess) {
          let effect = option.successEffect;
          
          // --- 動的科目選択ロジック ---
          // 指定されたイベントの場合、上昇する科目を「現在最も苦手な科目」に書き換える
          if (effect && effect.knowledge && DYNAMIC_SUBJECT_OPTIONS.includes(option.id)) {
            const targetSubject = selectWeakestSubject(newState.knowledge);
            // 元の定義から上昇量を取得 (どれか1つの値が入っている前提)
            const amounts = Object.values(effect.knowledge);
            const amount = amounts.length > 0 ? amounts[0] : 10;
            
            // 効果を上書き (新しいオブジェクトを作成)
            effect = {
              ...effect,
              knowledge: { [targetSubject]: amount }
            };
          }
          // --------------------------

          let details: string[] = [];
          if (effect) {
            const res = applyEffect(newState, effect);
            newState = res.newState;
            details = res.messages;
          }
          pushLog(newState, `${event.text}\n\n▶ 選択: ${option.label}\n${option.successLog}\n(${details.join(', ')})`, 'success');

          if (option.chainTrigger) {
             newState = executeEvent(newState, option.chainTrigger, "特に何も起きなかった...");
          }

        } else {
          const effect = option.failureEffect || option.successEffect;
          let details: string[] = [];
          if (effect) {
            const res = applyEffect(newState, effect);
            newState = res.newState;
            details = res.messages;
          }
          pushLog(newState, `${event.text}\n\n▶ 選択: ${option.label}\n${option.failureLog || "失敗..."}\n(${details.join(', ')})`, 'danger');
        }
      }
    }

    newState.pendingEvent = null;
    return newState;
  }

  if (newState.pendingEvent) {
    return state;
  }

  let timeAdvanced = true;

  switch (action.type) {
    case ActionType.STUDY:
      newState = handleStudy(newState, action.payload);
      if (newState.sanity < 30) {
        newState.flags.madnessStack = Math.min(4, newState.flags.madnessStack + 1);
      }
      break;
    case ActionType.REST:
      newState = handleRest(newState);
      break;
    case ActionType.WORK:
      newState = handleWork(newState);
      break;
    case ActionType.ESCAPISM:
      newState = handleEscapism(newState);
      break;
    case ActionType.ASK_PROFESSOR:
      newState = handleAskProfessor(newState);
      newState.lastSocialTurn = newState.turnCount; 
      break;
    case ActionType.ASK_SENIOR:
      newState = handleAskSenior(newState);
      newState.lastSocialTurn = newState.turnCount; 
      break;
    case ActionType.RELY_FRIEND:
      newState = handleRelyFriend(newState);
      newState.lastSocialTurn = newState.turnCount; 
      break;
    case ActionType.BUY_ITEM:
      newState = handleBuyItem(newState, action.payload);
      timeAdvanced = false;
      break;
    case ActionType.USE_ITEM:
      newState = handleUseItem(newState, action.payload);
      timeAdvanced = false;
      break;
  }

  // 時間経過処理の委譲
  if (timeAdvanced) {
    const isResting = action.type === ActionType.REST || action.type === ActionType.ESCAPISM;
    newState = processTurnEnd(newState, isResting);
  }

  // ゲーム終了判定
  if (newState.day > 7) {
    const metrics = evaluateExam(newState);
    newState.status = metrics.passed ? GameStatus.VICTORY : GameStatus.FAILURE;
    newState.pendingEvent = null; // Clear any pending events on finish
    if (newState.status === GameStatus.VICTORY) pushLog(newState, ACTION_LOGS.SYSTEM.VICTORY, 'success');
    else pushLog(newState, ACTION_LOGS.SYSTEM.FAILURE, 'danger');
  } else if (newState.hp <= 0) {
    newState.status = GameStatus.GAME_OVER_HP;
    newState.pendingEvent = null; // Clear any pending events on game over
    pushLog(newState, ACTION_LOGS.SYSTEM.GAME_OVER_HP, 'danger');
  } else if (newState.sanity <= 0) {
    newState.status = GameStatus.GAME_OVER_SANITY;
    newState.pendingEvent = null; // Clear any pending events on game over
    pushLog(newState, ACTION_LOGS.SYSTEM.GAME_OVER_MADNESS, 'danger');
  }

  return newState;
};
