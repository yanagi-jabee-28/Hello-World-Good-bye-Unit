
import { Draft } from 'immer';
import { GameState, SubjectId, TimeSlot, LogEntry, RelationshipId, GameEventEffect } from '../../types';
import { SUBJECTS } from '../../data/subjects';
import { ACTION_LOGS } from '../../data/constants/logMessages';
import { applySoftCap } from '../../utils/common';
import { joinMessages } from '../../utils/logFormatter';
import { pushLog } from '../stateHelpers';
import { CAFFEINE_THRESHOLDS, BUFF_SOFT_CAP_ASYMPTOTE, SATIETY_CONSUMPTION, STUDY_CONSTANTS, STUDY_ALL } from '../../config/gameConstants';
import { applyEffect } from '../effectProcessor';
import { KNOWLEDGE_THRESHOLDS, LEARNING_EFFICIENCY } from '../../config/gameBalance';
import { rng } from '../../utils/rng';

const getPressureMultiplier = (day: number): number => {
  if (day <= 3) return 1.0;
  if (day <= 5) return 1.1;
  return 1.25; 
};

export const calculatePastPaperBonus = (count: number): number => {
  if (count <= 0) return 1.0;
  let bonus = 0;
  for (let i = 1; i <= count; i++) {
    const add = i < STUDY_CONSTANTS.PAST_PAPER_BONUS_TABLE.length 
      ? STUDY_CONSTANTS.PAST_PAPER_BONUS_TABLE[i] 
      : 0.01;
    bonus += add;
  }
  return 1.0 + bonus;
};

