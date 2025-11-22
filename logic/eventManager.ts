
import { GameState, GameEvent, EventTriggerType, SubjectId, RelationshipId, ItemId } from '../types';
import { clamp, joinMessages } from '../utils/common';
import { pushLog } from './stateHelpers';
import { ALL_EVENTS } from '../data/events';
import { SUBJECTS } from '../data/subjects';
import { ITEMS } from '../data/items';

/**
 * Checks if event conditions are met.
 */
const checkConditions = (state: GameState, event: GameEvent, trigger: EventTriggerType): boolean => {
  if (event.trigger !== trigger) return false;

  const { conditions } = event;
  if (!conditions) return true;

  // TimeSlot Check
  if (conditions.timeSlots && !conditions.timeSlots.includes(state.timeSlot)) return false;

  // HP Check
  if (conditions.minHp !== undefined && state.hp < conditions.minHp) return false;
  if (conditions.maxHp !== undefined && state.hp > conditions.maxHp) return false;

  // Sanity Check
  if (conditions.minSanity !== undefined && state.sanity < conditions.minSanity) return false;
  if (conditions.maxSanity !== undefined && state.sanity > conditions.maxSanity) return false;

  // Caffeine Check
  if (conditions.caffeineMin !== undefined && state.caffeine < conditions.caffeineMin) return false;
  if (conditions.caffeineMax !== undefined && state.caffeine > conditions.caffeineMax) return false;

  // Score Check
  const avgScore = Object.values(state.knowledge).reduce((a, b) => a + b, 0) / 4;
  if (conditions.minAvgScore !== undefined && avgScore < conditions.minAvgScore) return false;
  if (conditions.maxAvgScore !== undefined && avgScore > conditions.maxAvgScore) return false;

  // Relationship Check
  let targetRelValue = 0;
  if (trigger === 'action_professor') targetRelValue = state.relationships[RelationshipId.PROFESSOR];
  if (trigger === 'action_senior') targetRelValue = state.relationships[RelationshipId.SENIOR];
  if (trigger === 'action_friend') targetRelValue = state.relationships[RelationshipId.FRIEND];

  if (trigger !== 'turn_end') {
    if (conditions.minRelationship !== undefined && targetRelValue < conditions.minRelationship) return false;
    if (conditions.maxRelationship !== undefined && targetRelValue > conditions.maxRelationship) return false;
  }

  // Item Required
  if (conditions.itemRequired) {
    for (const itemId of conditions.itemRequired) {
      if ((state.inventory[itemId] || 0) <= 0) return false;
    }
  }

  return true;
};

/**
 * Calculates dynamic weight based on cooldowns and history.
 */
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

/**
 * Selects an event from the pool.
 */
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

/**
 * Records stats for analytics.
 */
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

const RELATIONSHIP_NAMES: Record<RelationshipId, string> = {
  [RelationshipId.PROFESSOR]: '教授友好度',
  [RelationshipId.SENIOR]: '先輩友好度',
  [RelationshipId.FRIEND]: '友人友好度',
};

/**
 * Applies event effects to the state.
 */
export const applyEventEffect = (state: GameState, event: GameEvent): { newState: GameState; messages: string[] } => {
  let newState = { ...state };
  newState.knowledge = { ...state.knowledge };
  newState.relationships = { ...state.relationships };
  newState.inventory = { ...state.inventory };

  const messages: string[] = [];
  
  newState = recordEventOccurrence(newState, event.id);

  if (!event.effect) return { newState, messages };

  const { effect } = event;

  if (effect.hp) {
    newState.hp = clamp(newState.hp + effect.hp, 0, newState.maxHp);
    messages.push(`HP${effect.hp > 0 ? '+' : ''}${effect.hp}`);
  }
  if (effect.sanity) {
    newState.sanity = clamp(newState.sanity + effect.sanity, 0, newState.maxSanity);
    messages.push(`SAN${effect.sanity > 0 ? '+' : ''}${effect.sanity}`);
  }
  if (effect.caffeine) {
    newState.caffeine = clamp(newState.caffeine + effect.caffeine, 0, 200);
    messages.push(`カフェイン${effect.caffeine > 0 ? '+' : ''}${effect.caffeine}`);
  }
  if (effect.knowledge) {
    Object.entries(effect.knowledge).forEach(([key, val]) => {
      if (val) {
        const sId = key as SubjectId;
        newState.knowledge[sId] = clamp(newState.knowledge[sId] + val, 0, 100);
        const subjectName = SUBJECTS[sId].name;
        messages.push(`${subjectName}${val > 0 ? '+' : ''}${val}`);
      }
    });
  }
  if (effect.relationships) {
    Object.entries(effect.relationships).forEach(([key, val]) => {
      if (val) {
        const rId = key as RelationshipId;
        newState.relationships[rId] = clamp(newState.relationships[rId] + val, 0, 100);
        const relName = RELATIONSHIP_NAMES[rId];
        messages.push(`${relName}${val > 0 ? '+' : ''}${val}`);
      }
    });
  }
  if (effect.inventory) {
    Object.entries(effect.inventory).forEach(([key, val]) => {
      if (val) {
        const iId = key as ItemId;
        const current = newState.inventory[iId] || 0;
        newState.inventory[iId] = current + val;
        const item = ITEMS[iId];
        messages.push(`${item.name}${val > 0 ? '入手' : '消費'}`);
      }
    });
  }

  if (effect.money) {
    newState.money += effect.money;
    messages.push(`資金${effect.money > 0 ? '+' : ''}¥${effect.money.toLocaleString()}`);
  }

  return { newState, messages };
};

/**
 * Orchestrates the selection and application of an event.
 */
export const executeEvent = (state: GameState, trigger: EventTriggerType, fallbackText?: string): GameState => {
  const event = selectEvent(state, ALL_EVENTS, trigger);
  
  if (event) {
     // 分岐イベントの場合、即時適用せず pendingEvent にセットして終了
     if (event.options && event.options.length > 0) {
       const newState = recordEventOccurrence(state, event.id); // 発生記録だけつける
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
