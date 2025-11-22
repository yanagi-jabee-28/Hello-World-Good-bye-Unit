
import { GameState, RelationshipId, SubjectId, ItemId } from '../../types';
import { clamp, formatDelta, joinMessages } from '../../utils/common';
import { executeEvent, recordEventOccurrence } from '../eventManager';
import { pushLog } from '../stateHelpers';
import { ITEMS } from '../../data/items';
import { SUBJECTS } from '../../data/subjects';
import { ALL_EVENTS } from '../../data/events';

export const handleAskProfessor = (state: GameState): GameState => {
  // 手土産スイーツ処理
  if ((state.inventory[ItemId.GIFT_SWEETS] || 0) > 0) {
    state.inventory[ItemId.GIFT_SWEETS] = (state.inventory[ItemId.GIFT_SWEETS] || 0) - 1;
    
    const relBonus = 25;
    const sanityBonus = 15;
    
    state.relationships[RelationshipId.PROFESSOR] = clamp(state.relationships[RelationshipId.PROFESSOR] + relBonus, 0, 100);
    state.sanity = clamp(state.sanity + sanityBonus, 0, state.maxSanity);

    // 報酬決定
    // 40%確率で参考書(9800円相当)、60%で直接指導(知識+15)
    let rewardLog = "";
    const messages = [
        formatDelta('教授友好度', relBonus),
        formatDelta('SAN', sanityBonus)
    ];

    if (Math.random() < 0.4) {
        state.inventory[ItemId.REFERENCE_BOOK] = (state.inventory[ItemId.REFERENCE_BOOK] || 0) + 1;
        rewardLog = "「ほう、気が利くね。これ、昔書いた本だが役に立つはずだ」";
        messages.push(`アイテム入手: ${ITEMS[ItemId.REFERENCE_BOOK].name}`);
    } else {
        const subIds = Object.values(SubjectId);
        const target = subIds[Math.floor(Math.random() * subIds.length)];
        const kDelta = 15;
        state.knowledge[target] = clamp(state.knowledge[target] + kDelta, 0, 100);
        rewardLog = "「いい茶菓子だ。特別に試験のヒントを教えよう」";
        messages.push(`${SUBJECTS[target].name}+${kDelta}`);
    }

    pushLog(state, `【贈答】${ITEMS[ItemId.GIFT_SWEETS].name}を教授室に持参した。\n${rewardLog}\n(${joinMessages(messages, ', ')})`, 'success');
    return state;
  }

  // --- 友好度判定による強制分岐メニュー (Rel >= 60) ---
  if (state.relationships[RelationshipId.PROFESSOR] >= 60) {
    const menuEvent = ALL_EVENTS.find(e => e.id === 'prof_interaction_menu');
    if (menuEvent) {
      // 統計記録
      const recordedState = recordEventOccurrence(state, menuEvent.id);
      recordedState.pendingEvent = menuEvent;
      return recordedState;
    }
  }

  // 通常処理 (ランダム)
  const newState = executeEvent(state, 'action_professor', "教授室は留守のようだ。");
  
  // Bonus if relationship improved (教授の機嫌が良い時)
  if (newState.relationships[RelationshipId.PROFESSOR] > state.relationships[RelationshipId.PROFESSOR]) {
      if (Math.random() < 0.3) {
          const subIds = Object.values(SubjectId);
          const target = subIds[Math.floor(Math.random() * subIds.length)];
          newState.knowledge[target] = clamp(newState.knowledge[target] + 3, 0, 100);
      }
  }
  return newState;
};

export const handleAskSenior = (state: GameState): GameState => {
  // 手土産スイーツを持っている場合、消費して成功確定イベントを発生させる
  if ((state.inventory[ItemId.GIFT_SWEETS] || 0) > 0) {
    state.inventory[ItemId.GIFT_SWEETS] = (state.inventory[ItemId.GIFT_SWEETS] || 0) - 1;
    
    const relBonus = 25;
    const sanityBonus = 10;
    // ランダムなアイテムを入手（お返し）
    let receivedItem = ItemId.BLACK_COFFEE;
    if (Math.random() < 0.3) receivedItem = ItemId.USB_MEMORY;
    else if (Math.random() < 0.6) receivedItem = ItemId.REFERENCE_BOOK;
    else receivedItem = ItemId.ENERGY_DRINK;

    state.relationships[RelationshipId.SENIOR] = clamp(state.relationships[RelationshipId.SENIOR] + relBonus, 0, 100);
    state.sanity = clamp(state.sanity + sanityBonus, 0, state.maxSanity);
    state.inventory[receivedItem] = (state.inventory[receivedItem] || 0) + 1;

    const details = joinMessages([
        formatDelta('先輩友好度', relBonus),
        formatDelta('SAN', sanityBonus),
        `アイテム入手: ${ITEMS[receivedItem].name}`
    ], ', ');

    pushLog(state, `【贈答】${ITEMS[ItemId.GIFT_SWEETS].name}を差し入れた。先輩は上機嫌だ！\n「おっ、気が利くな！これやるよ」とお返しを貰った。\n(${details})`, 'success');
    return state;
  }

  // --- 友好度判定による強制分岐メニュー (Rel >= 50) ---
  if (state.relationships[RelationshipId.SENIOR] >= 50) {
    const menuEvent = ALL_EVENTS.find(e => e.id === 'senior_interaction_menu');
    if (menuEvent) {
      const recordedState = recordEventOccurrence(state, menuEvent.id);
      recordedState.pendingEvent = menuEvent;
      return recordedState;
    }
  }

  // 通常処理 (ランダム)
  const newState = executeEvent(state, 'action_senior', "先輩は見当たらなかった。");

  // 過去問イベントが発生したかチェック (ID: senior_past_exam)
  if (newState.eventHistory[0] === 'senior_past_exam') {
    newState.flags.hasPastPapers = true;
  }

  return newState;
};

export const handleRelyFriend = (state: GameState): GameState => {
  // --- 友好度判定による強制分岐メニュー (Rel >= 40) ---
  if (state.relationships[RelationshipId.FRIEND] >= 40) {
    const menuEvent = ALL_EVENTS.find(e => e.id === 'friend_interaction_menu');
    if (menuEvent) {
      const recordedState = recordEventOccurrence(state, menuEvent.id);
      recordedState.pendingEvent = menuEvent;
      return recordedState;
    }
  }

  // 通常処理 (ランダム)
  const newState = executeEvent(state, 'action_friend', "友人は忙しいようだ。");

  // 友人経由で過去問を入手した場合のフラグ処理 (ID: friend_cloud_leak)
  if (newState.eventHistory[0] === 'friend_cloud_leak') {
    newState.flags.hasPastPapers = true;
  }

  return newState;
};