export const handleStudy = (draft: Draft<GameState>, subjectId: SubjectId): void => {
  const subject = SUBJECTS[subjectId];
  const currentScore = draft.knowledge[subjectId];
  const pressure = getPressureMultiplier(draft.day);
  
  let rawEfficiency = 1.1;
  let hpCost = Math.floor(10 * pressure); 
  let sanityCost = Math.floor(10 * pressure);
  let satietyCost = SATIETY_CONSUMPTION.STUDY;
  
  let baseLog = "";
  let logType: LogEntry['type'] = 'info';
  const effect: GameEventEffect = {
    relationships: {},
    knowledge: {}
  };

  // --- Time Slot Effects ---
  switch (draft.timeSlot) {
    case TimeSlot.MORNING:
      rawEfficiency *= 1.2;
      baseLog = ACTION_LOGS.STUDY.MORNING_BONUS(subject.name);
      break;

    case TimeSlot.AM:
      rawEfficiency *= 1.0;
      effect.relationships![RelationshipId.PROFESSOR] = 5;
      if (draft.caffeine >= CAFFEINE_THRESHOLDS.AWAKE && draft.caffeine < CAFFEINE_THRESHOLDS.TOXICITY) {
          effect.relationships![RelationshipId.PROFESSOR] += 3;
          baseLog = ACTION_LOGS.STUDY.AM_FOCUSED(subject.name);
      } else {
          baseLog = ACTION_LOGS.STUDY.AM_NORMAL(subject.name);
      }
      break;

    case TimeSlot.NOON:
      if (draft.caffeine >= CAFFEINE_THRESHOLDS.AWAKE) {
        rawEfficiency *= 1.1;
        baseLog = ACTION_LOGS.STUDY.NOON_AWAKE(subject.name);
      } else {
        rawEfficiency *= 0.8; 
        baseLog = ACTION_LOGS.STUDY.NOON_DROWSY(subject.name);
      }
      break;

    case TimeSlot.AFTERNOON:
      rawEfficiency *= 0.95; 
      hpCost += 2; 
      effect.relationships![RelationshipId.PROFESSOR] = 3;
      baseLog = ACTION_LOGS.STUDY.AFTERNOON_FIGHT(subject.name);
      break;

    case TimeSlot.AFTER_SCHOOL:
      rawEfficiency *= 1.25;
      baseLog = ACTION_LOGS.STUDY.AFTER_SCHOOL_FOCUS(subject.name);
      break;

    case TimeSlot.NIGHT:
      rawEfficiency *= 0.9;
      hpCost += 5; 
      baseLog = ACTION_LOGS.STUDY.NIGHT_TIRED(subject.name);
      break;

    case TimeSlot.LATE_NIGHT:
      rawEfficiency *= 1.5; 
      sanityCost += 20;
      hpCost += 10;
      satietyCost = Math.floor(satietyCost * SATIETY_CONSUMPTION.LATE_NIGHT_MULT);
      baseLog = ACTION_LOGS.STUDY.LATE_NIGHT_ZONE(subject.name);
      logType = 'warning'; 
      break;
  }

  if (draft.satiety >= 85) { // STUFFED
    rawEfficiency *= 0.9;
    baseLog += ACTION_LOGS.STUDY.STUFFED;
  }

  // Caffeine
  if (draft.caffeine >= CAFFEINE_THRESHOLDS.TOXICITY) {
    rawEfficiency *= 2.0;
    hpCost += 15; 
    sanityCost += 15; 
    satietyCost = Math.floor(satietyCost * 2.0);
    baseLog += " (中毒状態: 限界突破)";
    logType = 'danger';
  } else if (draft.caffeine >= CAFFEINE_THRESHOLDS.ZONE) {
    rawEfficiency *= 1.5;
    hpCost += 5; 
    sanityCost += 5; 
    satietyCost = Math.floor(satietyCost * 1.3);
    baseLog += " (ZONE状態: 高負荷・高効率)";
    logType = 'success';
  } else if (draft.caffeine >= CAFFEINE_THRESHOLDS.AWAKE) {
    rawEfficiency *= 1.2;
    baseLog += " (覚醒状態)";
  }

  // Madness
  if (draft.sanity < STUDY_CONSTANTS.MADNESS_THRESHOLD) {
    rawEfficiency *= STUDY_CONSTANTS.MADNESS_EFFICIENCY_BONUS; 
    hpCost += STUDY_CONSTANTS.MADNESS_HP_COST; 
    baseLog += ACTION_LOGS.STUDY.MADNESS;
  }

  // Past Papers
  if ((draft.flags.hasPastPapers || 0) > 0) {
    const paperBonus = calculatePastPaperBonus(draft.flags.hasPastPapers);
    rawEfficiency *= paperBonus;
    baseLog += ` [過去問効果 x${paperBonus.toFixed(2)}]`;
  }

  // Buffs
  const studyBuffs = draft.activeBuffs.filter(b => b.type === 'STUDY_EFFICIENCY');
  if (studyBuffs.length > 0) {
    const buffMultiplier = studyBuffs.reduce((acc, b) => acc * b.value, 1.0);
    rawEfficiency *= buffMultiplier;
    baseLog += ` [アイテム効果 x${buffMultiplier.toFixed(1)}]`;
  }

  const finalEfficiency = applySoftCap(rawEfficiency, BUFF_SOFT_CAP_ASYMPTOTE);
  
  let progressionMultiplier = 1.0;
  if (currentScore < KNOWLEDGE_THRESHOLDS.PASSING_LINE) progressionMultiplier = 1.5;
  else if (currentScore < 80) progressionMultiplier = 0.8;
  else if (currentScore < 90) progressionMultiplier = 0.5;
  else progressionMultiplier = 0.2;

  let knowledgeGain = Math.floor(12 * finalEfficiency * subject.difficulty * progressionMultiplier);
  if (knowledgeGain < 1) knowledgeGain = 1;

  effect.hp = -hpCost;
  effect.sanity = -sanityCost;
  effect.satiety = -satietyCost;
  effect.knowledge![subjectId] = knowledgeGain;

  // Immer: mutate draft directly via applyEffect
  const messages = applyEffect(draft, effect);
  
  draft.lastStudied[subjectId] = draft.turnCount;

  const details = joinMessages(messages, ', ');
  pushLog(draft, `${baseLog}\n(${details})`, logType);
};

/**
 * 総合演習ハンドラ
 * 全科目を少しずつ上げる。過去問やカフェインの効果も適用するが、個別学習よりはマイルドにする。
 */
