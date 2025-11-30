
import { GameState, ActionType, GameAction, GameStatus, SubjectId, DebugFlags, TimeSlot } from '../types';
import { clamp, chance } from '../utils/common';
import { ACTION_LOGS } from '../data/constants/logMessages';
import { executeEvent, recordEventOccurrence } from './eventManager';
import { pushLog } from './stateHelpers';
import { evaluateExam } from './examEvaluation';
import { applyEffect } from './effectProcessor';
import { INITIAL_STATE, INIT_KNOWLEDGE, INIT_RELATIONSHIPS } from '../config/initialValues';
import { processTurnEnd } from './turnManager';
import { selectWeakestSubject } from './studyAutoSelect';
import { ALL_EVENTS } from '../data/events'; // Import ALL_EVENTS for direct chain lookup
import { SUBJECTS } from '../data/subjects';
import { rng } from '../utils/rng';

// Handlers
import { handleStudy } from './handlers/study';
import { handleRest, handleEscapism } from './handlers/rest';
import { handleWork } from './handlers/work';
import { handleAskProfessor, handleAskSenior, handleRelyFriend } from './handlers/social';
import { handleBuyItem, handleUseItem } from './handlers/items';
import { SATIETY_CONSUMPTION, STUDY_ALL } from '../config/gameConstants';
import { joinMessages } from '../utils/logFormatter';

export { INITIAL_STATE };

// 動的科目選択を適用するイベントオプションIDのリスト
const DYNAMIC_SUBJECT_OPTIONS = [
  'opt_prof_ask_exam',   // 教授: 試験について聞く
  'opt_senior_past_paper', // 先輩: 過去問入手
  'opt_friend_study'     // 友人: 一緒に勉強
];

const handleStudyAll = (state: GameState): GameState => {
  // --- 総合学習ハンドラ (v2.6: 科目別難易度反映 & 時間帯制限) ---
  
  // 1. 時間帯チェック: 授業中(AM, AFTERNOON)は不可
  // UI側でも無効化するが、ロジックとしても保護する
  if (state.timeSlot === TimeSlot.AM || state.timeSlot === TimeSlot.AFTERNOON) {
    const warningState = { ...state, logs: [...state.logs] };
    pushLog(warningState, "【エラー】授業中に全科目の復習はできない。教授の目が光っている。", 'warning');
    return warningState;
  }

  // 2. 深夜補正
  const isLateNight = state.timeSlot === TimeSlot.LATE_NIGHT;
  const timeMult = isLateNight ? STUDY_ALL.LATE_NIGHT_EFFICIENCY : 1.0;
  const costMult = isLateNight ? STUDY_ALL.LATE_NIGHT_COST_MULT : 1.0;

  // 3. 平均スコアによる減衰
  const subjects = Object.values(SubjectId);
  const totalScore = subjects.reduce((sum, id) => sum + state.knowledge[id], 0);
  const avg = totalScore / subjects.length;
  const decayMult = STUDY_ALL.gainMultiplier(avg);

  // 4. 科目ごとの上昇値計算
  // 式: floor( (Base * Decay * Time * (1/Difficulty)) + Random(-1, 1) )
  // 難易度が高い(Difficultyが小さい)科目ほど上昇しやすい... ではなく、Difficultyは係数。
  // SUBJECTS定義: difficulty 0.7(難) 〜 1.4(易)
  // なので、Difficultyをそのまま掛けると「易しい科目は伸びる」「難しい科目は伸びない」となる。
  const knowledgeGain: Partial<Record<SubjectId, number>> = {};
  
  subjects.forEach(sid => {
    const difficulty = SUBJECTS[sid].difficulty;
    const rand = rng.range(-1, 1); // -1, 0, +1 のゆらぎ
    
    // 基礎計算
    let val = (STUDY_ALL.BASE_GAIN * decayMult * timeMult * difficulty) + rand;
    
    // 最低保証と整数化
    val = Math.max(Math.floor(val), STUDY_ALL.MIN_GAIN);
    knowledgeGain[sid] = val;
  });

  // 5. コスト計算
  const effect = {
    hp: Math.floor(-STUDY_ALL.COST_HP * costMult),
    sanity: Math.floor(-STUDY_ALL.COST_SAN * costMult),
    satiety: Math.floor(-STUDY_ALL.COST_SATIETY * costMult), // 胃の負担は深夜なら減るはずだがStudyAllは例外的に疲れるとするか、一貫性を取るか。
                                                             // ここではシンプルに「深夜は無理をする」ので消費増とする。
    knowledge: knowledgeGain
  };

  const { newState, messages } = applyEffect(state, effect);
  
  // 全科目の最終学習ターンを更新 (忘却リセット)
  subjects.forEach(sid => {
    newState.lastStudied[sid] = newState.turnCount;
  });

  const details = joinMessages(messages, ', ');
  const nightLog = isLateNight ? "深夜の静寂で集中力が増したが、消耗も激しい。" : "";
  pushLog(newState, `【総合演習】全科目を薄く広く復習した。科目毎の理解度に差が出た。\n${nightLog}(${details})`, isLateNight ? 'warning' : 'info');
  
  return newState;
};

