import { Draft } from 'immer';
import { GameState, LogEntry, GameEventEffect, TimeSlot } from '../../types';
import { joinMessages } from '../../utils/logFormatter';
import { pushLog } from '../stateHelpers';
import { getWorkConfig } from '../../data/work';
import { CAFFEINE_THRESHOLDS, SATIETY_CONSUMPTION } from '../../config/gameConstants';
import { selectEvent, recordEventOccurrence } from '../eventManager';
import { ALL_EVENTS } from '../../data/events';
import { applyEffect, mergeEffects } from '../effectProcessor';

export const handleWork = (draft: Draft<GameState>): void => {
  // 1. 分岐イベント（トラブル等）の抽選
  const branchingEvents = ALL_EVENTS.filter(e => e.category === 'work_branching');
  // Cast draft to GameState for read-only access where needed by selectEvent
  const troubleEvent = selectEvent(draft as GameState, branchingEvents, 'action_work');

  if (troubleEvent && troubleEvent.options) {
    recordEventOccurrence(draft, troubleEvent.id);
    draft.pendingEvent = troubleEvent;
    return;
  }

  // 2. 通常結果イベントの抽選
  const resultEvents = ALL_EVENTS.filter(e => e.category === 'work_result');
  const resultEvent = selectEvent(draft as GameState, resultEvents, 'action_work');

  // 3. 基本パラメータの計算
  const config = getWorkConfig(draft.timeSlot);
  
  let satietyCost = SATIETY_CONSUMPTION.WORK;
  if (draft.timeSlot === TimeSlot.LATE_NIGHT) {
    satietyCost = Math.floor(satietyCost * SATIETY_CONSUMPTION.LATE_NIGHT_MULT);
  }

  // 基本効果オブジェクトを作成
  const baseEffect: GameEventEffect = {
    money: config.salary,
    hp: -config.hpCost,
    sanity: -config.sanityCost,
    satiety: -satietyCost
  };

  // カフェイン補正
  let caffeineMsg: string | null = null;
  if (draft.caffeine >= CAFFEINE_THRESHOLDS.TOXICITY) {
    baseEffect.money = Math.floor((baseEffect.money || 0) * 1.5);
    baseEffect.hp = Math.floor((baseEffect.hp || 0) * 1.5);
    baseEffect.sanity = Math.floor((baseEffect.sanity || 0) * 1.5);
    if (baseEffect.satiety) baseEffect.satiety = Math.floor(baseEffect.satiety * SATIETY_CONSUMPTION.CAFFEINE_TOXIC_MULT);
    caffeineMsg = "中毒稼働(報酬UP/消耗大)";
  } else if (draft.caffeine >= CAFFEINE_THRESHOLDS.ZONE) {
    baseEffect.money = Math.floor((baseEffect.money || 0) * 1.3);
    baseEffect.hp = Math.floor((baseEffect.hp || 0) * 1.2);
    if (baseEffect.satiety) baseEffect.satiety = Math.floor(baseEffect.satiety * SATIETY_CONSUMPTION.CAFFEINE_ZONE_MULT);
    caffeineMsg = "ZONE稼働(報酬UP)";
  } else if (draft.caffeine >= CAFFEINE_THRESHOLDS.AWAKE) {
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
  if (eventIdToRecord) {
    recordEventOccurrence(draft, eventIdToRecord);
  }

  const messages = applyEffect(draft, finalEffect);

  const details = joinMessages([
    ...messages,
    caffeineMsg
  ], ', ');

  pushLog(draft, `${eventLogText}\n(${details})`, logType);
};