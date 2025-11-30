
import { Draft } from 'immer';
import { GameState, SubjectId } from '../../types';
import { ALL_EVENTS } from '../../data/events';
import { selectWeakestSubject } from '../studyAutoSelect';
import { applyEffect } from '../effectProcessor';
import { pushLog } from '../stateHelpers';
import { executeEvent, recordEventOccurrence } from '../eventManager';
import { joinMessages } from '../../utils/logFormatter';

// 動的科目選択を適用するイベントオプションIDのリスト
const DYNAMIC_SUBJECT_OPTIONS = [
  'opt_prof_ask_exam',   // 教授: 試験について聞く
  'opt_senior_past_paper', // 先輩: 過去問入手
  'opt_friend_study'     // 友人: 一緒に勉強
];

export const resolveEvent = (draft: Draft<GameState>, optionId: string): void => {
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
};
