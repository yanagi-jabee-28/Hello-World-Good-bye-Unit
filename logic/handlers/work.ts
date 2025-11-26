
import { GameState, TimeSlot, LogEntry } from '../../types';
import { clamp } from '../../utils/common';
import { joinMessages, formatEffect } from '../../utils/logFormatter';
import { pushLog } from '../stateHelpers';
import { getWorkConfig } from '../../data/work';
import { CAFFEINE_THRESHOLDS } from '../../config/gameConstants';
import { selectEvent, recordEventOccurrence, applyEventEffect } from '../eventManager';
import { ALL_EVENTS } from '../../data/events';

export const handleWork = (state: GameState): GameState => {
  // 1. 分岐イベント（トラブル等）の抽選
  // カテゴリ 'work_branching' のイベントを対象とする
  // 基本確率は低めに設定されているはずだが、発生すればそれが優先される
  const branchingEvents = ALL_EVENTS.filter(e => e.category === 'work_branching');
  const troubleEvent = selectEvent(state, branchingEvents, 'action_work');

  if (troubleEvent && troubleEvent.options) {
    // トラブル発生！選択肢ダイアログを表示して終了（コスト等は選択結果に委ねる）
    const recordedState = recordEventOccurrence(state, troubleEvent.id);
    recordedState.pendingEvent = troubleEvent;
    return recordedState;
  }

  // 2. 通常結果イベントの抽選
  // トラブルがなければ、シフトに応じた結果（成功/失敗/大成功など）を抽選する
  const resultEvents = ALL_EVENTS.filter(e => e.category === 'work_result');
  const resultEvent = selectEvent(state, resultEvents, 'action_work');

  // 3. 基本パラメータの計算
  const config = getWorkConfig(state.timeSlot);
  let baseSalary = config.salary;
  let baseHpCost = config.hpCost;
  let baseSanityCost = config.sanityCost;

  // カフェイン補正
  let caffeineMsg: string | null = null;
  if (state.caffeine >= CAFFEINE_THRESHOLDS.TOXICITY) {
    baseSalary = Math.floor(baseSalary * 1.5);
    baseHpCost = Math.floor(baseHpCost * 1.5);
    baseSanityCost = Math.floor(baseSanityCost * 1.5);
    caffeineMsg = "中毒稼働(報酬UP/消耗大)";
  } else if (state.caffeine >= CAFFEINE_THRESHOLDS.ZONE) {
    baseSalary = Math.floor(baseSalary * 1.3);
    baseHpCost = Math.floor(baseHpCost * 1.2);
    caffeineMsg = "ZONE稼働(報酬UP)";
  } else if (state.caffeine >= CAFFEINE_THRESHOLDS.AWAKE) {
    baseSalary = Math.floor(baseSalary * 1.1);
    baseHpCost = Math.floor(baseHpCost * 1.1);
    caffeineMsg = "覚醒稼働";
  }

  // 4. イベント効果の適用（基本値への補正）
  let newState = { ...state };
  let eventLogText = config.logText; // デフォルトテキスト
  let eventMessages: string[] = [];
  let logType: LogEntry['type'] = config.logType;

  if (resultEvent) {
    newState = recordEventOccurrence(newState, resultEvent.id);
    eventLogText = resultEvent.text;
    
    if (resultEvent.type === 'good') logType = 'success';
    if (resultEvent.type === 'bad') logType = 'danger'; // warningよりdangerを優先
    if (resultEvent.type === 'flavor') logType = 'info';

    if (resultEvent.effect) {
      const { effect } = resultEvent;
      
      // イベント効果を基本値にマージ（加算）する
      if (effect.money) baseSalary += effect.money;
      if (effect.hp) baseHpCost -= effect.hp; // HP+効果ならコスト減少
      if (effect.sanity) baseSanityCost -= effect.sanity; // SAN+効果ならコスト減少

      // その他の効果（アイテム入手など）は直接適用
      const { newState: tempState, messages } = applyEventEffect(newState, { ...resultEvent, effect: { ...effect, money: 0, hp: 0, sanity: 0 } });
      newState = tempState;
      eventMessages = messages;
    }
  }

  // 負の値にならないようクランプ（給料はマイナスあり得る＝罰金）
  baseSalary = Math.max(-5000, baseSalary);
  baseHpCost = Math.max(0, baseHpCost);
  baseSanityCost = Math.max(0, baseSanityCost);

  // 5. 最終ステータス更新
  newState.money += baseSalary;
  newState.hp = clamp(newState.hp - baseHpCost, 0, newState.maxHp);
  newState.sanity = clamp(newState.sanity - baseSanityCost, 0, newState.maxSanity);

  // 6. ログ生成
  const numericLogs = [
    formatEffect({ money: baseSalary })[0],
    formatEffect({ hp: -baseHpCost })[0],
    formatEffect({ sanity: -baseSanityCost })[0]
  ];

  const details = joinMessages([
    ...numericLogs,
    ...eventMessages,
    caffeineMsg
  ], ', ');

  pushLog(newState, `${eventLogText}\n(${details})`, logType);
  return newState;
};
