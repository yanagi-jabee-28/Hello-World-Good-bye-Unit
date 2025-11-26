
import { GameState, LogEntry, GameEventEffect } from '../../types';
import { joinMessages } from '../../utils/logFormatter';
import { pushLog } from '../stateHelpers';
import { getWorkConfig } from '../../data/work';
import { CAFFEINE_THRESHOLDS } from '../../config/gameConstants';
import { selectEvent, recordEventOccurrence } from '../eventManager';
import { ALL_EVENTS } from '../../data/events';
import { applyEffect, mergeEffects } from '../effectProcessor';

export const handleWork = (state: GameState): GameState => {
  // 1. 分岐イベント（トラブル等）の抽選
  const branchingEvents = ALL_EVENTS.filter(e => e.category === 'work_branching');
  const troubleEvent = selectEvent(state, branchingEvents, 'action_work');

  if (troubleEvent && troubleEvent.options) {
    const recordedState = recordEventOccurrence(state, troubleEvent.id);
    recordedState.pendingEvent = troubleEvent;
    return recordedState;
  }

  // 2. 通常結果イベントの抽選
  const resultEvents = ALL_EVENTS.filter(e => e.category === 'work_result');
  const resultEvent = selectEvent(state, resultEvents, 'action_work');

  // 3. 基本パラメータの計算
  const config = getWorkConfig(state.timeSlot);
  
  // 基本効果オブジェクトを作成
  const baseEffect: GameEventEffect = {
    money: config.salary,
    hp: -config.hpCost,
    sanity: -config.sanityCost
  };

  // カフェイン補正
  let caffeineMsg: string | null = null;
  if (state.caffeine >= CAFFEINE_THRESHOLDS.TOXICITY) {
    baseEffect.money = Math.floor((baseEffect.money || 0) * 1.5);
    baseEffect.hp = Math.floor((baseEffect.hp || 0) * 1.5);
    baseEffect.sanity = Math.floor((baseEffect.sanity || 0) * 1.5);
    caffeineMsg = "中毒稼働(報酬UP/消耗大)";
  } else if (state.caffeine >= CAFFEINE_THRESHOLDS.ZONE) {
    baseEffect.money = Math.floor((baseEffect.money || 0) * 1.3);
    baseEffect.hp = Math.floor((baseEffect.hp || 0) * 1.2);
    caffeineMsg = "ZONE稼働(報酬UP)";
  } else if (state.caffeine >= CAFFEINE_THRESHOLDS.AWAKE) {
    baseEffect.money = Math.floor((baseEffect.money || 0) * 1.1);
    baseEffect.hp = Math.floor((baseEffect.hp || 0) * 1.1);
    caffeineMsg = "覚醒稼働";
  }

  // 4. 効果の統合 (基本効果 + イベント効果)
  let logType: LogEntry['type'] = config.logType;
  let eventLogText = config.logText;
  let finalEffect = baseEffect;
  let eventIdToRecord: string | null = null;

  if (resultEvent) {
    eventIdToRecord = resultEvent.id;
    eventLogText = resultEvent.text;
    
    if (resultEvent.type === 'good') logType = 'success';
    if (resultEvent.type === 'bad') logType = 'danger';
    if (resultEvent.type === 'flavor') logType = 'info';

    if (resultEvent.effect) {
      finalEffect = mergeEffects(baseEffect, resultEvent.effect);
    }
  }

  // 負の値にならないよう調整（給料の下限など）
  if (finalEffect.money && finalEffect.money < -5000) finalEffect.money = -5000;

  // 5. 適用とログ生成
  let newState = state;
  if (eventIdToRecord) {
    newState = recordEventOccurrence(newState, eventIdToRecord);
  }

  const result = applyEffect(newState, finalEffect);
  newState = result.newState;

  const details = joinMessages([
    ...result.messages,
    caffeineMsg
  ], ', ');

  pushLog(newState, `${eventLogText}\n(${details})`, logType);
  return newState;
};
