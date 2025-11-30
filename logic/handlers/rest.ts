
import { Draft } from 'immer';
import { GameState, TimeSlot, LogEntry, GameEventEffect } from '../../types';
import { ACTION_LOGS } from '../../data/constants/logMessages';
import { applySoftCap } from '../../utils/common';
import { joinMessages } from '../../utils/logFormatter';
import { pushLog } from '../stateHelpers';
import { CAFFEINE_THRESHOLDS, BUFF_SOFT_CAP_ASYMPTOTE, SATIETY_CONSUMPTION } from '../../config/gameConstants';
import { applyEffect } from '../effectProcessor';

export const handleRest = (draft: Draft<GameState>): void => {
  let hpRecov = 0;
  let sanityRecov = 0;
  let caffeineDrop = -25;
  let satietyCost = SATIETY_CONSUMPTION.REST;
  let baseLog = "";
  let logType: LogEntry['type'] = 'info';

  let debtReduction = 0;
  let quality = 0.8;

  const anxietyFactor = Math.max(0.6, 1.0 - ((draft.day - 1) * 0.06));

  switch (draft.timeSlot) {
    case TimeSlot.LATE_NIGHT:
      hpRecov = 80;
      sanityRecov = 30; 
      baseLog = ACTION_LOGS.REST.SUCCESS; 
      logType = 'success';
      debtReduction = 5;
      quality = 1.0;
      satietyCost = Math.floor(satietyCost * SATIETY_CONSUMPTION.LATE_NIGHT_MULT);
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

  if (draft.caffeine >= CAFFEINE_THRESHOLDS.TOXICITY) {
    hpRecov = Math.floor(hpRecov * 0.3);
    sanityRecov = -10;
    baseLog = ACTION_LOGS.REST.CAFFEINE_FAIL;
    logType = 'danger';
    quality = 0.5;
  } else if (draft.caffeine >= CAFFEINE_THRESHOLDS.ZONE) {
    hpRecov = Math.floor(hpRecov * 0.6);
    sanityRecov = Math.floor(sanityRecov * 0.5);
    baseLog = ACTION_LOGS.REST.SHALLOW;
    logType = 'warning';
    quality = 0.7;
  }

  let rawMultiplier = 1.0;
  const restBuffs = draft.activeBuffs.filter(b => b.type === 'REST_EFFICIENCY');
  if (restBuffs.length > 0) {
    rawMultiplier = restBuffs.reduce((acc, b) => acc * b.value, 1.0);
    baseLog += ` [アイテム効果 x${rawMultiplier.toFixed(1)}]`;
  }

  const finalMultiplier = applySoftCap(rawMultiplier, BUFF_SOFT_CAP_ASYMPTOTE);

  hpRecov = Math.floor(hpRecov * finalMultiplier);
  sanityRecov = Math.floor(sanityRecov * finalMultiplier);

  hpRecov = Math.floor(hpRecov * anxietyFactor);
  sanityRecov = Math.floor(sanityRecov * anxietyFactor);

  if (anxietyFactor < 0.8) {
    baseLog += ACTION_LOGS.REST.ANXIETY;
  }

  const effect: GameEventEffect = {
    hp: hpRecov,
    sanity: sanityRecov,
    caffeine: caffeineDrop,
    satiety: -satietyCost
  };

  const messages = applyEffect(draft, effect);

  draft.flags.sleepDebt = Math.max(0, draft.flags.sleepDebt - debtReduction);
  draft.flags.lastSleepQuality = quality;

  const details = joinMessages(messages, ', ');
  pushLog(draft, `${baseLog}\n(${details})`, logType);
};

export const handleEscapism = (draft: Draft<GameState>): void => {
  let satietyCost = SATIETY_CONSUMPTION.ESCAPISM;
  if (draft.timeSlot === TimeSlot.LATE_NIGHT) {
    satietyCost = Math.floor(satietyCost * SATIETY_CONSUMPTION.LATE_NIGHT_MULT);
  }

  const effect: GameEventEffect = {
    sanity: 35,
    hp: 10,
    relationships: {},
    satiety: -satietyCost
  };
  
  let baseLog = "";
  let logType: LogEntry['type'] = 'info';

  if (draft.timeSlot === TimeSlot.AM || draft.timeSlot === TimeSlot.AFTERNOON) {
    effect.relationships!.PROFESSOR = -8;
    baseLog = ACTION_LOGS.ESCAPISM.SKIP_CLASS;
    logType = 'warning';
  } else {
    baseLog = ACTION_LOGS.ESCAPISM.NORMAL;
  }

  const messages = applyEffect(draft, effect);
  
  const details = joinMessages(messages, ', ');
  pushLog(draft, `${baseLog}\n(${details})`, logType);
};
