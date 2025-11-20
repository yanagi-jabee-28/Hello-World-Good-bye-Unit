import { GameState, SubjectId, TimeSlot, LogEntry, RelationshipId } from '../../types';
import { SUBJECTS } from '../../data/subjects';
import { LOG_MESSAGES } from '../../data/events';
import { clamp, chance, formatDelta, joinMessages } from '../../utils/common';
import { pushLog } from '../stateHelpers';

export const handleStudy = (state: GameState, subjectId: SubjectId): GameState => {
  const subject = SUBJECTS[subjectId];
  const currentScore = state.knowledge[subjectId];
  
  let efficiency = 1.0;
  let hpCost = 15; // Base cost increased
  let sanityCost = 5;
  let baseLog = "";
  let logType: LogEntry['type'] = 'info';
  let profRelDelta = 0;
  let seniorRelDelta = 0;

  // Time Slot Effects
  if (state.timeSlot === TimeSlot.MORNING) {
    efficiency = 1.2;
    baseLog = LOG_MESSAGES.study_morning_bonus(subject.name);
  } else if (state.timeSlot === TimeSlot.AM) {
    profRelDelta = 2;
    baseLog = `【講義出席】${subject.name}の講義を真面目に受講した。`;
    logType = 'success';
  } else if (state.timeSlot === TimeSlot.NOON) {
    if (state.caffeine > 50) {
      baseLog = LOG_MESSAGES.study_caffeine_awake(subject.name);
    } else {
      efficiency = 0.6; // Punishment increased
      baseLog = LOG_MESSAGES.study_noon_drowsy(subject.name);
      logType = 'warning';
    }
  } else if (state.timeSlot === TimeSlot.AFTERNOON) {
    profRelDelta = 2;
    hpCost += 5;
    baseLog = LOG_MESSAGES.study_afternoon_fight(subject.name);
    logType = 'warning';
  } else if (state.timeSlot === TimeSlot.AFTER_SCHOOL) {
    efficiency = 1.3;
    baseLog = LOG_MESSAGES.study_after_school_focus(subject.name);
  } else if (state.timeSlot === TimeSlot.NIGHT) {
    efficiency = 0.9;
    baseLog = LOG_MESSAGES.study_night_tired(subject.name);
  } else if (state.timeSlot === TimeSlot.LATE_NIGHT) {
    seniorRelDelta = 1;
    if (chance(25 + (state.sanity / 3))) { // Chance depends on Sanity
       efficiency = 2.2;
       baseLog = LOG_MESSAGES.study_late_night_zone(subject.name);
       logType = 'success';
    } else {
       efficiency = 0.1;
       sanityCost = 20;
       baseLog = LOG_MESSAGES.study_late_night_fail(subject.name);
       logType = 'danger';
    }
  }

  // Caffeine Multipliers & Penalties
  if (state.caffeine >= 50 && state.caffeine < 100) {
    efficiency += 0.1; // Awake (x1.1)
  } else if (state.caffeine >= 100 && state.caffeine < 150) {
    efficiency += 0.3; // Zone (x1.3)
    hpCost += 5; // Metabolic stress
    sanityCost += 3;
    baseLog += " (カフェイン覚醒)";
  } else if (state.caffeine >= 150) {
    efficiency += 0.5; // Overdose (x1.5)
    hpCost += 15; // Severe stress
    sanityCost += 15;
    baseLog += `\n${LOG_MESSAGES.study_jitter}`;
    logType = 'danger';
    
    // Crash Risk
    if (chance(20)) {
      efficiency = 0;
      baseLog = "【カフェインクラッシュ】手が震えてペンが持てない。動悸が激しく、何も頭に入ってこない。";
    }
  }

  // Apply Buffs
  const studyBuffs = state.activeBuffs.filter(b => b.type === 'STUDY_EFFICIENCY');
  if (studyBuffs.length > 0) {
    const buffMultiplier = studyBuffs.reduce((acc, b) => acc * b.value, 1.0);
    efficiency *= buffMultiplier;
    baseLog += ` [ブースト x${buffMultiplier.toFixed(1)}]`;
  }

  // Diminishing Returns
  let progressionMultiplier = 1.0;
  if (currentScore < 40) {
    progressionMultiplier = 1.3; 
  } else if (currentScore < 60) {
    progressionMultiplier = 1.0;
  } else if (currentScore < 80) {
    progressionMultiplier = 0.7;
  } else {
    progressionMultiplier = 0.4;
  }

  let knowledgeGain = Math.floor(6 * efficiency * subject.difficulty * progressionMultiplier);
  if (knowledgeGain === 0 && efficiency > 0.5) knowledgeGain = 1;

  // Update State
  state.hp = clamp(state.hp - hpCost, 0, state.maxHp);
  state.sanity = clamp(state.sanity - sanityCost, 0, state.maxSanity);
  state.knowledge[subjectId] = clamp(state.knowledge[subjectId] + knowledgeGain, 0, 100);
  if (profRelDelta) state.relationships[RelationshipId.PROFESSOR] = clamp(state.relationships[RelationshipId.PROFESSOR] + profRelDelta, 0, 100);
  if (seniorRelDelta) state.relationships[RelationshipId.SENIOR] = clamp(state.relationships[RelationshipId.SENIOR] + seniorRelDelta, 0, 100);

  const details = joinMessages([
    formatDelta(SUBJECTS[subjectId].name, knowledgeGain),
    formatDelta('HP', -hpCost),
    formatDelta('SAN', -sanityCost),
    formatDelta('教授友好度', profRelDelta),
    formatDelta('先輩友好度', seniorRelDelta)
  ], ', ');

  pushLog(state, `${baseLog}\n(${details})`, logType);
  return state;
};