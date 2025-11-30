
import { GameState, GameEventEffect, SubjectId, RelationshipId, ItemId, Buff } from '../types';
import { clamp } from '../utils/common';
import { LOG_TEMPLATES, RELATIONSHIP_NAMES } from '../data/constants/logMessages';
import { SUBJECTS } from '../data/subjects';
import { ITEMS } from '../data/items';

/**
 * 複数の効果オブジェクトを合成する
 */
export const mergeEffects = (base: GameEventEffect, ...others: (GameEventEffect | undefined)[]): GameEventEffect => {
  const result: GameEventEffect = JSON.parse(JSON.stringify(base));

  others.forEach(other => {
    if (!other) return;

    if (other.hp) result.hp = (result.hp || 0) + other.hp;
    if (other.sanity) result.sanity = (result.sanity || 0) + other.sanity;
    if (other.money) result.money = (result.money || 0) + other.money;
    if (other.caffeine) result.caffeine = (result.caffeine || 0) + other.caffeine;
    if (other.satiety) result.satiety = (result.satiety || 0) + other.satiety;

    if (other.knowledge) {
      result.knowledge = result.knowledge || {};
      Object.entries(other.knowledge).forEach(([k, v]) => {
        const sid = k as SubjectId;
        result.knowledge![sid] = (result.knowledge![sid] || 0) + (v || 0);
      });
    }

    if (other.relationships) {
      result.relationships = result.relationships || {};
      Object.entries(other.relationships).forEach(([k, v]) => {
        const rid = k as RelationshipId;
        result.relationships![rid] = (result.relationships![rid] || 0) + (v || 0);
      });
    }

    if (other.inventory) {
      result.inventory = result.inventory || {};
      Object.entries(other.inventory).forEach(([k, v]) => {
        const iid = k as ItemId;
        result.inventory![iid] = (result.inventory![iid] || 0) + (v || 0);
      });
    }

    if (other.buffs) {
      result.buffs = [...(result.buffs || []), ...other.buffs];
    }

    if (other.flags) {
      result.flags = { ...(result.flags || {}), ...other.flags };
    }
  });

  return result;
};

// --- Sub-processors for modularity ---

const processBasicStats = (state: GameState, effect: GameEventEffect, messages: string[]) => {
  if (effect.hp !== undefined) {
    state.hp = clamp(state.hp + effect.hp, 0, state.maxHp);
    messages.push(LOG_TEMPLATES.PARAM.HP(effect.hp));
  }
  if (effect.sanity !== undefined) {
    state.sanity = clamp(state.sanity + effect.sanity, 0, state.maxSanity);
    messages.push(LOG_TEMPLATES.PARAM.SAN(effect.sanity));
  }
  if (effect.caffeine !== undefined) {
    state.caffeine = clamp(state.caffeine + effect.caffeine, 0, 200);
    messages.push(LOG_TEMPLATES.PARAM.CAFFEINE(effect.caffeine));
  }
  if (effect.satiety !== undefined) {
    state.satiety = clamp(state.satiety + effect.satiety, 0, state.maxSatiety);
    messages.push(LOG_TEMPLATES.PARAM.SATIETY(effect.satiety));
  }
  if (effect.money !== undefined) {
    state.money += effect.money;
    messages.push(LOG_TEMPLATES.PARAM.MONEY(effect.money));
  }
};

const processKnowledge = (state: GameState, effect: GameEventEffect, messages: string[]) => {
  if (!effect.knowledge) return;
  
  Object.entries(effect.knowledge).forEach(([key, val]) => {
    if (val) {
      const sId = key as SubjectId;
      state.knowledge[sId] = clamp(state.knowledge[sId] + val, 0, 100);
      
      // 知識が増加した場合、最終学習ターンを更新して忘却を阻止
      if (val > 0) {
        state.lastStudied[sId] = state.turnCount;
      }
      messages.push(LOG_TEMPLATES.PARAM.KNOWLEDGE(SUBJECTS[sId].name, val));
    }
  });
};

const processRelationships = (state: GameState, effect: GameEventEffect, messages: string[]) => {
  if (!effect.relationships) return;

  Object.entries(effect.relationships).forEach(([key, val]) => {
    if (val) {
      const rId = key as RelationshipId;
      state.relationships[rId] = clamp(state.relationships[rId] + val, 0, 100);
      messages.push(LOG_TEMPLATES.PARAM.RELATIONSHIP(RELATIONSHIP_NAMES[rId], val));
    }
  });
};

const processInventory = (state: GameState, effect: GameEventEffect, messages: string[]) => {
  if (!effect.inventory) return;

  Object.entries(effect.inventory).forEach(([key, val]) => {
    if (val) {
      const iId = key as ItemId;
      const current = state.inventory[iId] || 0;
      state.inventory[iId] = Math.max(0, current + val);
      
      const itemName = ITEMS[iId]?.name || iId;
      if (val > 0) {
        messages.push(LOG_TEMPLATES.ITEM.GET(itemName));
      } else {
        messages.push(LOG_TEMPLATES.ITEM.LOSE(itemName));
      }
    }
  });
};

const processBuffs = (state: GameState, effect: GameEventEffect, messages: string[]) => {
  if (!effect.buffs || effect.buffs.length === 0) return;

  effect.buffs.forEach(buffData => {
    // Generate unique ID for buff
    const buffId = `BUFF_${state.turnCount}_${Math.random().toString(36).substr(2, 5)}`;
    const newBuff: Buff = { ...buffData, id: buffId };
    
    state.activeBuffs.push(newBuff);
    messages.push(LOG_TEMPLATES.BUFF.DURATION(buffData.description, buffData.duration));
  });
};

const processFlags = (state: GameState, effect: GameEventEffect) => {
  if (!effect.flags) return;

  Object.entries(effect.flags).forEach(([key, val]) => {
    const k = key as keyof typeof state.flags;
    // 数値なら加算、それ以外（boolean等）なら上書き
    if (typeof val === 'number' && typeof state.flags[k] === 'number') {
      (state.flags[k] as number) += val;
    } else {
      (state.flags[k] as any) = val;
    }
  });
};

/**
 * State Deep Clone Helper
 */
const cloneState = (state: GameState): GameState => ({
  ...state,
  knowledge: { ...state.knowledge },
  lastStudied: { ...state.lastStudied },
  relationships: { ...state.relationships },
  inventory: { ...state.inventory },
  activeBuffs: [...state.activeBuffs],
  flags: { ...state.flags },
  logs: [...state.logs],
  eventHistory: [...state.eventHistory],
  eventStats: { ...state.eventStats },
  statsHistory: [...state.statsHistory]
});

/**
 * GameEventEffectをGameStateに適用する。
 * 更新されたStateと、フォーマット済みのログメッセージを返す。
 * Stateはディープコピーされ、Immutabilityが保たれる。
 */
export const applyEffect = (
  state: GameState,
  effect: GameEventEffect
): { newState: GameState; messages: string[] } => {
  // 1. Create a deep copy of the state to mutate
  const newState = cloneState(state);
  const messages: string[] = [];

  // 2. Apply effects in order using specialized processors
  processBasicStats(newState, effect, messages);
  processKnowledge(newState, effect, messages);
  processRelationships(newState, effect, messages);
  processInventory(newState, effect, messages);
  processBuffs(newState, effect, messages);
  processFlags(newState, effect);

  return { newState, messages };
};
