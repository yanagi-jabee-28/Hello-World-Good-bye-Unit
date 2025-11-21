
import { GameState, RelationshipId, SubjectId, ItemId } from '../../types';
import { clamp, formatDelta, joinMessages } from '../../utils/common';
import { executeEvent } from '../eventManager';
import { pushLog } from '../stateHelpers';
import { ITEMS } from '../../data/items';

export const handleAskProfessor = (state: GameState): GameState => {
  let newState = executeEvent(state, 'action_professor', "教授室は留守のようだ。");
  
  // Bonus if relationship improved
  if (newState.relationships[RelationshipId.PROFESSOR] > state.relationships[RelationshipId.PROFESSOR]) {
      const subIds = Object.values(SubjectId);
      const target = subIds[Math.floor(Math.random() * subIds.length)];
      newState.knowledge[target] = clamp(newState.knowledge[target] + 5, 0, 100);
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
    // USBメモリが出る確率を高める
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

  // 通常処理
  return executeEvent(state, 'action_senior', "先輩は見当たらなかった。");
};

export const handleRelyFriend = (state: GameState): GameState => {
  return executeEvent(state, 'action_friend', "友人は忙しいようだ。");
};
