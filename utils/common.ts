
import { Item } from '../types';
// Re-export from logFormatter for backward compatibility if needed, 
// but ideally we should update consumers.
export { getItemEffectDescription, joinMessages } from './logFormatter';

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
 * Applies a soft cap function to a multiplier.
 * As x increases, the result asymptotically approaches (1 + asymptote).
 * Formula: f(x) = 1 + (x-1) / (1 + (x-1)/k) where k is asymptote.
 */
export const applySoftCap = (currentMult: number, asymptote: number): number => {
  if (currentMult <= 1.0) return currentMult;
  const excess = currentMult - 1;
  return 1 + (excess / (1 + (excess / asymptote)));
};

/**
 * Formats a delta value into a string (e.g., "HP+10", "SAN-5").
 * @deprecated Use utils/logFormatter.ts instead
 */
export const formatDelta = (label: string, delta: number): string | null => {
  if (delta === 0) return null;
  const sign = delta > 0 ? '+' : '';
  return `${label}${sign}${delta}`;
};
