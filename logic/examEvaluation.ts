
import { GameState, SubjectId } from "../types";
import { SUBJECTS } from "../data/subjects";

/**
 * 試験最終判定システム
 */

export interface ExamMetrics {
  // 基礎スコア (学習値から算出)
  rawKnowledge: Record<SubjectId, number>;
  baseScore: number;
  
  // 当日コンディション係数
  physicalCondition: number;    // HP比率ベース (0.5 ~ 1.2)
  mentalStability: number;      // SAN比率ベース (0.6 ~ 1.15)
  sleepQuality: number;          // 前夜の睡眠状態 (0.7 ~ 1.0)
  caffeineJitter: number;        // カフェイン過剰ペナルティ (0.85 ~ 1.0)
  
  // 人脈補正
  professorBonus: number;        // 教授友好度 → 重点範囲リーク (1.0 ~ 1.2)
  seniorLeakBonus: number;       // 過去問効果 (1.0 ~ 1.3+)
  
  // 狂気システム
  madnessStack: number;          // 累積精神負荷
  focusSpike?: SubjectId;        // 異常集中対象科目
  
  // 最終スコア
  conditionMultiplier: number;   // 上記係数の積
  finalScore: number;
  passed: boolean;
  rank: 'S' | 'A' | 'B' | 'C' | 'F';
}

export interface ExamThresholds {
  pass: number;      // 合格最低点
  rankB: number;     // B評価
  rankA: number;     // A評価
  rankS: number;     // S評価（周回ボーナス）
}

const DEFAULT_THRESHOLDS: ExamThresholds = {
  pass: 900,   // Increased: 800 -> 900 (Requires ~75% avg + bonuses)
  rankB: 1200, // 1000 -> 1200
  rankA: 1500, // 1250 -> 1500
  rankS: 1800  // 1500 -> 1800 (Near perfection required)
};

export function evaluateExam(
  state: GameState, 
  thresholds: ExamThresholds = DEFAULT_THRESHOLDS
): ExamMetrics {
  
  // === 1. 基礎学習スコア算出 ===
  const rawKnowledge: Record<SubjectId, number> = {} as any;
  let baseScore = 0;
  
  Object.values(SUBJECTS).forEach(subject => {
    // 難易度で指数スケーリング
    const learned = state.knowledge[subject.id] || 0;
    // スコア計算式調整: リニアに近い形に戻し、努力が反映されやすくする
    // 以前: Math.pow(learned, 0.88) -> 高得点ほど伸び悩みすぎる
    // 修正: Math.pow(learned, 0.95)
    const score = Math.pow(learned, 0.95) * subject.difficulty * 7; // Multiplier tweaked
    rawKnowledge[subject.id] = score;
    baseScore += score;
  });

  // === 2. コンディション係数計算 ===
  
  // 2.1 身体状態 (HP)
  const hpRatio = Math.max(0, state.hp / state.maxHp);
  let physicalCondition: number;
  if (hpRatio > 0.8) {
    physicalCondition = 1.1; // 万全
  } else if (hpRatio > 0.3) {
    physicalCondition = 1.0; // 通常
  } else {
    // 疲労困憊
    physicalCondition = 0.7 + hpRatio; // 0.7 ~ 1.0
  }

  // 2.2 精神安定性 (SAN)
  const sanRatio = Math.max(0, state.sanity / state.maxSanity);
  let mentalStability: number;
  if (sanRatio < 0.2) {
    // パニック状態
    mentalStability = 0.7;
  } else if (sanRatio < 0.5) {
    mentalStability = 0.9;
  } else {
    mentalStability = 1.0 + (sanRatio - 0.5) * 0.2; // 最大1.1
  }

  // 2.3 睡眠品質 (ここを厳しくする)
  const sleepDebt = state.flags.sleepDebt || 0;
  const lastSleepQuality = state.flags.lastSleepQuality || 0.8;
  let sleepQuality: number;
  
  if (sleepDebt > 3) {
    // 徹夜続き: 思考力半減
    sleepQuality = 0.6; 
  } else if (sleepDebt > 1.5) {
    // 寝不足
    sleepQuality = 0.85;
  } else {
    sleepQuality = lastSleepQuality;
  }

  // 2.4 カフェイン離脱/過剰
  const caffeine = state.caffeine;
  let caffeineJitter: number;
  if (caffeine > 120) {
    // 過剰摂取: 落ち着きがない
    caffeineJitter = 0.9;
  } else if (caffeine < 20 && state.flags.caffeineDependent) {
    // 離脱症状: 頭痛
    caffeineJitter = 0.8;
  } else {
    caffeineJitter = 1.0;
  }

  // === 3. 人脈補正 ===
  const profRel = Object.values(state.relationships)[0] || 0; // PROFESSOR
  const professorBonus = 1.0 + Math.min(0.15, profRel / 600); // 最大1.15倍 (少しマイルドに)

  const seniorRel = Object.values(state.relationships)[1] || 0; // SENIOR
  
  // Changed: Scale bonus based on number of past papers
  const papersCount = state.flags.hasPastPapers || 0;
  let seniorLeakBonus = 1.0;
  
  if (papersCount > 0) {
    // Base 1.10 for first paper, then small increments
    seniorLeakBonus = 1.10 + (papersCount - 1) * 0.05;
    // Cap at reasonable max (e.g., 1.3x)
    seniorLeakBonus = Math.min(1.3, seniorLeakBonus);
  } else {
    // Slight bonus for relationship if no papers
    seniorLeakBonus = 1.0 + Math.min(0.05, seniorRel / 1000);
  }

  // === 4. 狂気システム ===
  const madnessStack = state.flags.madnessStack || 0;
  let focusSpike: SubjectId | undefined;
  
  if (madnessStack >= 3) { // スタック3で発動しやすくする
    const weakestSubject = (Object.keys(rawKnowledge) as SubjectId[])
      .sort((a, b) => rawKnowledge[a] - rawKnowledge[b])[0];
    
    focusSpike = weakestSubject;
    // 弱点科目を強制的にブーストするが、全体へのデバフがかかる
    rawKnowledge[weakestSubject] *= 1.3;
    
    (Object.keys(rawKnowledge) as SubjectId[])
      .filter(id => id !== weakestSubject)
      .forEach(id => rawKnowledge[id] *= 0.9);
    
    // 再集計
    baseScore = Object.values(rawKnowledge).reduce((a, b) => a + b, 0);
  }

  // === 5. 最終スコア算出 ===
  let socialMultiplier = professorBonus * seniorLeakBonus;
  
  const conditionMultiplier = 
    physicalCondition * 
    mentalStability * 
    sleepQuality * 
    caffeineJitter *
    socialMultiplier;

  const finalScore = baseScore * conditionMultiplier;

  // === 6. ランク判定 ===
  let passed = false;
  let rank: 'S' | 'A' | 'B' | 'C' | 'F';
  
  if (finalScore >= thresholds.rankS) {
    rank = 'S';
    passed = true;
  } else if (finalScore >= thresholds.rankA) {
    rank = 'A';
    passed = true;
  } else if (finalScore >= thresholds.rankB) {
    rank = 'B';
    passed = true;
  } else if (finalScore >= thresholds.pass) {
    rank = 'C';
    passed = true;
  } else {
    rank = 'F';
    passed = false;
  }

  return {
    rawKnowledge,
    baseScore,
    physicalCondition,
    mentalStability,
    sleepQuality,
    caffeineJitter,
    professorBonus,
    seniorLeakBonus,
    madnessStack,
    focusSpike,
    conditionMultiplier,
    finalScore,
    passed,
    rank
  };
}
