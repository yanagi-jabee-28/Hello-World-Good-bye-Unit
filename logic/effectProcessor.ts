import { GameState, GameEventEffect, SubjectId, RelationshipId, ItemId } from '../types';
import { clamp } from '../utils/common';
import { formatEffect } from '../utils/logFormatter';
import { LOG_TEMPLATES } from '../data/constants/logMessages';

/**
 * GameEventEffectをGameStateに適用する。
 * 更新されたStateと、フォーマット済みのログメッセージを返す。
 * Note: Stateは浅いコピーを作成して更新する（Immutabilityの確保）
 */
export const applyEffect = (
  state: GameState,
  effect: GameEventEffect
): { newState: GameState; messages: string[] } => {
  // 状態のコピー（ネストされたオブジェクトもコピー）
  const newState = {
    ...state,
    knowledge: { ...state.knowledge },
    relationships: { ...state.relationships },
    inventory: { ...state.inventory },
    activeBuffs: [...state.activeBuffs],
  };

  const messages: string[] = formatEffect(effect);

  // --- 数値パラメータの更新 ---
  if (effect.hp) newState.hp = clamp(newState.hp + effect.hp, 0, newState.maxHp);
  if (effect.sanity) newState.sanity = clamp(newState.sanity + effect.sanity, 0, newState.maxSanity);
  if (effect.caffeine) newState.caffeine = clamp(newState.caffeine + effect.caffeine, 0, 200);

  // --- 知識パラメータの更新 ---
  if (effect.knowledge) {
    Object.entries(effect.knowledge).forEach(([key, val]) => {
      if (val) {
        const sId = key as SubjectId;
        newState.knowledge[sId] = clamp(newState.knowledge[sId] + val, 0, 100);
      }
    });
  }

  // --- 友好度の更新 ---
  if (effect.relationships) {
    Object.entries(effect.relationships).forEach(([key, val]) => {
      if (val) {
        const rId = key as RelationshipId;
        newState.relationships[rId] = clamp(newState.relationships[rId] + val, 0, 100);
      }
    });
  }

  // --- インベントリの更新 ---
  if (effect.inventory) {
    Object.entries(effect.inventory).forEach(([key, val]) => {
      if (val) {
        const iId = key as ItemId;
        const current = newState.inventory[iId] || 0;
        newState.inventory[iId] = Math.max(0, current + val);
      }
    });
  }

  // --- 所持金の更新 ---
  if (effect.money) {
    newState.money += effect.money;
  }

  // --- バフの適用 ---
  if (effect.buffs && effect.buffs.length > 0) {
    effect.buffs.forEach(buffData => {
      newState.activeBuffs.push({
        ...buffData,
        id: `BUFF_${state.turnCount}_${Math.random().toString(36).substr(2, 5)}`
      });
      messages.push(LOG_TEMPLATES.BUFF.DURATION(buffData.description, buffData.duration));
    });
  }

  return { newState, messages };
};