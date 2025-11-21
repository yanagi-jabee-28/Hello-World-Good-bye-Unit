
import { GameState, TimeSlot, LogEntry, RelationshipId } from '../../types';
import { LOG_MESSAGES } from '../../data/events';
import { clamp, formatDelta, joinMessages } from '../../utils/common';
import { pushLog } from '../stateHelpers';

export const handleRest = (state: GameState): GameState => {
  let hpRecov = 35;
  let sanityRecov = 20;
  let caffeineDrop = -25;
  let baseLog = "";
  let logType: LogEntry['type'] = 'info';

  // Project Melting Brain: Anxiety Factor
  // Day 1: 1.0 (Normal)
  // Day 4: 0.7
  // Day 7: 0.4 (Panic mode, almost no rest)
  const anxietyFactor = Math.max(0.4, 1.0 - ((state.day - 1) * 0.1));

  if (state.timeSlot === TimeSlot.LATE_NIGHT) {
    hpRecov = 60;
    sanityRecov = 30;
    baseLog = LOG_MESSAGES.rest_success;
    logType = 'success';
  } else if (state.timeSlot === TimeSlot.NOON) {
    sanityRecov += 5;
    hpRecov = 20;
    baseLog = "【ランチ】学食で定食を食べた。少しリラックス。";
  } else {
    baseLog = LOG_MESSAGES.rest_short;
  }

  // Caffeine Interference
  if (state.caffeine >= 150) {
    hpRecov = Math.floor(hpRecov * 0.2);
    sanityRecov = -15; // Nightmare worsens with high caffeine
    baseLog = LOG_MESSAGES.rest_caffeine_fail;
    logType = 'danger';
  } else if (state.caffeine >= 100) {
    hpRecov = Math.floor(hpRecov * 0.5);
    sanityRecov = Math.floor(sanityRecov * 0.4);
    baseLog = "【浅い眠り】カフェインが脳を締め付け、深く眠れなかった。";
    logType = 'warning';
  }

  // Apply Buffs
  const restBuffs = state.activeBuffs.filter(b => b.type === 'REST_EFFICIENCY');
  if (restBuffs.length > 0) {
    const buffMultiplier = restBuffs.reduce((acc, b) => acc * b.value, 1.0);
    hpRecov = Math.floor(hpRecov * buffMultiplier);
    sanityRecov = Math.floor(sanityRecov * buffMultiplier);
    baseLog += ` [安眠効果 x${buffMultiplier.toFixed(1)}]`;
  }

  // Apply Anxiety (Scale down final recovery)
  hpRecov = Math.floor(hpRecov * anxietyFactor);
  sanityRecov = Math.floor(sanityRecov * anxietyFactor);

  if (anxietyFactor < 0.8) {
    baseLog += " 試験日が迫るプレッシャーで、動悸が収まらない...";
  }
  if (anxietyFactor < 0.5) {
    baseLog += "\n(焦燥感により回復量大幅低下)";
    logType = 'warning';
  }

  state.hp = clamp(state.hp + hpRecov, 0, state.maxHp);
  state.sanity = clamp(state.sanity + sanityRecov, 0, state.maxSanity);
  state.caffeine = clamp(state.caffeine + caffeineDrop, 0, 200);

  const details = joinMessages([
    formatDelta('HP', hpRecov),
    formatDelta('SAN', sanityRecov),
    formatDelta('カフェイン', caffeineDrop)
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

  // Escapism works better when stressed, but hurts grades
  if (state.timeSlot === TimeSlot.AM || state.timeSlot === TimeSlot.AFTERNOON) {
    profRelDelta = -8; // Penalize skipping class more
    baseLog = "【サボり】講義をサボってゲーセンへ。背徳感がスパイスだ。";
    logType = 'warning';
  } else {
    baseLog = "【現実逃避】全てを忘れて没頭した。明日から本気出す。";
  }

  state.sanity = clamp(state.sanity + sanDelta, 0, state.maxSanity);
  state.hp = clamp(state.hp + hpDelta, 0, state.maxHp);
  if (profRelDelta) state.relationships[RelationshipId.PROFESSOR] = clamp(state.relationships[RelationshipId.PROFESSOR] + profRelDelta, 0, 100);

  const details = joinMessages([
    formatDelta('SAN', sanDelta),
    formatDelta('HP', hpDelta),
    formatDelta('教授友好度', profRelDelta)
  ], ', ');

  pushLog(state, `${baseLog}\n(${details})`, logType);
  return state;
};
