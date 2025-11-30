
import { RISK_CONFIG } from "../config/risk";

export interface RiskInput {
  hp: number;
  maxHp: number;
  sanity: number;
  maxSanity: number;
  sleepDebt: number;
  actionStreak: number;
}

export interface RiskBreakdown {
  hp: number;
  sleep: number;
  stress: number;
  streak: number;
  total: number;
}

const clamp01 = (v: number): number => Math.max(0, Math.min(1, v));

/**
 * Computes the current risk of "Game Over" based on vital statistics.
 * Pure function, deterministic.
 */
export const computeRisk = (input: RiskInput): RiskBreakdown => {
  const { hpCurve, sleepCurve, stressCurve, streakCurve, safeFloor } = RISK_CONFIG;

  // 1. HP Risk (Logistic)
  // Low HP drastically increases risk.
  const hpNormalized = Math.max(0, Math.min(1, input.hp / input.maxHp));
  // Invert normalized HP because lower is riskier
  // Logistic function: f(x) = L / (1 + e^(-k(x - x0)))
  // We map (1 - hp) to x.
  const hpRiskRaw = 1 / (1 + Math.exp(-hpCurve.k * ((1 - hpNormalized) - (1 - hpCurve.x0))));
  const hpScore = clamp01(hpRiskRaw) * hpCurve.weight;

  // 2. Sleep Risk (Linear past threshold)
  const sleepExcess = Math.max(0, input.sleepDebt - sleepCurve.threshold);
  const sleepScore = clamp01(sleepExcess * sleepCurve.k) * sleepCurve.weight;

  // 3. Stress Risk (Linear)
  // Stress = MaxSanity - Sanity
  const stress = Math.max(0, input.maxSanity - input.sanity);
  const stressScore = clamp01(stress * stressCurve.k) * stressCurve.weight;

  // 4. Streak Risk (Linear capped)
  const streakVal = Math.min(input.actionStreak, streakCurve.cap);
  const streakScore = clamp01(streakVal * streakCurve.k) * streakCurve.weight;

  // Total
  const totalRaw = hpScore + sleepScore + stressScore + streakScore;
  const total = clamp01(Math.max(totalRaw, safeFloor));

  return {
    hp: hpScore,
    sleep: sleepScore,
    stress: stressScore,
    streak: streakScore,
    total,
  };
};
