
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
