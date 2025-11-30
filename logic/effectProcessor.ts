
import { Draft } from 'immer';
import { GameState, GameEventEffect, SubjectId, RelationshipId, ItemId, Buff } from '../types';
import { clamp } from '../utils/common';
import { LOG_TEMPLATES, RELATIONSHIP_NAMES } from '../data/constants/logMessages';
import { SUBJECTS } from '../data/subjects';
import { ITEMS } from '../data/items';

/**
 * 複数の効果オブジェクトを合成する（データ作成用ユーティリティとして維持）
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

// --- Sub-processors (Draft Mutators) ---

const processBasicStats = (draft: Draft<GameState>, effect: GameEventEffect, messages: string[]) => {
  if (effect.hp !== undefined) {
    draft.hp = clamp(draft.hp + effect.hp, 0, draft.maxHp);
    messages.push(LOG_TEMPLATES.PARAM.HP(effect.hp));
  }
  if (effect.sanity !== undefined) {
    draft.sanity = clamp(draft.sanity + effect.sanity, 0, draft.maxSanity);
    messages.push(LOG_TEMPLATES.PARAM.SAN(effect.sanity));
  }
  if (effect.caffeine !== undefined) {
    draft.caffeine = clamp(draft.caffeine + effect.caffeine, 0, 200);
    messages.push(LOG_TEMPLATES.PARAM.CAFFEINE(effect.caffeine));
  }
  if (effect.satiety !== undefined) {
    draft.satiety = clamp(draft.satiety + effect.satiety, 0, draft.maxSatiety);
    messages.push(LOG_TEMPLATES.PARAM.SATIETY(effect.satiety));
  }
  if (effect.money !== undefined) {
    draft.money += effect.money;
    messages.push(LOG_TEMPLATES.PARAM.MONEY(effect.money));
  }
};

const processKnowledge = (draft: Draft<GameState>, effect: GameEventEffect, messages: string[]) => {
  if (!effect.knowledge) return;
  
  Object.entries(effect.knowledge).forEach(([key, val]) => {
    if (val) {
      const sId = key as SubjectId;
      draft.knowledge[sId] = clamp(draft.knowledge[sId] + val, 0, 100);
      
      // 知識が増加した場合、最終学習ターンを更新して忘却を阻止
      if (val > 0) {
        draft.lastStudied[sId] = draft.turnCount;
      }
      messages.push(LOG_TEMPLATES.PARAM.KNOWLEDGE(SUBJECTS[sId].name, val));
    }
  });
};

const processRelationships = (draft: Draft<GameState>, effect: GameEventEffect, messages: string[]) => {
  if (!effect.relationships) return;

  Object.entries(effect.relationships).forEach(([key, val]) => {
    if (val) {
      const rId = key as RelationshipId;
      draft.relationships[rId] = clamp(draft.relationships[rId] + val, 0, 100);
      messages.push(LOG_TEMPLATES.PARAM.RELATIONSHIP(RELATIONSHIP_NAMES[rId], val));
    }
  });
};

const processInventory = (draft: Draft<GameState>, effect: GameEventEffect, messages: string[]) => {
  if (!effect.inventory) return;

  Object.entries(effect.inventory).forEach(([key, val]) => {
    if (val) {
      const iId = key as ItemId;
      const current = draft.inventory[iId] || 0;
      draft.inventory[iId] = Math.max(0, current + val);
      
      const itemName = ITEMS[iId]?.name || iId;
      if (val > 0) {
        messages.push(LOG_TEMPLATES.ITEM.GET(itemName));
      } else {
        messages.push(LOG_TEMPLATES.ITEM.LOSE(itemName));
      }
    }
  });
};

const processBuffs = (draft: Draft<GameState>, effect: GameEventEffect, messages: string[]) => {
  if (!effect.buffs || effect.buffs.length === 0) return;

  effect.buffs.forEach(buffData => {
    // Generate unique ID for buff
    const buffId = `BUFF_${draft.turnCount}_${Math.random().toString(36).substr(2, 5)}`;
    // Cast to Buff to satisfy type system (id is added here)
    const newBuff = { ...buffData, id: buffId } as Buff;
    
    draft.activeBuffs.push(newBuff);
    messages.push(LOG_TEMPLATES.BUFF.DURATION(buffData.description, buffData.duration));
  });
};

const processFlags = (draft: Draft<GameState>, effect: GameEventEffect) => {
  if (!effect.flags) return;

  Object.entries(effect.flags).forEach(([key, val]) => {
    const k = key as keyof typeof draft.flags;
    // 数値なら加算、それ以外（boolean等）なら上書き
    if (typeof val === 'number' && typeof draft.flags[k] === 'number') {
      (draft.flags[k] as number) += val;
    } else {
      (draft.flags[k] as any) = val;
    }
  });
};

/**
 * Applies a GameEventEffect to the state draft.
 * Mutates the draft directly and returns formatted log messages.
 * 
 * @param draft Immer draft of GameState
 * @param effect The effect to apply
 * @returns Array of log messages generated by the effect
 */
export const applyEffect = (
  draft: Draft<GameState>,
  effect: GameEventEffect
): string[] => {
  const messages: string[] = [];

  processBasicStats(draft, effect, messages);
  processKnowledge(draft, effect, messages);
  processRelationships(draft, effect, messages);
  processInventory(draft, effect, messages);
  processBuffs(draft, effect, messages);
  processFlags(draft, effect);

  return messages;
};
