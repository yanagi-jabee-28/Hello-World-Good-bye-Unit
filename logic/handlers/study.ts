
import { GameState, SubjectId, TimeSlot, LogEntry, RelationshipId } from '../../types';
import { SUBJECTS } from '../../data/subjects';
import { LOG_MESSAGES } from '../../data/events';
import { clamp, chance, formatDelta, joinMessages } from '../../utils/common';
import { pushLog } from '../stateHelpers';

/**
 * 日数進行による難易度係数を計算 (Project Melting Brain)
 * 後半になるほど消耗が指数関数的に激しくなる
 */
const getPressureMultiplier = (day: number): number => {
  // Day 1-2: 1.0x (Normal)
  // Day 3-4: 1.2x (Hard)
  // Day 5-6: 1.5x (Very Hard)
  // Day 7:   2.0x (Hell)
  if (day <= 2) return 1.0;
  if (day <= 4) return 1.2;
  if (day <= 6) return 1.5;
  return 2.0; 
};

export const handleStudy = (state: GameState, subjectId: SubjectId): GameState => {
  const subject = SUBJECTS[subjectId];
  const currentScore = state.knowledge[subjectId];
  const pressure = getPressureMultiplier(state.day);
  
  let efficiency = 1.0;
  
  // Base costs scale with pressure
  let hpCost = Math.floor(15 * pressure); 
  let sanityCost = Math.floor(8 * pressure);
  
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
    baseLog = `【講義出席】${subject.name}の講義。${pressure > 1.2 ? '内容は難解を極めている。' : '真面目に受講した。'}`;
    logType = 'success';
  } else if (state.timeSlot === TimeSlot.NOON) {
    if (state.caffeine > 50) {
      baseLog = LOG_MESSAGES.study_caffeine_awake(subject.name);
    } else {
      efficiency = 0.6;
      baseLog = LOG_MESSAGES.study_noon_drowsy(subject.name);
      logType = 'warning';
    }
  } else if (state.timeSlot === TimeSlot.AFTERNOON) {
    profRelDelta = 2;
    hpCost += Math.floor(5 * pressure); // Afternoon dip is heavier later on
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
    // 深夜の効率ギャンブル
    if (chance(30)) { 
       efficiency = 2.5; // 大当たり
       baseLog = LOG_MESSAGES.study_late_night_zone(subject.name);
       logType = 'success';
    } else {
       efficiency = 0.2; // 大外れ
       sanityCost += Math.floor(15 * pressure);
       baseLog = LOG_MESSAGES.study_late_night_fail(subject.name);
       logType = 'danger';
    }
  }

  // === MADNESS GAMBLE (Project Melting Brain) ===
  // SAN値が30を切ると、行動が極端になる（火事場の馬鹿力 or 精神崩壊）
  if (state.sanity < 30) {
    if (chance(40)) {
      // Critical Success
      efficiency *= 3.0; 
      sanityCost += 20; // 代償としてさらにSANを削る
      baseLog += "\n【狂気】視界が歪む。極限状態の脳が、異常な速度で情報を貪り食う。";
      logType = 'success';
    } else {
      // Total Collapse
      efficiency = 0;
      hpCost += 20;
      baseLog += "\n【錯乱】文字が虫のように這い回って見える...！ 叫び出したい衝動を抑えるので精一杯だ。";
      logType = 'danger';
    }
  }

  // Caffeine Multipliers & Penalties
  if (state.caffeine >= 50 && state.caffeine < 120) {
    efficiency += 0.2; 
  } else if (state.caffeine >= 120 && state.caffeine < 180) {
    efficiency += 0.6; // ZONE: High risk high return
    hpCost += 15; // Physical toll increases
    sanityCost += 5;
    baseLog += " (ZONE状態)";
  } else if (state.caffeine >= 180) {
    efficiency += 0.8; // Overdose boost
    hpCost += 40; // Severe damage
    sanityCost += 30;
    baseLog += `\n${LOG_MESSAGES.study_jitter}`;
    logType = 'danger';
    
    if (chance(40)) { // Crash Risk high
      efficiency = 0;
      baseLog = "【OD】心臓の動悸で意識が飛び、ペンを握り潰してしまった。何も頭に入らない。";
    }
  }

  // Apply Buffs
  const studyBuffs = state.activeBuffs.filter(b => b.type === 'STUDY_EFFICIENCY');
  if (studyBuffs.length > 0) {
    const buffMultiplier = studyBuffs.reduce((acc, b) => acc * b.value, 1.0);
    efficiency *= buffMultiplier;
    baseLog += ` [ブースト x${buffMultiplier.toFixed(1)}]`;
  }

  // Diminishing Returns Logic
  let progressionMultiplier = 1.0;
  if (currentScore < 40) progressionMultiplier = 1.5; // Catch up easier
  else if (currentScore < 60) progressionMultiplier = 1.0;
  else if (currentScore < 80) progressionMultiplier = 0.6; // Harder to perfect
  else progressionMultiplier = 0.3;

  let knowledgeGain = Math.floor(7 * efficiency * subject.difficulty * progressionMultiplier);
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
    pressure > 1.0 ? `(負荷x${pressure})` : null
  ], ', ');

  pushLog(state, `${baseLog}\n(${details})`, logType);
  return state;
};
