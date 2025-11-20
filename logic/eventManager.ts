
import { GameState, GameEvent, EventTriggerType, SubjectId, RelationshipId, TimeSlot } from '../types';
import { clamp } from '../utils/common';

/**
 * イベント発生条件を満たしているかチェック
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
  // トリガーに応じた対象の友好度をチェック
  let targetRelValue = 0;
  if (trigger === 'action_professor') targetRelValue = state.relationships[RelationshipId.PROFESSOR];
  if (trigger === 'action_senior') targetRelValue = state.relationships[RelationshipId.SENIOR];
  if (trigger === 'action_friend') targetRelValue = state.relationships[RelationshipId.FRIEND];

  if (trigger !== 'turn_end') {
    if (conditions.minRelationship !== undefined && targetRelValue < conditions.minRelationship) return false;
    if (conditions.maxRelationship !== undefined && targetRelValue > conditions.maxRelationship) return false;
  }

  return true;
};

/**
 * クールダウンや回数制限をチェックし、動的な重みを計算する
 */
const calculateDynamicWeight = (state: GameState, event: GameEvent): number => {
  const stats = state.eventStats[event.id];
  
  if (!stats) return event.weight;

  // Max Occurrences Check
  if (event.maxOccurrences !== undefined && stats.count >= event.maxOccurrences) {
    return 0;
  }

  // Cool Down Check
  if (event.coolDownTurns !== undefined) {
    const turnsSinceLast = state.turnCount - stats.lastTurn;
    if (turnsSinceLast < event.coolDownTurns) {
      return 0;
    }
  }

  // Decay (繰り返しによる確率低下)
  let weight = event.weight;
  if (event.decay && stats.count > 0) {
    weight = weight * Math.pow(event.decay, stats.count);
  }

  // 直近の履歴に含まれている場合、さらに確率を下げる（短期間の連続発生抑制）
  if (state.eventHistory.includes(event.id)) {
    weight *= 0.1;
  }

  return Math.max(0, weight);
};

/**
 * イベントプールからイベントを抽選する
 */
export const selectEvent = (
  state: GameState, 
  events: GameEvent[], 
  trigger: EventTriggerType
): GameEvent | null => {
  
  // 1. 条件に合致するイベントをフィルタリングし、重みを計算
  const candidates = events
    .filter(evt => checkConditions(state, evt, trigger))
    .map(evt => ({
      evt,
      weight: calculateDynamicWeight(state, evt)
    }))
    .filter(item => item.weight > 0);

  if (candidates.length === 0) return null;

  // 2. 重み付き抽選
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
 * イベント発生後のState更新（統計情報の更新など）
 */
export const recordEventOccurrence = (state: GameState, eventId: string): GameState => {
  const currentStats = state.eventStats[eventId] || { count: 0, lastTurn: -1 };
  
  return {
    ...state,
    eventHistory: [eventId, ...state.eventHistory].slice(0, 5), // 履歴は最新5件
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
 * イベント効果をStateに適用する
 */
export const applyEventEffect = (state: GameState, event: GameEvent): { newState: GameState; messages: string[] } => {
  let newState = { ...state };
  // deep copy complex objects
  newState.knowledge = { ...state.knowledge };
  newState.relationships = { ...state.relationships };
  newState.inventory = { ...state.inventory };

  const messages: string[] = [];
  
  // 統計情報の更新
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
        messages.push(`学力${val > 0 ? '+' : ''}${val}`); // 科目名まで入れると長くなるので簡略化、もしくはUI側で処理
      }
    });
  }
  if (effect.relationships) {
    Object.entries(effect.relationships).forEach(([key, val]) => {
      if (val) {
        const rId = key as RelationshipId;
        newState.relationships[rId] = clamp(newState.relationships[rId] + val, 0, 100);
        messages.push(`友好${val > 0 ? '+' : ''}${val}`);
      }
    });
  }
  if (effect.inventory) {
    Object.entries(effect.inventory).forEach(([key, val]) => {
      if (val) {
        const iId = key as any; // ItemId
        const current = newState.inventory[iId] || 0;
        newState.inventory[iId] = current + val;
        messages.push(`アイテム${val > 0 ? '入手' : '消費'}`);
      }
    });
  }

  return { newState, messages };
};
