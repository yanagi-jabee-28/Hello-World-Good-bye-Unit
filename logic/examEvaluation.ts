
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
  professorBonus: number;        // 教授友好度 → 重点範囲リーク (1.0 ~ 1.25)
  seniorLeakBonus: number;       // 過去問効果 (1.0 ~ 1.15)
  
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
  pass: 850,
  rankB: 1000,
  rankA: 1200,
  rankS: 1400
};

export function evaluateExam(
  state: GameState, 
  thresholds: ExamThresholds = DEFAULT_THRESHOLDS
): ExamMetrics {
  
  // === 1. 基礎学習スコア算出 ===
  const rawKnowledge: Record<SubjectId, number> = {} as any;
  let baseScore = 0;
  
  Object.values(SUBJECTS).forEach(subject => {
    // 難易度で指数スケーリング（難しい科目ほど高得点）
    const learned = state.knowledge[subject.id] || 0;
    // スコア計算式調整: 学習度100で約400点前後を目指す (4科目1600点満点)
    const score = Math.pow(learned, 0.88) * subject.difficulty * 8;
    rawKnowledge[subject.id] = score;
    baseScore += score;
  });

  // === 2. コンディション係数計算 ===
  
  // 2.1 身体状態 (HP)
  const hpRatio = Math.max(0, state.hp / state.maxHp);
  let physicalCondition: number;
  if (hpRatio > 0.7) {
    physicalCondition = 1.0 + (hpRatio - 0.7) * 0.67; // 最大1.2倍
  } else if (hpRatio > 0.4) {
    physicalCondition = 0.85 + (hpRatio - 0.4) * 0.5; // 0.85 ~ 1.0
  } else {
    // 致命的疲労: 集中力崩壊
    physicalCondition = 0.5 + hpRatio * 0.875; // 0.5 ~ 0.85
  }

  // 2.2 精神安定性 (SAN)
  const sanRatio = Math.max(0, state.sanity / state.maxSanity);
  let mentalStability: number;
  if (sanRatio < 0.25) {
    // パニック状態: 思考停止
    mentalStability = 0.6;
  } else if (sanRatio < 0.5) {
    mentalStability = 0.75 + (sanRatio - 0.25) * 0.4; // 0.75 ~ 0.85
  } else {
    mentalStability = 0.85 + (sanRatio - 0.5) * 0.6; // 0.85 ~ 1.15
  }

  // 2.3 睡眠品質
  const sleepDebt = state.flags.sleepDebt || 0;
  const lastSleepQuality = state.flags.lastSleepQuality || 0.8;
  let sleepQuality: number;
  
  if (sleepDebt > 2) {
    // 慢性的睡眠不足: 認知機能低下
    sleepQuality = Math.max(0.7, lastSleepQuality - sleepDebt * 0.05);
  } else {
    sleepQuality = lastSleepQuality;
  }

  // 2.4 カフェイン離脱/過剰
  const caffeine = state.caffeine;
  let caffeineJitter: number;
  if (caffeine > 150) {
    // 過剰摂取: 手の震え、集中力散漫
    caffeineJitter = Math.max(0.85, 1.0 - (caffeine - 150) * 0.001);
  } else if (caffeine < 20 && state.flags.caffeineDependent) {
    // 離脱症状: 頭痛、倦怠感
    caffeineJitter = 0.92;
  } else {
    caffeineJitter = 1.0;
  }

  // === 3. 人脈補正 ===
  // relationship value is 0-100
  const profRel = Object.values(state.relationships)[0] || 0; // PROFESSOR
  const professorBonus = 1.0 + Math.min(0.25, profRel / 400); // 最大1.25倍 (100/400 = 0.25)

  const seniorRel = Object.values(state.relationships)[1] || 0; // SENIOR
  const hasPastPapers = state.flags.hasPastPapers || false;
  const seniorLeakBonus = hasPastPapers ? 1.15 : (1.0 + Math.min(0.08, seniorRel / 500));

  // === 4. 狂気システム ===
  const madnessStack = state.flags.madnessStack || 0;
  let focusSpike: SubjectId | undefined;
  
  if (madnessStack >= 4) {
    // 異常集中発動: 1科目のみ+40%、他-15%
    // 学習度が一番低い科目をブースト（狂気の執着）
    const weakestSubject = (Object.keys(rawKnowledge) as SubjectId[])
      .sort((a, b) => rawKnowledge[a] - rawKnowledge[b])[0];
    
    focusSpike = weakestSubject;
    rawKnowledge[weakestSubject] *= 1.40;
    
    (Object.keys(rawKnowledge) as SubjectId[])
      .filter(id => id !== weakestSubject)
      .forEach(id => rawKnowledge[id] *= 0.85);
    
    // 再集計
    baseScore = Object.values(rawKnowledge).reduce((a, b) => a + b, 0);
  }

  // === 5. 最終スコア算出 ===
  const conditionMultiplier = 
    physicalCondition * 
    mentalStability * 
    sleepQuality * 
    caffeineJitter *
    professorBonus *
    seniorLeakBonus;

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
