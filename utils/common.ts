
import { Item } from '../types';

/**
 * Clamps a number between a minimum and maximum value.
 */
export const clamp = (num: number, min: number, max: number): number => 
  Math.min(Math.max(num, min), max);

/**
 * Returns true based on a percentage probability.
 */
export const chance = (percentage: number): boolean => 
  Math.random() * 100 < percentage;

/**
 * Formats a delta value into a string (e.g., "HP+10", "SAN-5").
 * Returns null if delta is 0.
 */
export const formatDelta = (label: string, delta: number): string | null => {
  if (delta === 0) return null;
  const sign = delta > 0 ? '+' : '';
  return `${label}${sign}${delta}`;
};

/**
 * Joins non-null strings with a delimiter (default: space).
 */
export const joinMessages = (messages: (string | null)[], delimiter: string = ' '): string => {
  return messages.filter(msg => msg !== null).join(delimiter);
};

/**
 * Generates a description string from an item's effect data.
 */
export const getItemEffectDescription = (item: Item): string => {
  const parts: string[] = [];
  
  if (item.specialEffectDescription) {
    parts.push(item.specialEffectDescription);
  }

  if (item.effects) {
    const { effects } = item;
    if (effects.hp) parts.push(formatDelta('HP', effects.hp) || '');
    if (effects.sanity) parts.push(formatDelta('SAN', effects.sanity) || '');
    if (effects.caffeine) parts.push(formatDelta('カフェイン', effects.caffeine) || '');
    // Item effects usually boost ALL subjects, so clarify that.
    if (effects.knowledge) parts.push(formatDelta('全学力', effects.knowledge) || '');
    
    if (effects.buffs && effects.buffs.length > 0) {
      effects.buffs.forEach(buff => {
        parts.push(`${buff.description}(${buff.duration}T)`);
      });
    }
  }

  return parts.filter(s => s !== '').join(', ');
};
