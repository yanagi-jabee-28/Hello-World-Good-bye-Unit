
import { GameState, TimeSlot } from '../types';
import { clamp, chance } from '../utils/common';
import { pushLog } from './stateHelpers';
import { CAFFEINE_DECAY, CAFFEINE_THRESHOLDS, EVENT_CONSTANTS, SATIETY_CONSTANTS, SATIETY_CONSUMPTION } from '../config/gameConstants';
import { getNextTimeSlot } from './time';
import { executeEvent } from './eventManager';
import { ACTION_LOGS } from '../data/constants/logMessages';

/**
 * ターン経過処理を一括して行う
 * 時間経過、ステータス自然変動、バフ処理、ランダムイベントなど
 */
export const processTurnEnd = (state: GameState, isResting: boolean = false): GameState => {
  let newState = { ...state };

  // 1. 睡眠負債の更新
  if (!isResting) {
    let debtIncrease = 0.2;
    if (newState.timeSlot === TimeSlot.LATE_NIGHT) {
      debtIncrease = 1.0;
    }
    newState.flags.sleepDebt += debtIncrease;
  } else {
    // 休息時の負債解消は handleRest 内で行われているが、
    // 狂気スタックの減少はここでもケアできるようにしておく（汎用化）
    if (newState.flags.madnessStack > 0) {
      newState.flags.madnessStack = Math.max(0, newState.flags.madnessStack - 1);
    }
  }

  // 2. カフェイン依存症判定
  if (newState.caffeine >= CAFFEINE_THRESHOLDS.TOXICITY) {
    if (chance(10)) newState.flags.caffeineDependent = true;
  }

  // 3. アクティブバフの処理
  newState.activeBuffs.forEach(buff => {
    if (buff.type === 'SANITY_DRAIN') {
      newState.sanity = clamp(newState.sanity - buff.value, 0, newState.maxSanity);
    }
  });

  // バフの期間経過
  newState.activeBuffs = newState.activeBuffs
    .map(b => ({ ...b, duration: b.duration - 1 }))
    .filter(b => b.duration > 0);

  // 4. カフェインの自然減衰
  newState.caffeine = clamp(newState.caffeine - CAFFEINE_DECAY, 0, 200);

  // 5. 満腹度の自然減少 (行動による消費が主、ここは基礎代謝のみ)
  const baseSatietyDecay = state.timeSlot === TimeSlot.LATE_NIGHT 
    ? Math.floor(SATIETY_CONSTANTS.DECAY * SATIETY_CONSUMPTION.LATE_NIGHT_MULT)
    : SATIETY_CONSTANTS.DECAY;
  
  newState.satiety = clamp(newState.satiety - baseSatietyDecay, 0, newState.maxSatiety);
  
  // 6. カフェイン過剰摂取ダメージ
  if (newState.caffeine >= CAFFEINE_THRESHOLDS.ZONE) {
    const isOverdose = newState.caffeine >= CAFFEINE_THRESHOLDS.TOXICITY;
    const toxicHp = isOverdose ? 12 : 3;
    const toxicSan = isOverdose ? 6 : 1;

    newState.hp = clamp(newState.hp - toxicHp, 0, newState.maxHp);
    newState.sanity = clamp(newState.sanity - toxicSan, 0, newState.maxSanity);
  }

  // 7. 孤独ペナルティ
  const turnsSinceSocial = newState.turnCount - newState.lastSocialTurn;
  if (turnsSinceSocial > EVENT_CONSTANTS.ISOLATION_THRESHOLD) {
    const lonelinessDmg = EVENT_CONSTANTS.ISOLATION_DAMAGE;
    newState.sanity = clamp(newState.sanity - lonelinessDmg, 0, newState.maxSanity);
    pushLog(newState, ACTION_LOGS.SOCIAL.ISOLATION(turnsSinceSocial, lonelinessDmg), 'warning');
  }

  // --- CRITICAL CHECK: 生存確認 ---
  // アクションコストや状態異常ダメージで死亡している場合、時間経過やイベント抽選を行わずにリターンする。
  // これにより、死亡後の矛盾したログやイベント発生を防ぐ。
  if (newState.hp <= 0 || newState.sanity <= 0) {
    return newState;
  }

  // 8. 時間の進行
  const { slot, isNextDay } = getNextTimeSlot(state.timeSlot);
  newState.timeSlot = slot;
  if (isNextDay) {
    newState.day += 1;
    pushLog(newState, ACTION_LOGS.SYSTEM.DAY_START(newState.day), 'system');
  }
  newState.turnCount += 1;

  // 9. 履歴の記録
  newState.statsHistory = [
    ...newState.statsHistory,
    {
      hp: newState.hp,
      sanity: newState.sanity,
      caffeine: newState.caffeine,
      satiety: newState.satiety,
      turn: newState.turnCount,
      money: newState.money
    }
  ];

  // 10. ターン終了時ランダムイベント
  // ゲーム終了日(DAY 8)に到達した場合はイベントを発生させない
  if (newState.day <= 7 && chance(EVENT_CONSTANTS.RANDOM_PROBABILITY)) {
    newState = executeEvent(newState, 'turn_end');
  }

  return newState;
};