export const gameReducer = (state: GameState, action: GameAction): GameState => {
  // セーブデータのロード
  if (action.type === ActionType.LOAD_STATE) {
    const loadedState = action.payload;
    return { 
      ...INITIAL_STATE, 
      ...loadedState,
      // Ensure uiScale and debugFlags exist even for old saves
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

  if (action.type === ActionType.TOGGLE_DEBUG_FLAG) {
    const flag = action.payload;
    return {
      ...state,
      debugFlags: {
        ...state.debugFlags,
        [flag]: !state.debugFlags[flag]
      }
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

  // ニューゲーム（手動ハードリスタート）
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
  
  let timeAdvanced = true; // デフォルトで時間経過あり

  // 分岐イベント選択の処理
  if (action.type === ActionType.RESOLVE_EVENT) {
    const { optionId } = action.payload;
    const event = newState.pendingEvent;
    
    if (event && event.options) {
      const option = event.options.find(o => o.id === optionId);
      if (option) {
        const isSuccess = Math.random() * 100 < option.successRate;
        let chainTargetId: string | null = null;
        
        if (isSuccess) {
          let effect = option.successEffect;
          
          // --- 動的科目選択ロジック ---
          if (effect && effect.knowledge && DYNAMIC_SUBJECT_OPTIONS.includes(option.id)) {
            const targetSubject = selectWeakestSubject(newState.knowledge);
            const amounts = Object.values(effect.knowledge);
            const amount = amounts.length > 0 ? amounts[0] : 10;
            effect = { ...effect, knowledge: { [targetSubject]: amount } };
          }
          
          let details: string[] = [];
          if (effect) {
            const res = applyEffect(newState, effect);
            newState = res.newState;
            details = res.messages;
          }
          pushLog(newState, `${event.text}\n\n▶ 選択: ${option.label}\n${option.successLog}\n(${details.join(', ')})`, 'success');

          // CHAIN HANDLING
          if (option.chainEventId) {
            chainTargetId = option.chainEventId;
          } else if (option.chainTrigger) {
             const prevHistoryLen = newState.eventHistory.length;
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
          
          // Failure chain (could exist in future, currently undefined in type but consistent logic)
          if (option.chainEventId) {
             chainTargetId = option.chainEventId;
          }
        }

        // Direct Chain Execution (High Priority)
        if (chainTargetId) {
           const nextEvent = ALL_EVENTS.find(e => e.id === chainTargetId);
           if (nextEvent) {
              // Immediately pending the next event without randomization
              // NOTE: This bypasses executeEvent selection logic
              newState = recordEventOccurrence(newState, nextEvent.id);
              if (nextEvent.options) {
                 newState.pendingEvent = nextEvent; // Next event is interactive
                 return newState; // Return early, don't clear pendingEvent yet
              } else {
                 // Immediate effect event
                 // We need to apply effect and log it here manually as we bypassed executeEvent
                 const { newState: chainedState, messages: chainedMsgs } = applyEffect(newState, nextEvent.effect || {});
                 newState = chainedState;
                 const chainedDetails = joinMessages(chainedMsgs, ', ');
                 pushLog(newState, chainedDetails ? `${nextEvent.text}\n(${chainedDetails})` : nextEvent.text, nextEvent.type === 'good' ? 'success' : 'info');
              }
           } else {
              if (state.debugFlags.logEventFlow) console.warn(`Chain event ${chainTargetId} not found.`);
           }
        }
      }
    }

    // If we reached here, it means no interactive chain occurred, so clear pending
    newState.pendingEvent = null;
    timeAdvanced = false; // イベント解決時は時間を進めない（アクション実行時に既に進んでいるか、即時解決のため）
  } 
  // イベント待機中なら、RESOLVE_EVENT以外のアクションはブロック
  else if (newState.pendingEvent) {
    return state;
  }
  // 通常アクションの処理
  else {
    switch (action.type) {
      case ActionType.STUDY:
        newState = handleStudy(newState, action.payload);
        if (newState.sanity < 30) {
          newState.flags.madnessStack = Math.min(4, newState.flags.madnessStack + 1);
        }
        break;
      case ActionType.STUDY_ALL:
        // 授業中かどうかのチェック。handleStudyAll内部でもチェックしているが、
        // ここで弾いて時間を進めないようにする
        if (newState.timeSlot === TimeSlot.AM || newState.timeSlot === TimeSlot.AFTERNOON) {
           newState = handleStudyAll(newState); // 警告ログを出す
           timeAdvanced = false;
        } else {
           newState = handleStudyAll(newState);
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
  }

  // 時間経過処理の委譲 (生存している場合のみ turnManager が機能するが、死亡判定は後述)
  if (timeAdvanced) {
    const isResting = action.type === ActionType.REST || action.type === ActionType.ESCAPISM;
    newState = processTurnEnd(newState, isResting);
  }

  // ゲーム終了判定 (アクションやイベント解決の後に必ず実施)
  if (newState.day > 7) {
    const metrics = evaluateExam(newState);
    newState.status = metrics.passed ? GameStatus.VICTORY : GameStatus.FAILURE;
    newState.pendingEvent = null; 
    if (newState.status === GameStatus.VICTORY) pushLog(newState, ACTION_LOGS.SYSTEM.VICTORY, 'success');
    else pushLog(newState, ACTION_LOGS.SYSTEM.FAILURE, 'danger');
  } else if (newState.hp <= 0) {
    newState.status = GameStatus.GAME_OVER_HP;
    newState.pendingEvent = null;
    pushLog(newState, ACTION_LOGS.SYSTEM.GAME_OVER_HP, 'danger');
  } else if (newState.sanity <= 0) {
    newState.status = GameStatus.GAME_OVER_SANITY;
    newState.pendingEvent = null;
    pushLog(newState, ACTION_LOGS.SYSTEM.GAME_OVER_MADNESS, 'danger');
  }

  return newState;
};
