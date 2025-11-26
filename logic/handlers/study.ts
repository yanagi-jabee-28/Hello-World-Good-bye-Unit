
import { GameState, SubjectId, TimeSlot, LogEntry, RelationshipId } from '../../types';
import { SUBJECTS } from '../../data/subjects';
import { ACTION_LOGS, LOG_TEMPLATES } from '../../data/constants/logMessages';
import { clamp, applySoftCap } from '../../utils/common';
import { joinMessages } from '../../utils/logFormatter';
import { pushLog } from '../stateHelpers';
import { CAFFEINE_THRESHOLDS, BUFF_SOFT_CAP_ASYMPTOTE } from '../../config/gameConstants';

/**
 * 日数進行による難易度係数を計算
 */
const getPressureMultiplier = (day: number): number => {
  if (day <= 3) return 1.0;
  if (day <= 5) return 1.1;
  return 1.25; 
};

export const handleStudy = (state: GameState, subjectId: SubjectId): GameState => {
  const subject = SUBJECTS[subjectId];
  const currentScore = state.knowledge[subjectId];
  const pressure = getPressureMultiplier(state.day);
  
  let rawEfficiency = 1.1;
  let hpCost = Math.floor(10 * pressure); 
  let sanityCost = Math.floor(10 * pressure);
  
  let baseLog = "";
  let logType: LogEntry['type'] = 'info';
  let profRelDelta = 0;

  switch (state.timeSlot) {
    case TimeSlot.MORNING:
      rawEfficiency *= 1.2;
      baseLog = ACTION_LOGS.STUDY.MORNING_BONUS(subject.name);
      break;

    case TimeSlot.AM:
      rawEfficiency *= 1.0;
      profRelDelta = 5; 
      if (state.caffeine >= CAFFEINE_THRESHOLDS.AWAKE && state.caffeine < CAFFEINE_THRESHOLDS.TOXICITY) {
          profRelDelta += 3;
          baseLog = ACTION_LOGS.STUDY.AM_FOCUSED(subject.name);
      } else {
          baseLog = ACTION_LOGS.STUDY.AM_NORMAL(subject.name);
      }
      break;

    case TimeSlot.NOON:
      if (state.caffeine >= CAFFEINE_THRESHOLDS.AWAKE) {
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
      baseLog = ACTION_LOGS.STUDY.LATE_NIGHT_ZONE(subject.name);
      logType = 'warning'; 
      break;
  }

  // --- Caffeine Effects ---
  if (state.caffeine >= CAFFEINE_THRESHOLDS.TOXICITY) {
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
  if (state.sanity < 30) {
    rawEfficiency *= 1.3; 
    hpCost += 10; 
    baseLog += ACTION_LOGS.STUDY.MADNESS;
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
  
  let progressionMultiplier = 1.0;
  if (currentScore < 40) progressionMultiplier = 1.3;
  else if (currentScore < 70) progressionMultiplier = 1.0;
  else if (currentScore < 90) progressionMultiplier = 0.7;
  else progressionMultiplier = 0.4;

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
    LOG_TEMPLATES.PARAM.KNOWLEDGE(SUBJECTS[subjectId].name, knowledgeGain),
    LOG_TEMPLATES.PARAM.HP(-hpCost),
    LOG_TEMPLATES.PARAM.SAN(-sanityCost),
    profRelDelta !== 0 ? LOG_TEMPLATES.PARAM.RELATIONSHIP('教授友好度', profRelDelta) : null,
  ], ', ');

  pushLog(state, `${baseLog}\n(${details})`, logType);
  return state;
};
