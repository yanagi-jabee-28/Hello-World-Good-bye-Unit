
import { GameState, TimeSlot, LogEntry, RelationshipId } from '../../types';
import { LOG_MESSAGES } from '../../data/events';
import { clamp, formatDelta, joinMessages, applySoftCap } from '../../utils/common';
import { pushLog } from '../stateHelpers';
import { CAFFEINE_THRESHOLDS, BUFF_SOFT_CAP_ASYMPTOTE } from '../../config/gameConstants';

export const handleRest = (state: GameState): GameState => {
  // 時間帯別の基礎回復量設定
  let hpRecov = 0;
  let sanityRecov = 0;
  let caffeineDrop = -25; // カフェイン除去量は一律
  let baseLog = "";
  let logType: LogEntry['type'] = 'info';

  // Project Melting Brain: Anxiety Factor
  // 日数経過による回復量減衰係数
  // Day 1: 1.0
  // Day 7: 1.0 - 6*0.06 = 0.64 (Previously 0.4)
  // 終盤でも最低限の回復(6割強)は保証する
  const anxietyFactor = Math.max(0.6, 1.0 - ((state.day - 1) * 0.06));

  switch (state.timeSlot) {
    case TimeSlot.LATE_NIGHT:
      // 就寝: HP大回復 / SAN中回復
      hpRecov = 80;
      sanityRecov = 30; // Rebalanced: 25 -> 30
      baseLog = LOG_MESSAGES.rest_success; 
      logType = 'success';
      break;

    case TimeSlot.MORNING:
      // 二度寝: 中回復（HP寄り）
      hpRecov = 30;
      sanityRecov = 10;
      baseLog = "【二度寝】誘惑に負けて布団に戻った。罪悪感で精神は休まらない。";
      break;

    case TimeSlot.NOON:
      // 昼寝: 中回復（SAN寄り）
      hpRecov = 15;
      sanityRecov = 15;
      baseLog = "【昼寝】午後の講義に備えて机で仮眠。脳のオーバーヒートが少し収まった。";
      break;

    default:
      // 仮眠(机): 小回復
      hpRecov = 15;
      sanityRecov = 5;
      baseLog = LOG_MESSAGES.rest_short; 
      break;
  }

  // Caffeine Interference
  if (state.caffeine >= CAFFEINE_THRESHOLDS.TOXICITY) {
    hpRecov = Math.floor(hpRecov * 0.3); // 0.2 -> 0.3
    sanityRecov = -10; // Nightmare -15 -> -10
    baseLog = LOG_MESSAGES.rest_caffeine_fail;
    logType = 'danger';
  } else if (state.caffeine >= CAFFEINE_THRESHOLDS.ZONE) {
    hpRecov = Math.floor(hpRecov * 0.6); // 0.5 -> 0.6
    sanityRecov = Math.floor(sanityRecov * 0.5); // 0.4 -> 0.5
    baseLog = "【浅い眠り】カフェインが脳を締め付け、深く眠れなかった。";
    logType = 'warning';
  }

  // Apply Buffs with Soft Cap
  let rawMultiplier = 1.0;
  const restBuffs = state.activeBuffs.filter(b => b.type === 'REST_EFFICIENCY');
  if (restBuffs.length > 0) {
    rawMultiplier = restBuffs.reduce((acc, b) => acc * b.value, 1.0);
    baseLog += ` [安眠効果 x${rawMultiplier.toFixed(1)}]`;
  }

  // Use the same soft cap constant for consistency, though unlikely to reach it for rest
  const finalMultiplier = applySoftCap(rawMultiplier, BUFF_SOFT_CAP_ASYMPTOTE);

  hpRecov = Math.floor(hpRecov * finalMultiplier);
  sanityRecov = Math.floor(sanityRecov * finalMultiplier);

  // Apply Anxiety (Scale down final recovery)
  hpRecov = Math.floor(hpRecov * anxietyFactor);
  sanityRecov = Math.floor(sanityRecov * anxietyFactor);

  if (anxietyFactor < 0.8) {
    baseLog += " 試験日が迫るプレッシャーで、動悸が収まらない...";
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

  // Escapism is NOT affected by Anxiety Factor (unlike Rest)
  // This makes it a viable late-game strategy for SAN recovery
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
