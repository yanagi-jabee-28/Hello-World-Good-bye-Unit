
import { GameEventEffect, ItemId, SubjectId, RelationshipId, Item } from '../types';
import { SUBJECTS } from '../data/subjects';
import { ITEMS } from '../data/items';
import { LOG_TEMPLATES, RELATIONSHIP_NAMES } from '../data/constants/logMessages';

/**
 * 効果オブジェクトからログメッセージの配列を生成する
 */
export const formatEffect = (effect: GameEventEffect): string[] => {
  const messages: string[] = [];

  if (effect.hp) {
    messages.push(LOG_TEMPLATES.PARAM.HP(effect.hp));
  }
  if (effect.sanity) {
    messages.push(LOG_TEMPLATES.PARAM.SAN(effect.sanity));
  }
  if (effect.caffeine) {
    messages.push(LOG_TEMPLATES.PARAM.CAFFEINE(effect.caffeine));
  }
  if (effect.satiety) {
    messages.push(LOG_TEMPLATES.PARAM.SATIETY(effect.satiety));
  }
  
  if (effect.knowledge) {
    Object.entries(effect.knowledge).forEach(([key, val]) => {
      if (val) {
        const subjectName = SUBJECTS[key as SubjectId].name;
        messages.push(LOG_TEMPLATES.PARAM.KNOWLEDGE(subjectName, val));
      }
    });
  }
  
  if (effect.relationships) {
    Object.entries(effect.relationships).forEach(([key, val]) => {
      if (val) {
        const relName = RELATIONSHIP_NAMES[key as RelationshipId];
        messages.push(LOG_TEMPLATES.PARAM.RELATIONSHIP(relName, val));
      }
    });
  }
  
  if (effect.inventory) {
    Object.entries(effect.inventory).forEach(([key, val]) => {
      if (val) {
        const item = ITEMS[key as ItemId];
        if (val > 0) {
          messages.push(LOG_TEMPLATES.ITEM.GET(item.name));
        } else {
          messages.push(LOG_TEMPLATES.ITEM.LOSE(item.name));
        }
      }
    });
  }
  
  if (effect.money) {
    messages.push(LOG_TEMPLATES.PARAM.MONEY(effect.money));
  }

  return messages;
};

/**
 * アイテムの説明用文字列を生成する
 * (UI表示用: "HP+10, SAN-5" 形式)
 */
export const getItemEffectDescription = (item: Item): string => {
  const parts: string[] = [];
  
  if (item.specialEffectDescription) {
    parts.push(item.specialEffectDescription);
  }

  if (item.effects) {
    const { effects } = item;
    if (effects.hp) parts.push(LOG_TEMPLATES.PARAM.HP(effects.hp));
    if (effects.sanity) parts.push(LOG_TEMPLATES.PARAM.SAN(effects.sanity));
    if (effects.caffeine) parts.push(LOG_TEMPLATES.PARAM.CAFFEINE(effects.caffeine));
    if (effects.satiety) parts.push(LOG_TEMPLATES.PARAM.SATIETY(effects.satiety));
    
    if (effects.knowledge) {
      Object.entries(effects.knowledge).forEach(([key, val]) => {
        if (typeof val === 'number') {
          const subjectName = SUBJECTS[key as SubjectId]?.name || key;
          parts.push(LOG_TEMPLATES.PARAM.KNOWLEDGE(subjectName, val));
        }
      });
    }
    
    if (effects.buffs && effects.buffs.length > 0) {
      effects.buffs.forEach(buff => {
        parts.push(LOG_TEMPLATES.BUFF.DURATION(buff.description, buff.duration));
      });
    }
  }

  return parts.join(', ');
};

/**
 * アイテムの短縮ステータス文字列を生成する (ボタン/リスト表示用)
 * 例: "HP+10 SAN-5 CFN+50"
 */
export const getShortEffectString = (item: Item): string => {
  if (!item.effects) {
    return item.specialEffectDescription ? "SPECIAL" : "";
  }
  
  const { effects } = item;
  const parts: string[] = [];
  
  if (effects.hp) parts.push(`HP${effects.hp > 0 ? '+' : ''}${effects.hp}`);
  if (effects.sanity) parts.push(`SAN${effects.sanity > 0 ? '+' : ''}${effects.sanity}`);
  if (effects.caffeine) parts.push(`CFN${effects.caffeine > 0 ? '+' : ''}${effects.caffeine}`);
  if (effects.satiety) parts.push(`満腹${effects.satiety > 0 ? '+' : ''}${effects.satiety}`);
  
  // バフがある場合は簡易表示
  if (effects.buffs && effects.buffs.length > 0) {
    parts.push("BUFF");
  }

  // ステータス変動がなく、特殊効果のみの場合
  if (parts.length === 0 && item.specialEffectDescription) {
     return "SPECIAL";
  }
  
  return parts.join(' ');
};

/**
 * 複数のメッセージを結合する
 */
export const joinMessages = (messages: (string | null)[], delimiter: string = ', '): string => {
  return messages.filter(msg => msg !== null && msg !== '').join(delimiter);
};

/** 確率表示用フォーマッタ (例: "成功率: 50%") */
export const formatSuccessRate = (rate: number): string => `成功率: ${Math.round(rate)}%`;
