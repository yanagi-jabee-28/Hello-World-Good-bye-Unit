
import { GameState, SubjectId, TimeSlot, LogEntry, RelationshipId } from '../../types';
import { SUBJECTS } from '../../data/subjects';
import { LOG_MESSAGES } from '../../data/events';
import { clamp, chance, formatDelta, joinMessages } from '../../utils/common';
import { pushLog } from '../stateHelpers';

export const handleStudy = (state: GameState, subjectId: SubjectId): GameState => {
  const subject = SUBJECTS[subjectId];
  const currentScore = state.knowledge[subjectId];
  
  let efficiency = 1.0;
  let hpCost = 15; // Base cost
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

  // HP Penalty (New Mechanic: Exhaustion)
  // HPが低いと学習効率が激減する。これにより「HP回復」が攻略に必須となる。
  if (state.hp < 30) {
    efficiency *= 0.5;
    baseLog += "\n【疲労困憊】身体が鉛のように重い。内容が全く頭に入ってこない...";
    logType = 'danger';
  } else if (state.hp < 50) {
    efficiency *= 0.8;
    baseLog += "\n【体調不良】疲労で集中力が続かない。";
  }

  // Caffeine Multipliers & Penalties (Extreme Risk/Reward)
  if (state.caffeine >= 50 && state.caffeine < 100) {
    efficiency += 0.2; // Awake (x1.2)
  } else if (state.caffeine >= 100 && state.caffeine < 150) {
    efficiency += 0.6; // Zone (x1.6) Stronger buff
    hpCost += 8; 
    sanityCost += 5;
    baseLog += " (カフェイン覚醒ZONE)";
  } else if (state.caffeine >= 150) {
    // Overdose: Insane speed but high risk of crash
    efficiency += 1.5; // Overdose (x2.5) !!
    hpCost += 20; 
    sanityCost += 20;
    baseLog += `\n${LOG_MESSAGES.study_jitter}`;
    logType = 'danger';
    
    // Crash Risk increased to 40%
    if (chance(40)) {
      efficiency = 0;
      hpCost += 10; // Extra damage
      baseLog = "【心肺異常】心臓が早鐘を打ち、激しい動悸とめまいで倒れ込んだ。何も勉強できない。\n(OD反動: 学力上昇0, HP大幅減)";
    } else {
       baseLog += "\n【限界突破】寿命を燃やして脳をオーバークロックしている。理解速度が異常だ。";
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
