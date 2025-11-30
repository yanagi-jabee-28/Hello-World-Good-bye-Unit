
export const RISK_CONFIG = {
  // HP Curve: Logistic function that spikes as HP gets critical
  hpCurve: {
    k: 10,        // Steepness
    x0: 0.25,     // Inflection point (25% HP)
    weight: 0.50, // Contribution weight
  },
  // Sleep Debt Curve: Linear penalty for accumulated debt
  sleepCurve: {
    k: 0.15,      // Multiplier per debt unit
    threshold: 1, // Debt above this starts adding risk
    weight: 0.20,
  },
  // Stress (100 - Sanity) Curve: Linear
  stressCurve: {
    k: 0.015,     // Multiplier per stress point
    weight: 0.20,
  },
  // Action Streak Curve: Linear up to a cap
  streakCurve: {
    k: 0.05,      // Risk per streak turn
    cap: 10,      // Max streak considered
    weight: 0.10,
  },
  // Base floor to ensure UI isn't completely empty
  safeFloor: 0.02, 
};
