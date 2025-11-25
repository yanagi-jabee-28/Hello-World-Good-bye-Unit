
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
  // Day 6-7: 1.25x (Hard) - Panic sets in
  if (day <= 3) return 1.0;
  if (day <= 5) return 1.1;
  return 1.25; 
};

export const handleStudy = (state: GameState, subjectId: SubjectId): GameState => {
  const subject = SUBJECTS[subjectId];
  const currentScore = state.knowledge[subjectId];
  const pressure = getPressureMultiplier(state.day);
  
  // Base Stats
  let rawEfficiency = 1.1; // Base boosted slightly (1.0 -> 1.1) to make standard play viable
  
  // コストは日数経過（プレッシャー）で増加
  let hpCost = Math.floor(10 * pressure); 
  let sanityCost = Math.floor(10 * pressure);
  
  let baseLog = "";
  let logType: LogEntry['type'] = 'info';
  let profRelDelta = 0;

  // --- Time Slot Effects ---
  switch (state.timeSlot) {
    case TimeSlot.MORNING:
      // 朝: 冴えている (ボーナス)
      rawEfficiency *= 1.2;
      baseLog = LOG_MESSAGES.study_morning_bonus(subject.name);
      break;

    case TimeSlot.AM:
      // 午前: 講義 (安定 + 教授評価)
      rawEfficiency *= 1.0;
      profRelDelta = 5; 
      
      if (state.caffeine >= CAFFEINE_THRESHOLDS.AWAKE && state.caffeine < CAFFEINE_THRESHOLDS.TOXICITY) {
          profRelDelta += 3;
          baseLog = `【真面目な受講】カフェインのおかげで意識は明瞭。${subject.name}の最前列で猛烈にノートを取った。`;
      } else {
          baseLog = LOG_MESSAGES.study_am_normal(subject.name);
      }
      break;

    case TimeSlot.NOON:
      // 昼: 騒がしい
      if (state.caffeine >= CAFFEINE_THRESHOLDS.AWAKE) {
        rawEfficiency *= 1.1;
        baseLog = LOG_MESSAGES.study_caffeine_awake(subject.name);
      } else {
        rawEfficiency *= 0.8; 
        baseLog = LOG_MESSAGES.study_noon_drowsy(subject.name);
      }
      break;

    case TimeSlot.AFTERNOON:
      // 午後: 眠気
      rawEfficiency *= 0.95; 
      hpCost += 2; 
      baseLog = `【午後の演習】${subject.name}の課題に取り組む。食後の眠気と戦う。`;
      break;

    case TimeSlot.AFTER_SCHOOL:
      // 放課後: 集中 (ボーナス)
      rawEfficiency *= 1.25; // Slightly buffed
      baseLog = LOG_MESSAGES.study_after_school_focus(subject.name);
      break;

    case TimeSlot.NIGHT:
      // 夜: 疲労
      rawEfficiency *= 0.9;
      hpCost += 5; 
      baseLog = LOG_MESSAGES.study_night_tired(subject.name);
      break;

    case TimeSlot.LATE_NIGHT:
      // 深夜: ハイリスク・ハイリターン
      rawEfficiency *= 1.5; 
      sanityCost += 20; // Heavy SAN penalty (15 -> 20) to discourage spamming
      hpCost += 10;
      baseLog = `【深夜の集中】静寂が思考を加速させる。SAN値を削って${subject.name}を脳に刻み込む。`;
      logType = 'warning'; 
      break;
  }

  // --- Caffeine Effects ---
  if (state.caffeine >= CAFFEINE_THRESHOLDS.TOXICITY) {
    // 中毒状態は諸刃の剣。効率は凄まじいが、消耗も激しい
    rawEfficiency *= 2.0;
    hpCost += 15; 
    sanityCost += 15; 
    baseLog += " (中毒状態: 限界突破)";
    logType = 'danger';
  } else if (state.caffeine >= CAFFEINE_THRESHOLDS.ZONE) {
    rawEfficiency *= 1.5;
    hpCost += 5; 
    sanityCost += 5; 
    baseLog += " (ZONE状態: 高負荷・高効率)";
    logType = 'success';
  } else if (state.caffeine >= CAFFEINE_THRESHOLDS.AWAKE) {
    rawEfficiency *= 1.2;
    baseLog += " (覚醒状態)";
  }

  // --- Madness Bonus ---
  // SAN値が低いと火事場の馬鹿力が出るが、コントロールが効かない
  if (state.sanity < 30) {
    rawEfficiency *= 1.3; 
    hpCost += 10; 
    baseLog += "\n【狂気】精神の摩耗と引き換えに、異常な集中力を発揮している。";
  }

  // Apply Buffs
  const studyBuffs = state.activeBuffs.filter(b => b.type === 'STUDY_EFFICIENCY');
  if (studyBuffs.length > 0) {
    const buffMultiplier = studyBuffs.reduce((acc, b) => acc * b.value, 1.0);
    rawEfficiency *= buffMultiplier;
    baseLog += ` [アイテム効果 x${buffMultiplier.toFixed(1)}]`;
  }

  // --- Apply Soft Cap ---
  const finalEfficiency = applySoftCap(rawEfficiency, BUFF_SOFT_CAP_ASYMPTOTE);
  
  // Diminishing Returns (Score Saturation)
  // 90点までは伸びやすく、そこから先は厳しくする
  let progressionMultiplier = 1.0;
  if (currentScore < 40) progressionMultiplier = 1.3; // 初動ブースト
  else if (currentScore < 70) progressionMultiplier = 1.0;
  else if (currentScore < 90) progressionMultiplier = 0.7;
  else progressionMultiplier = 0.4; // 90点以上は極めて伸びにくい

  // Final Calculation
  // 難易度が高い科目ほど伸びにくい
  let knowledgeGain = Math.floor(12 * finalEfficiency * subject.difficulty * progressionMultiplier);
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
