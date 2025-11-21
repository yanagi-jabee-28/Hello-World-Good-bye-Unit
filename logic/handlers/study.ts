
import { GameState, SubjectId, TimeSlot, LogEntry, RelationshipId } from '../../types';
import { SUBJECTS } from '../../data/subjects';
import { LOG_MESSAGES } from '../../data/events';
import { clamp, chance, formatDelta, joinMessages, applySoftCap } from '../../utils/common';
import { pushLog } from '../stateHelpers';
import { CAFFEINE_THRESHOLDS, BUFF_SOFT_CAP_ASYMPTOTE } from '../../config/gameConstants';

/**
 * 日数進行による難易度係数を計算
 * 上昇カーブを緩和し、終盤の事故率を低減
 */
const getPressureMultiplier = (day: number): number => {
  // Day 1-3: 1.0x (Standard)
  // Day 4-5: 1.1x (Slightly Hard)
  // Day 6-7: 1.15x (Hard but survivable) - was 1.25
  if (day <= 3) return 1.0;
  if (day <= 5) return 1.1;
  return 1.15; 
};

export const handleStudy = (state: GameState, subjectId: SubjectId): GameState => {
  const subject = SUBJECTS[subjectId];
  const currentScore = state.knowledge[subjectId];
  const pressure = getPressureMultiplier(state.day);
  
  // Base Stats
  let rawEfficiency = 1.0;
  // バランス調整: 学習コストのSAN消費を微調整
  let hpCost = Math.floor(10 * pressure); 
  let sanityCost = Math.floor(10 * pressure); // was 12 * pressure. Slightly reduced base cost.
  
  let baseLog = "";
  let logType: LogEntry['type'] = 'info';
  let profRelDelta = 0;

  // --- Time Slot Effects (Rebalanced for Stability) ---
  switch (state.timeSlot) {
    case TimeSlot.MORNING:
      // 朝: 冴えている (ボーナス)
      rawEfficiency *= 1.2;
      baseLog = LOG_MESSAGES.study_morning_bonus(subject.name);
      break;

    case TimeSlot.AM:
      // 午前: 講義 (安定 + 教授評価)
      rawEfficiency *= 1.0;
      // 授業に真面目に出席すると好感度が上がりやすく(基本+6)
      profRelDelta = 6; 
      
      if (state.caffeine >= CAFFEINE_THRESHOLDS.AWAKE && state.caffeine < CAFFEINE_THRESHOLDS.TOXICITY) {
          // 覚醒時はさらにボーナス(+4 -> 合計+10)
          profRelDelta += 4;
          baseLog = `【真面目な受講】カフェインのおかげで意識は明瞭。${subject.name}の最前列で猛烈にノートを取った。教授が満足げに頷いている。`;
      } else {
          baseLog = LOG_MESSAGES.study_am_normal(subject.name);
      }
      break;

    case TimeSlot.NOON:
      // 昼: 騒がしい (微デバフだが、カフェインで相殺可能)
      if (state.caffeine >= CAFFEINE_THRESHOLDS.AWAKE) {
        rawEfficiency *= 1.1; // 覚醒していれば逆に集中できる
        baseLog = LOG_MESSAGES.study_caffeine_awake(subject.name);
      } else {
        rawEfficiency *= 0.85; // 効率低下を緩和 (0.8 -> 0.85)
        baseLog = LOG_MESSAGES.study_noon_drowsy(subject.name);
      }
      break;

    case TimeSlot.AFTERNOON:
      // 午後: 眠気
      rawEfficiency *= 1.0; 
      hpCost += 2; // 少し体力を使いやすい
      baseLog = `【午後の演習】${subject.name}の課題に取り組む。眠気はあるが、手は動いている。`;
      break;

    case TimeSlot.AFTER_SCHOOL:
      // 放課後: 集中 (ボーナス)
      rawEfficiency *= 1.2;
      baseLog = LOG_MESSAGES.study_after_school_focus(subject.name);
      break;

    case TimeSlot.NIGHT:
      // 夜: 疲労 (微デバフ)
      rawEfficiency *= 0.9;
      hpCost += 5; // 疲労が溜まる
      baseLog = LOG_MESSAGES.study_night_tired(subject.name);
      break;

    case TimeSlot.LATE_NIGHT:
      // 深夜: ハイリスク・ハイリターン
      // 確実に高効率だが、SAN値コストが極めて高い
      rawEfficiency *= 1.4; 
      sanityCost += 12; // Added cost reduced (15 -> 12)
      baseLog = `【深夜の集中】静寂が思考を加速させる。SAN値を削って${subject.name}を脳に刻み込む。`;
      logType = 'warning'; // コストが高いことを警告
      break;
  }

  // --- Caffeine Effects ---
  if (state.caffeine >= CAFFEINE_THRESHOLDS.TOXICITY) {
    rawEfficiency *= 2.0;
    hpCost += 15; // 20 -> 15
    sanityCost += 10; // 15 -> 10
    baseLog += " (中毒状態: 限界突破)";
    logType = 'danger';
  } else if (state.caffeine >= CAFFEINE_THRESHOLDS.ZONE) {
    rawEfficiency *= 1.5;
    hpCost += 4; // 5 -> 4
    sanityCost += 4; // 5 -> 4
    baseLog += " (ZONE状態: 高負荷・高効率)";
    logType = 'success'; // ポジティブな強化
  } else if (state.caffeine >= CAFFEINE_THRESHOLDS.AWAKE) {
    rawEfficiency *= 1.2;
    baseLog += " (覚醒状態)";
  }

  // --- Madness Bonus ---
  // SAN値が低いと、効率は上がるがHPが減る (火事場の馬鹿力)
  if (state.sanity < 30) {
    rawEfficiency *= 1.3;
    hpCost += 8; // 10 -> 8
    baseLog += "\n【狂気】精神の摩耗と引き換えに、異常な集中力を発揮している。";
  }

  // Apply Buffs (Multiplicative)
  const studyBuffs = state.activeBuffs.filter(b => b.type === 'STUDY_EFFICIENCY');
  if (studyBuffs.length > 0) {
    const buffMultiplier = studyBuffs.reduce((acc, b) => acc * b.value, 1.0);
    rawEfficiency *= buffMultiplier;
    baseLog += ` [アイテム効果 x${buffMultiplier.toFixed(1)}]`;
  }

  // --- Apply Soft Cap ---
  // ここで最終的な倍率にソフトキャップを適用する
  const finalEfficiency = applySoftCap(rawEfficiency, BUFF_SOFT_CAP_ASYMPTOTE);
  
  if (finalEfficiency < rawEfficiency) {
     baseLog += ` (効率上限補正)`;
  }

  // Diminishing Returns (Score Saturation)
  let progressionMultiplier = 1.0;
  if (currentScore < 50) progressionMultiplier = 1.2; // 序盤は伸びやすい
  else if (currentScore < 70) progressionMultiplier = 1.0;
  else if (currentScore < 90) progressionMultiplier = 0.8;
  else progressionMultiplier = 0.5; // 90点以上は難しい

  // Final Calculation
  let knowledgeGain = Math.floor(10 * finalEfficiency * subject.difficulty * progressionMultiplier);
  if (knowledgeGain < 1) knowledgeGain = 1;

  // Update State
  state.hp = clamp(state.hp - hpCost, 0, state.maxHp);
  state.sanity = clamp(state.sanity - sanityCost, 0, state.maxSanity);
  state.knowledge[subjectId] = clamp(state.knowledge[subjectId] + knowledgeGain, 0, 100);
  
  if (profRelDelta) {
    state.relationships[RelationshipId.PROFESSOR] = clamp(state.relationships[RelationshipId.PROFESSOR] + profRelDelta, 0, 100);
  }

  const details = joinMessages([
    formatDelta(SUBJECTS[subjectId].name, knowledgeGain),
    formatDelta('HP', -hpCost),
    formatDelta('SAN', -sanityCost),
    formatDelta('教授友好度', profRelDelta),
  ], ', ');

  pushLog(state, `${baseLog}\n(${details})`, logType);
  return state;
};
