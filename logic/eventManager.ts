
import { Draft } from 'immer';
import { GameState, GameEvent, EventTriggerType, SubjectId, RelationshipId, GameEventCondition } from '../types';
import { joinMessages } from '../utils/logFormatter';
import { pushLog } from './stateHelpers';
import { ALL_EVENTS } from '../data/events';
import { applyEffect, mergeEffects } from './effectProcessor';

// --- Condition Validators ---

type Validator = (state: GameState, conditions: GameEventCondition, trigger: EventTriggerType) => boolean;

const validators: Validator[] = [
  (state, c) => !c.timeSlots || c.timeSlots.includes(state.timeSlot),
  (state, c) => c.minHp === undefined || state.hp >= c.minHp,
  (state, c) => c.maxHp === undefined || state.hp <= c.maxHp,
  (state, c) => c.minSanity === undefined || state.sanity >= c.minSanity,
  (state, c) => c.maxSanity === undefined || state.sanity <= c.maxSanity,
  (state, c) => c.caffeineMin === undefined || state.caffeine >= c.caffeineMin,
  (state, c) => c.caffeineMax === undefined || state.caffeine <= c.caffeineMax,
  (state, c) => c.minMoney === undefined || state.money >= c.minMoney,
  (state, c) => {
    if (c.minAvgScore !== undefined) {
      const avgScore = Object.values(state.knowledge).reduce((a, b) => a + b, 0) / 4;
      if (avgScore < c.minAvgScore) return false;
    }
    if (c.maxAvgScore !== undefined) {
      const avgScore = Object.values(state.knowledge).reduce((a, b) => a + b, 0) / 4;
      if (avgScore > c.maxAvgScore) return false;
    }
    if (c.minKnowledge) {
      for (const [subjectId, minScore] of Object.entries(c.minKnowledge)) {
        if ((state.knowledge[subjectId as SubjectId] || 0) < (minScore as number)) return false;
      }
    }
    return true;
  },
  (state, c, trigger) => {
    if (trigger === 'turn_end') return true; 
    let targetRelValue = 0;
    if (trigger === 'action_professor') targetRelValue = state.relationships[RelationshipId.PROFESSOR];
    if (trigger === 'action_senior') targetRelValue = state.relationships[RelationshipId.SENIOR];
    if (trigger === 'action_friend') targetRelValue = state.relationships[RelationshipId.FRIEND];

    if (c.minRelationship !== undefined && targetRelValue < c.minRelationship) return false;
    if (c.maxRelationship !== undefined && targetRelValue > c.maxRelationship) return false;
    return true;
  },
  (state, c) => {
    if (!c.itemRequired) return true;
    for (const itemId of c.itemRequired) {
      if ((state.inventory[itemId] || 0) <= 0) return false;
    }
    return true;
  }
];

const checkConditions = (state: GameState, event: GameEvent, trigger: EventTriggerType): boolean => {
  if (event.trigger !== trigger) return false;
  const { conditions } = event;
  if (!conditions) return true;
  return validators.every(v => v(state, conditions, trigger));
};

const calculateDynamicWeight = (state: GameState, event: GameEvent): number => {
  const stats = state.eventStats[event.id];
  if (!stats) return event.weight;
  if (event.maxOccurrences !== undefined && stats.count >= event.maxOccurrences) return 0;
  if (event.coolDownTurns !== undefined) {
    const turnsSinceLast = state.turnCount - stats.lastTurn;
    if (turnsSinceLast < event.coolDownTurns) return 0;
  }
  let weight = event.weight;
  if (event.decay && stats.count > 0) weight = weight * Math.pow(event.decay, stats.count);
  if (state.eventHistory.includes(event.id)) weight *= 0.1;
  return Math.max(0, weight);
};

export const selectEvent = (state: GameState, events: GameEvent[], trigger: EventTriggerType): GameEvent | null => {
  const candidates = events
    .filter(evt => checkConditions(state, evt, trigger))
    .map(evt => ({ evt, weight: calculateDynamicWeight(state, evt) }))
    .filter(item => item.weight > 0);

  if (state.debugFlags.logEventFlow) console.debug(`[EventManager] Trigger: ${trigger}, Candidates: ${candidates.length}`);
  if (candidates.length === 0) return null;

  const totalWeight = candidates.reduce((sum, item) => sum + item.weight, 0);
  let randomVal = Math.random() * totalWeight;
  for (const item of candidates) {
    randomVal -= item.weight;
    if (randomVal <= 0) return item.evt;
  }
  return candidates[candidates.length - 1].evt;
};

export const recordEventOccurrence = (draft: Draft<GameState>, eventId: string): void => {
  const currentStats = draft.eventStats[eventId] || { count: 0, lastTurn: -1 };
  
  if (draft.eventHistory.length >= 5) {
      draft.eventHistory.pop();
  }
  draft.eventHistory.unshift(eventId);
  
  draft.eventStats[eventId] = {
    count: currentStats.count + 1,
    lastTurn: draft.turnCount
  };
};

// Returns messages instead of { newState, messages }
export const applyEventEffect = (draft: Draft<GameState>, event: GameEvent): string[] => {
  recordEventOccurrence(draft, event.id);

  let effect = event.effect;
  const isSocial = ['action_professor', 'action_senior', 'action_friend'].includes(event.trigger);
  
  if (isSocial) {
    const hasMeaningfulEffect = effect && (
      (effect.hp && effect.hp !== 0) ||
      (effect.sanity && effect.sanity !== 0) ||
      (effect.money && effect.money !== 0) ||
      (effect.knowledge && Object.values(effect.knowledge).some(v => v !== 0)) ||
      (effect.relationships && Object.values(effect.relationships).some(v => v !== 0)) ||
      (effect.inventory && Object.values(effect.inventory).some(v => v !== 0))
    );

    if (!hasMeaningfulEffect) {
      let targetRel: RelationshipId = RelationshipId.FRIEND;
      if (event.trigger === 'action_professor') targetRel = RelationshipId.PROFESSOR;
      if (event.trigger === 'action_senior') targetRel = RelationshipId.SENIOR;
      effect = mergeEffects(effect || {}, { relationships: { [targetRel]: 1 } });
    }
  }

  if (!effect) return [];
  return applyEffect(draft, effect);
};

const createFallbackEvent = (trigger: EventTriggerType, text: string): GameEvent => {
  return {
    id: `fallback_${trigger}_${Date.now()}`,
    trigger,
    text,
    type: 'flavor',
    weight: 1,
    effect: { sanity: 1 } 
  };
};

export const executeEvent = (draft: Draft<GameState>, trigger: EventTriggerType, fallbackText?: string): void => {
  // selectEvent is read-only so we can cast draft to GameState
  let event = selectEvent(draft as GameState, ALL_EVENTS, trigger);
  
  if (!event && fallbackText) {
    event = createFallbackEvent(trigger, fallbackText);
  }

  if (event) {
     if (event.options && event.options.length > 0) {
       recordEventOccurrence(draft, event.id);
       draft.pendingEvent = event;
       return;
     }

     const messages = applyEventEffect(draft, event);
     const details = joinMessages(messages, ', ');
     const logType = event.type === 'good' ? 'success' : event.type === 'bad' ? 'danger' : 'info';
     pushLog(draft, details ? `${event.text}\n(${details})` : event.text, logType);
  } 
};
