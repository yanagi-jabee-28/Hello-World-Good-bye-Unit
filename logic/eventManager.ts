import { GameState, GameEvent, EventTriggerType, SubjectId, RelationshipId, ItemId } from '../types';
import { clamp } from '../utils/common';
import { joinMessages } from '../utils/logFormatter';
import { pushLog } from './stateHelpers';
import { ALL_EVENTS } from '../data/events';
import { SUBJECTS } from '../data/subjects';
import { ITEMS } from '../data/items';
import { applyEffect } from './effectProcessor';

/**
 * Checks if event conditions are met.
 */
const checkConditions = (state: GameState, event: GameEvent, trigger: EventTriggerType): boolean => {
  if (event.trigger !== trigger) return false;

  const { conditions } = event;
  if (!conditions) return true;

  if (conditions.timeSlots && !conditions.timeSlots.includes(state.timeSlot)) return false;

  if (conditions.minHp !== undefined && state.hp < conditions.minHp) return false;
  if (conditions.maxHp !== undefined && state.hp > conditions.maxHp) return false;

  if (conditions.minSanity !== undefined && state.sanity < conditions.minSanity) return false;
  if (conditions.maxSanity !== undefined && state.sanity > conditions.maxSanity) return false;

  if (conditions.caffeineMin !== undefined && state.caffeine < conditions.caffeineMin) return false;
  if (conditions.caffeineMax !== undefined && state.caffeine > conditions.caffeineMax) return false;

  const avgScore = Object.values(state.knowledge).reduce((a, b) => a + b, 0) / 4;
  if (conditions.minAvgScore !== undefined && avgScore < conditions.minAvgScore) return false;
  if (conditions.maxAvgScore !== undefined && avgScore > conditions.maxAvgScore) return false;

  let targetRelValue = 0;
  if (trigger === 'action_professor') targetRelValue = state.relationships[RelationshipId.PROFESSOR];
  if (trigger === 'action_senior') targetRelValue = state.relationships[RelationshipId.SENIOR];
  if (trigger === 'action_friend') targetRelValue = state.relationships[RelationshipId.FRIEND];

  if (trigger !== 'turn_end') {
    if (conditions.minRelationship !== undefined && targetRelValue < conditions.minRelationship) return false;
    if (conditions.maxRelationship !== undefined && targetRelValue > conditions.maxRelationship) return false;
  }

  if (conditions.itemRequired) {
    for (const itemId of conditions.itemRequired) {
      if ((state.inventory[itemId] || 0) <= 0) return false;
    }
  }

  if (conditions.minMoney !== undefined && state.money < conditions.minMoney) return false;

  return true;
};

const calculateDynamicWeight = (state: GameState, event: GameEvent): number => {
  const stats = state.eventStats[event.id];
  
  if (!stats) return event.weight;

  if (event.maxOccurrences !== undefined && stats.count >= event.maxOccurrences) {
    return 0;
  }

  if (event.coolDownTurns !== undefined) {
    const turnsSinceLast = state.turnCount - stats.lastTurn;
    if (turnsSinceLast < event.coolDownTurns) {
      return 0;
    }
  }

  let weight = event.weight;
  if (event.decay && stats.count > 0) {
    weight = weight * Math.pow(event.decay, stats.count);
  }

  if (state.eventHistory.includes(event.id)) {
    weight *= 0.1;
  }

  return Math.max(0, weight);
};

export const selectEvent = (
  state: GameState, 
  events: GameEvent[], 
  trigger: EventTriggerType
): GameEvent | null => {
  const candidates = events
    .filter(evt => checkConditions(state, evt, trigger))
    .map(evt => ({
      evt,
      weight: calculateDynamicWeight(state, evt)
    }))
    .filter(item => item.weight > 0);

  if (candidates.length === 0) return null;

  const totalWeight = candidates.reduce((sum, item) => sum + item.weight, 0);
  let randomVal = Math.random() * totalWeight;
  
  for (const item of candidates) {
    randomVal -= item.weight;
    if (randomVal <= 0) {
      return item.evt;
    }
  }

  return candidates[candidates.length - 1].evt;
};

export const recordEventOccurrence = (state: GameState, eventId: string): GameState => {
  const currentStats = state.eventStats[eventId] || { count: 0, lastTurn: -1 };
  
  return {
    ...state,
    eventHistory: [eventId, ...state.eventHistory].slice(0, 5),
    eventStats: {
      ...state.eventStats,
      [eventId]: {
        count: currentStats.count + 1,
        lastTurn: state.turnCount
      }
    }
  };
};

/**
 * Applies event effects to the state and generates logs using effectProcessor.
 */
export const applyEventEffect = (state: GameState, event: GameEvent): { newState: GameState; messages: string[] } => {
  let newState = recordEventOccurrence(state, event.id);

  if (!event.effect) return { newState, messages: [] };

  // Use centralized processor
  const result = applyEffect(newState, event.effect);
  
  return {
    newState: result.newState,
    messages: result.messages
  };
};

export const executeEvent = (state: GameState, trigger: EventTriggerType, fallbackText?: string): GameState => {
  const event = selectEvent(state, ALL_EVENTS, trigger);
  
  if (event) {
     if (event.options && event.options.length > 0) {
       const newState = recordEventOccurrence(state, event.id);
       newState.pendingEvent = event;
       return newState;
     }

     const { newState: appliedState, messages } = applyEventEffect(state, event);
     const details = joinMessages(messages, ', ');
     const logType = event.type === 'good' ? 'success' : event.type === 'bad' ? 'danger' : 'info';
     pushLog(appliedState, details ? `${event.text}\n(${details})` : event.text, logType);
     return appliedState;
  } else if (fallbackText) {
     pushLog(state, fallbackText, 'info');
     return state;
  }
  return state;
};