import { GameState, TimeSlot, LogEntry, RelationshipId } from '../../types';
import { LOG_MESSAGES } from '../../data/events';
import { clamp, formatDelta, joinMessages } from '../../utils/common';
import { pushLog } from '../stateHelpers';

export const handleRest = (state: GameState): GameState => {
  let hpRecov = 30; // Increased base recovery
  let sanityRecov = 15;
  let caffeineDrop = -20;
  let baseLog = "";
  let logType: LogEntry['type'] = 'info';

  if (state.timeSlot === TimeSlot.LATE_NIGHT) {
    hpRecov = 50;
    sanityRecov = 25;
    baseLog = LOG_MESSAGES.rest_success;
    logType = 'success';
  } else if (state.timeSlot === TimeSlot.NOON) {
    sanityRecov += 5;
    baseLog = "【ランチ】学食で定食を食べた。少しリラックス。";
  } else {
    baseLog = LOG_MESSAGES.rest_short;
  }

  // Caffeine Interference
  if (state.caffeine >= 150) {
    hpRecov = Math.floor(hpRecov * 0.2);
    sanityRecov = -5; 
    baseLog = LOG_MESSAGES.rest_caffeine_fail;
    logType = 'danger';
  } else if (state.caffeine >= 100) {
    hpRecov = Math.floor(hpRecov * 0.5);
    sanityRecov = Math.floor(sanityRecov * 0.5);
    baseLog = "【浅い眠り】カフェインが効いていて、深く眠れなかった。";
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
  const sanDelta = 30; // Increased reward
  const hpDelta = 5;
  let profRelDelta = 0;
  let baseLog = "";
  let logType: LogEntry['type'] = 'info';

  if (state.timeSlot === TimeSlot.AM || state.timeSlot === TimeSlot.AFTERNOON) {
    profRelDelta = -5;
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