export const handleStudyAll = (draft: Draft<GameState>): void => {
  // 1. 時間帯チェック
  if (draft.timeSlot === TimeSlot.AM || draft.timeSlot === TimeSlot.AFTERNOON) {
    pushLog(draft, "【エラー】授業中に全科目の復習はできない。教授の目が光っている。", 'warning');
    return;
  }

  // 2. 深夜補正 & 基本設定
  const isLateNight = draft.timeSlot === TimeSlot.LATE_NIGHT;
  const timeMult = isLateNight ? STUDY_ALL.LATE_NIGHT_EFFICIENCY : 1.0;
  const costMult = isLateNight ? STUDY_ALL.LATE_NIGHT_COST_MULT : 1.0;

  // 3. 平均スコアによる減衰
  const subjects = Object.values(SubjectId);
  const totalScore = subjects.reduce((sum, id) => sum + draft.knowledge[id], 0);
  const avg = totalScore / subjects.length;
  const decayMult = STUDY_ALL.gainMultiplier(avg);

  // 4. 効率計算
  let rawEfficiency = 1.0;
  let logDetails = "";

  // カフェイン補正 (handleStudyと整合性を取る)
  let caffeineHpCost = 0;
  let caffeineSanCost = 0;
  let caffeineSatietyMult = 1.0;

  if (draft.caffeine >= CAFFEINE_THRESHOLDS.TOXICITY) {
    rawEfficiency *= 2.0;
    caffeineHpCost = 15;
    caffeineSanCost = 15;
    caffeineSatietyMult = 2.0;
    logDetails += " (中毒: 限界突破)";
  } else if (draft.caffeine >= CAFFEINE_THRESHOLDS.ZONE) {
    rawEfficiency *= 1.5;
    caffeineHpCost = 5;
    caffeineSanCost = 5;
    caffeineSatietyMult = 1.3;
    logDetails += " (ZONE)";
  } else if (draft.caffeine >= CAFFEINE_THRESHOLDS.AWAKE) {
    rawEfficiency *= 1.2;
    logDetails += " (覚醒)";
  }

  // 過去問ボーナス (新規追加)
  // 総合演習なので効果係数を少し抑える (x0.8)
  if ((draft.flags.hasPastPapers || 0) > 0) {
    const paperBonus = calculatePastPaperBonus(draft.flags.hasPastPapers);
    const effectiveBonus = 1.0 + (paperBonus - 1.0) * 0.8; 
    rawEfficiency *= effectiveBonus;
    logDetails += ` [過去問 x${effectiveBonus.toFixed(2)}]`;
  }

  // バフ効果
  // 総合演習はアイテムバフの効果が減衰する (x0.5)
  const studyBuffs = draft.activeBuffs.filter(b => b.type === 'STUDY_EFFICIENCY');
  if (studyBuffs.length > 0) {
    const rawBuff = studyBuffs.reduce((acc, b) => acc * b.value, 1.0);
    const effectiveBuff = 1 + ((rawBuff - 1) * LEARNING_EFFICIENCY.COMPREHENSIVE.BUFF_EFFECTIVENESS);
    rawEfficiency *= effectiveBuff;
    logDetails += ` [アイテム(拡散) x${effectiveBuff.toFixed(2)}]`;
  }

  // 狂気ボーナス
  let madnessMult = 1.0;
  let madnessHpCost = 0;
  
  if (draft.sanity < STUDY_CONSTANTS.MADNESS_THRESHOLD) {
    madnessMult = STUDY_CONSTANTS.MADNESS_EFFICIENCY_BONUS;
    madnessHpCost = STUDY_CONSTANTS.MADNESS_HP_COST;
    logDetails += ACTION_LOGS.STUDY.MADNESS;
  }

  // 最終効率
  const finalEfficiency = applySoftCap(rawEfficiency, BUFF_SOFT_CAP_ASYMPTOTE) * timeMult * decayMult * madnessMult;

  // 5. 科目ごとの上昇値計算
  const knowledgeGain: Partial<Record<SubjectId, number>> = {};
  subjects.forEach(sid => {
    const difficulty = SUBJECTS[sid].difficulty;
    const rand = rng.range(-1, 1);
    let val = (STUDY_ALL.BASE_GAIN * finalEfficiency * difficulty) + rand;
    val = Math.max(Math.floor(val), STUDY_ALL.MIN_GAIN);
    knowledgeGain[sid] = val;
  });

  // 6. コスト計算 & 適用
  const effect = {
    hp: Math.floor((-STUDY_ALL.COST_HP * costMult) - caffeineHpCost - madnessHpCost),
    sanity: Math.floor((-STUDY_ALL.COST_SAN * costMult) - caffeineSanCost),
    satiety: Math.floor((-STUDY_ALL.COST_SATIETY * costMult * caffeineSatietyMult)),
    knowledge: knowledgeGain
  };

  const messages = applyEffect(draft, effect);
  
  // 全科目の最終学習ターン更新
  subjects.forEach(sid => {
    draft.lastStudied[sid] = draft.turnCount;
  });

  const details = joinMessages(messages, ', ');
  const nightLog = isLateNight ? "深夜の静寂で集中力が増したが、消耗も激しい。" : "";
  const logType = (isLateNight || draft.caffeine >= CAFFEINE_THRESHOLDS.TOXICITY) ? 'warning' : 'info';
  
  pushLog(draft, `【総合演習】全科目を薄く広く復習した。${nightLog}${logDetails}\n(${details})`, logType);
};
