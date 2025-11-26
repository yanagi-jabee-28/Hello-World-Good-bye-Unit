
import { GameState, TimeSlot, LogEntry } from '../../types';
import { ACTION_LOGS, LOG_TEMPLATES } from '../../data/constants/logMessages';
import { clamp, applySoftCap } from '../../utils/common';
import { joinMessages } from '../../utils/logFormatter';
import { pushLog } from '../stateHelpers';
import { CAFFEINE_THRESHOLDS, BUFF_SOFT_CAP_ASYMPTOTE } from '../../config/gameConstants';

export const handleRest = (state: GameState): GameState => {
  let hpRecov = 0;
  let sanityRecov = 0;
  let caffeineDrop = -25;
  let baseLog = "";
  let logType: LogEntry['type'] = 'info';

  let debtReduction = 0;
  let quality = 0.8;

  const anxietyFactor = Math.max(0.6, 1.0 - ((state.day - 1) * 0.06));

  switch (state.timeSlot) {
    case TimeSlot.LATE_NIGHT:
      hpRecov = 80;
      sanityRecov = 30; 
      baseLog = ACTION_LOGS.REST.SUCCESS; 
      logType = 'success';
      debtReduction = 5;
      quality = 1.0;
      break;

    case TimeSlot.MORNING:
      hpRecov = 30;
      sanityRecov = 10;
      baseLog = ACTION_LOGS.REST.MORNING_SLEEP;
      debtReduction = 2;
      quality = 0.9;
      break;

    case TimeSlot.NOON:
      hpRecov = 15;
      sanityRecov = 15;
      baseLog = ACTION_LOGS.REST.NOON_NAP;
      debtReduction = 1;
      quality = 0.85;
      break;

    default:
      hpRecov = 15;
      sanityRecov = 5;
      baseLog = ACTION_LOGS.REST.SHORT; 
      debtReduction = 0.5;
      quality = 0.8;
      break;
  }

  // Caffeine Interference
  if (state.caffeine >= CAFFEINE_THRESHOLDS.TOXICITY) {
    hpRecov = Math.floor(hpRecov * 0.3);
    sanityRecov = -10;
    baseLog = ACTION_LOGS.REST.CAFFEINE_FAIL;
    logType = 'danger';
    quality = 0.5;
  } else if (state.caffeine >= CAFFEINE_THRESHOLDS.ZONE) {
    hpRecov = Math.floor(hpRecov * 0.6);
    sanityRecov = Math.floor(sanityRecov * 0.5);
    baseLog = ACTION_LOGS.REST.SHALLOW;
    logType = 'warning';
    quality = 0.7;
  }

  // Apply Buffs with Soft Cap
  let rawMultiplier = 1.0;
  const restBuffs = state.activeBuffs.filter(b => b.type === 'REST_EFFICIENCY');
  if (restBuffs.length > 0) {
    rawMultiplier = restBuffs.reduce((acc, b) => acc * b.value, 1.0);
    baseLog += ` [安眠効果 x${rawMultiplier.toFixed(1)}]`;
  }

  const finalMultiplier = applySoftCap(rawMultiplier, BUFF_SOFT_CAP_ASYMPTOTE);

  hpRecov = Math.floor(hpRecov * finalMultiplier);
  sanityRecov = Math.floor(sanityRecov * finalMultiplier);

  // Apply Anxiety
  hpRecov = Math.floor(hpRecov * anxietyFactor);
  sanityRecov = Math.floor(sanityRecov * anxietyFactor);

  if (anxietyFactor < 0.8) {
    baseLog += ACTION_LOGS.REST.ANXIETY;
  }

  state.hp = clamp(state.hp + hpRecov, 0, state.maxHp);
  state.sanity = clamp(state.sanity + sanityRecov, 0, state.maxSanity);
  state.caffeine = clamp(state.caffeine + caffeineDrop, 0, 200);

  state.flags.sleepDebt = Math.max(0, state.flags.sleepDebt - debtReduction);
  state.flags.lastSleepQuality = quality;

  const details = joinMessages([
    LOG_TEMPLATES.PARAM.HP(hpRecov),
    LOG_TEMPLATES.PARAM.SAN(sanityRecov),
    LOG_TEMPLATES.PARAM.CAFFEINE(caffeineDrop)
  ], ', ');

  pushLog(state, `${baseLog}\n(${details})`, logType);
  return state;
};

export const handleEscapism = (state: GameState): GameState => {
  const sanDelta = 35;
  const hpDelta = 10;
  let profRelDelta = 0;
  let baseLog = "";
  let logType: LogEntry['type'] = 'info';

  if (state.timeSlot === TimeSlot.AM || state.timeSlot === TimeSlot.AFTERNOON) {
    profRelDelta = -8; 
    baseLog = ACTION_LOGS.ESCAPISM.SKIP_CLASS;
    logType = 'warning';
  } else {
    baseLog = ACTION_LOGS.ESCAPISM.NORMAL;
  }

  state.sanity = clamp(state.sanity + sanDelta, 0, state.maxSanity);
  state.hp = clamp(state.hp + hpDelta, 0, state.maxHp);
  if (profRelDelta) state.relationships.PROFESSOR = clamp(state.relationships.PROFESSOR + profRelDelta, 0, 100);

  const details = joinMessages([
    LOG_TEMPLATES.PARAM.SAN(sanDelta),
    LOG_TEMPLATES.PARAM.HP(hpDelta),
    profRelDelta ? LOG_TEMPLATES.PARAM.RELATIONSHIP('教授友好度', profRelDelta) : null
  ], ', ');

  pushLog(state, `${baseLog}\n(${details})`, logType);
  return state;
};
