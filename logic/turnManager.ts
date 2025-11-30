
import { Draft } from 'immer';
import { GameState, TimeSlot, SubjectId } from '../types';
import { clamp, chance } from '../utils/common';
import { pushLog } from './stateHelpers';
import { CAFFEINE_DECAY, CAFFEINE_THRESHOLDS, EVENT_CONSTANTS, SATIETY_CONSTANTS, SATIETY_CONSUMPTION, FORGETTING_CONSTANTS } from '../config/gameConstants';
import { getNextTimeSlot } from './time';
import { executeEvent } from './eventManager';
import { ACTION_LOGS } from '../data/constants/logMessages';
import { SUBJECTS } from '../data/subjects';
import { computeRisk } from './riskCalculator';

/**
 * ターン経過処理を一括して行う
 * 時間経過、ステータス自然変動、バフ処理、ランダムイベントなど
 */
export const processTurnEnd = (draft: Draft<GameState>, isResting: boolean = false): void => {
  // 0. Action Streak Management
  if (isResting) {
    draft.flags.actionStreak = 0;
  } else {
    draft.flags.actionStreak = (draft.flags.actionStreak || 0) + 1;
  }

  // 1. 睡眠負債の更新
  if (!isResting) {
    let debtIncrease = 0.2;
    if (draft.timeSlot === TimeSlot.LATE_NIGHT) {
      debtIncrease = 1.0;
    }
    draft.flags.sleepDebt += debtIncrease;
  } else {
    // 休息時の負債解消は handleRest 内で行われているが、
    // 狂気スタックの減少はここでもケアできるようにしておく（汎用化）
    if (draft.flags.madnessStack > 0) {
      draft.flags.madnessStack = Math.max(0, draft.flags.madnessStack - 1);
    }
  }

  // 2. カフェイン依存症判定
  if (draft.caffeine >= CAFFEINE_THRESHOLDS.TOXICITY) {
    if (chance(10)) draft.flags.caffeineDependent = true;
  }

  // 3. アクティブバフの処理
  draft.activeBuffs.forEach(buff => {
    if (buff.type === 'SANITY_DRAIN') {
      draft.sanity = clamp(draft.sanity - buff.value, 0, draft.maxSanity);
    }
  });

  // バフの期間経過
  // Filter in place for draft array is tricky, reassigning is better
  draft.activeBuffs = draft.activeBuffs
    .map(b => ({ ...b, duration: b.duration - 1 }))
    .filter(b => b.duration > 0);

  // 4. カフェインの自然減衰
  draft.caffeine = clamp(draft.caffeine - CAFFEINE_DECAY, 0, 200);

  // 5. 満腹度の自然減少 (行動による消費が主、ここは基礎代謝のみ)
  const baseSatietyDecay = draft.timeSlot === TimeSlot.LATE_NIGHT 
    ? Math.floor(SATIETY_CONSTANTS.DECAY * SATIETY_CONSUMPTION.LATE_NIGHT_MULT)
    : SATIETY_CONSTANTS.DECAY;
  
  draft.satiety = clamp(draft.satiety - baseSatietyDecay, 0, draft.maxSatiety);
  
  // 6. カフェイン過剰摂取ダメージ
  if (draft.caffeine >= CAFFEINE_THRESHOLDS.ZONE) {
    const isOverdose = draft.caffeine >= CAFFEINE_THRESHOLDS.TOXICITY;
    const toxicHp = isOverdose ? 12 : 3;
    const toxicSan = isOverdose ? 6 : 1;

    draft.hp = clamp(draft.hp - toxicHp, 0, draft.maxHp);
    draft.sanity = clamp(draft.sanity - toxicSan, 0, draft.maxSanity);
  }

  // 7. 孤独ペナルティ
  const turnsSinceSocial = draft.turnCount - draft.lastSocialTurn;
  if (turnsSinceSocial > EVENT_CONSTANTS.ISOLATION_THRESHOLD) {
    const lonelinessDmg = EVENT_CONSTANTS.ISOLATION_DAMAGE;
    draft.sanity = clamp(draft.sanity - lonelinessDmg, 0, draft.maxSanity);
    pushLog(draft, ACTION_LOGS.SOCIAL.ISOLATION(turnsSinceSocial, lonelinessDmg), 'warning');
  }

  // 8. 忘却曲線 (Forgetting Curve)
  // 猶予期間を超えて放置された科目の知識が減衰する
  Object.values(SUBJECTS).forEach(subject => {
    const lastStudied = draft.lastStudied[subject.id] || 0;
    const turnsSinceStudy = draft.turnCount - lastStudied;
    const currentScore = draft.knowledge[subject.id];

    // 猶予期間を超え、かつスコアが0より大きい場合のみ減衰
    if (turnsSinceStudy > FORGETTING_CONSTANTS.GRACE_PERIOD_TURNS && currentScore > 0) {
      let decay = Math.floor(currentScore * FORGETTING_CONSTANTS.DECAY_RATE);
      // 最低減少量の適用
      decay = Math.max(decay, FORGETTING_CONSTANTS.MIN_DECAY);
      
      // 0未満にはならない
      const newScore = Math.max(0, currentScore - decay);
      const actualDecay = currentScore - newScore;

      if (actualDecay > 0) {
        draft.knowledge[subject.id] = newScore;
        // ログ出力（頻繁に出すぎないよう、ある程度減少した時だけ目立たせる等の調整も可能だが、現状は毎回出す）
        pushLog(draft, ACTION_LOGS.STUDY.FORGETTING(subject.name, actualDecay), 'warning');
      }
    }
  });

  // Recalculate Risk after turn processing (stats might have changed)
  const risk = computeRisk({
    hp: draft.hp,
    maxHp: draft.maxHp,
    sanity: draft.sanity,
    maxSanity: draft.maxSanity,
    sleepDebt: draft.flags.sleepDebt || 0,
    actionStreak: draft.flags.actionStreak || 0,
  });
  draft.risk = risk.total;
  draft.riskBreakdown = risk;

  // --- CRITICAL CHECK: 生存確認 ---
  // アクションコストや状態異常ダメージで死亡している場合、時間経過やイベント抽選を行わずにリターンする。
  if (draft.hp <= 0 || draft.sanity <= 0) {
    return;
  }

  // 9. 時間の進行
  const { slot, isNextDay } = getNextTimeSlot(draft.timeSlot);
  draft.timeSlot = slot;
  if (isNextDay) {
    draft.day += 1;
    pushLog(draft, ACTION_LOGS.SYSTEM.DAY_START(draft.day), 'system');
    // デイリー制限のリセット (v2.5)
    draft.flags.studyAllUsedDay = 0;
  }
  draft.turnCount += 1;

  // 10. 履歴の記録
  draft.statsHistory.push({
    hp: draft.hp,
    sanity: draft.sanity,
    caffeine: draft.caffeine,
    satiety: draft.satiety,
    turn: draft.turnCount,
    money: draft.money
  });

  // 11. ターン終了時ランダムイベント
  // ゲーム終了日(DAY 8)に到達した場合はイベントを発生させない
  if (draft.day <= 7 && chance(EVENT_CONSTANTS.RANDOM_PROBABILITY)) {
    executeEvent(draft, 'turn_end');
  }
};
