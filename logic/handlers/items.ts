
import { GameState, ItemId, SubjectId, LogEntry } from '../../types';
import { ITEMS } from '../../data/items';
import { SUBJECTS } from '../../data/subjects';
import { clamp, chance, formatDelta, joinMessages } from '../../utils/common';
import { pushLog } from '../stateHelpers';

export const handleBuyItem = (state: GameState, itemId: ItemId): GameState => {
  const item = ITEMS[itemId];
  if (state.money >= item.price) {
    state.money -= item.price;
    state.inventory[itemId] = (state.inventory[itemId] || 0) + 1;
    pushLog(state, `【購入】${item.name}を購入した。(残高: ¥${state.money})`, 'success');
  } else {
    pushLog(state, `【エラー】資金不足。${item.name}を買う金がない。`, 'danger');
  }
  return state;
};

export const handleUseItem = (state: GameState, itemId: ItemId): GameState => {
  if ((state.inventory[itemId] || 0) <= 0) return state;
  
  state.inventory[itemId] = (state.inventory[itemId] || 0) - 1;
  
  let details = "";
  let baseLog = "";
  let logType: LogEntry['type'] = 'info';

  switch (itemId) {
    case ItemId.BLACK_COFFEE: {
      // Increased from 40 to 50 to reach AWAKE threshold (50) immediately
      const cafDelta = 50;
      const hpDelta = 5;
      const sanDelta = 2;
      state.caffeine = clamp(state.caffeine + cafDelta, 0, 200);
      state.hp = clamp(state.hp + hpDelta, 0, state.maxHp);
      state.sanity = clamp(state.sanity + sanDelta, 0, state.maxSanity);
      baseLog = `【アイテム使用】${ITEMS[itemId].name}を一気飲み。脳に電流が走る。`;
      details = joinMessages([formatDelta('カフェイン', cafDelta), formatDelta('HP', hpDelta), formatDelta('SAN', sanDelta)], ', ');
      break;
    }
    case ItemId.CAFE_LATTE: {
      const cafDelta = 30;
      const hpDelta = 20;
      const sanDelta = 15;
      state.caffeine = clamp(state.caffeine + cafDelta, 0, 200);
      state.hp = clamp(state.hp + hpDelta, 0, state.maxHp);
      state.sanity = clamp(state.sanity + sanDelta, 0, state.maxSanity);
      baseLog = `【アイテム使用】${ITEMS[itemId].name}を飲んだ。糖分とミルクが五臓六腑に染み渡る。`;
      logType = 'success';
      details = joinMessages([formatDelta('カフェイン', cafDelta), formatDelta('HP', hpDelta), formatDelta('SAN', sanDelta)], ', ');
      break;
    }
    case ItemId.HIGH_CACAO_CHOCO: {
      const hpDelta = 10;
      const sanDelta = 15;
      // Increased from 10 to 15
      const cafDelta = 15;
      state.hp = clamp(state.hp + hpDelta, 0, state.maxHp);
      state.sanity = clamp(state.sanity + sanDelta, 0, state.maxSanity);
      state.caffeine = clamp(state.caffeine + cafDelta, 0, 200);
      baseLog = `【アイテム使用】${ITEMS[itemId].name}を食べた。カカオの苦味が焦燥感を少し和らげる。`;
      logType = 'success';
      details = joinMessages([formatDelta('HP', hpDelta), formatDelta('SAN', sanDelta), formatDelta('カフェイン', cafDelta)], ', ');
      break;
    }
    case ItemId.CUP_RAMEN: {
      const hpDelta = 40;
      const sanDelta = 10;
      state.hp = clamp(state.hp + hpDelta, 0, state.maxHp);
      state.sanity = clamp(state.sanity + sanDelta, 0, state.maxSanity);
      baseLog = `【アイテム使用】${ITEMS[itemId].name}を完食。スープまで飲み干し、満腹感で満たされた。`;
      logType = 'success';
      details = joinMessages([formatDelta('HP', hpDelta), formatDelta('SAN', sanDelta)], ', ');
      break;
    }
    case ItemId.ENERGY_DRINK: {
      const hpDelta = 10;
      const sanDelta = -10;
      const cafDelta = 90;
      state.hp = clamp(state.hp + hpDelta, 0, state.maxHp);
      state.sanity = clamp(state.sanity + sanDelta, 0, state.maxSanity);
      state.caffeine = clamp(state.caffeine + cafDelta, 0, 200);
      baseLog = `【アイテム使用】${ITEMS[itemId].name}を注入。視界がバチバチと明滅する。圧倒的な覚醒感。`;
      logType = 'warning';
      details = joinMessages([formatDelta('HP', hpDelta), formatDelta('SAN', sanDelta), formatDelta('カフェイン', cafDelta)], ', ');
      break;
    }
    case ItemId.EARPLUGS: {
      const sanDelta = 30;
      state.sanity = clamp(state.sanity + sanDelta, 0, state.maxSanity);
      baseLog = `【アイテム使用】${ITEMS[itemId].name}を装着。静寂こそが最高の薬だ。`;
      logType = 'success';
      details = joinMessages([formatDelta('SAN', sanDelta)], ', ');
      break;
    }
    case ItemId.GAMING_SUPPLEMENT: {
      state.activeBuffs.push({
        id: `BUFF_FOCUS_${state.turnCount}`,
        name: '集中モード',
        type: 'STUDY_EFFICIENCY',
        value: 1.5,
        duration: 5,
        description: '学習効率 x1.5'
      });
      state.activeBuffs.push({
        id: `BUFF_DRAIN_${state.turnCount}`,
        name: '反動',
        type: 'SANITY_DRAIN',
        value: 3,
        duration: 5,
        description: '毎ターンSAN-3'
      });
      baseLog = `【アイテム使用】${ITEMS[itemId].name}を摂取。世界がスローモーションに見える。`;
      logType = 'warning';
      details = "5ターンの間、学習効率UP & SAN減少";
      break;
    }
    case ItemId.HOT_EYE_MASK: {
      state.activeBuffs.push({
        id: `BUFF_RELAX_${state.turnCount}`,
        name: '温熱効果',
        type: 'REST_EFFICIENCY',
        value: 1.8,
        duration: 3,
        description: '休息効果 x1.8'
      });
      baseLog = `【アイテム使用】${ITEMS[itemId].name}を装着。目の奥の凝りが溶けていく。`;
      logType = 'success';
      details = "3ターンの間、休息回復量UP";
      break;
    }
    case ItemId.SMART_DRUG: {
      const sanDelta = -40;
      const hpDelta = -40;
      const knowDelta = 5;
      
      state.sanity = clamp(state.sanity + sanDelta, 0, state.maxSanity);
      state.hp = clamp(state.hp + hpDelta, 0, state.maxHp);
      
      Object.keys(state.knowledge).forEach((key) => {
        const id = key as SubjectId;
        state.knowledge[id] = clamp(state.knowledge[id] + knowDelta, 0, 100);
      });

      baseLog = `【ドーピング】${ITEMS[itemId].name}を服用。吐き気と引き換えに、思考速度が極限まで加速する。`;
      logType = 'danger';
      details = joinMessages([formatDelta('全学力', knowDelta), formatDelta('SAN', sanDelta), formatDelta('HP', hpDelta)], ', ');
      break;
    }
    case ItemId.REFERENCE_BOOK: {
      const lowestSub = Object.values(SubjectId).reduce((a, b) => state.knowledge[a] < state.knowledge[b] ? a : b);
      const kDelta = 15;
      state.knowledge[lowestSub] = clamp(state.knowledge[lowestSub] + kDelta, 0, 100);
      baseLog = `【アイテム使用】${ITEMS[itemId].name}を熟読。${SUBJECTS[lowestSub].name}の概念が脳に直接書き込まれた。`;
      logType = 'success';
      details = `${SUBJECTS[lowestSub].name}+${kDelta}`;
      break;
    }
    case ItemId.USB_MEMORY: {
       if (chance(70)) {
          const target = Object.values(SubjectId)[Math.floor(Math.random() * 4)];
          const kDelta = 20;
          state.knowledge[target] = clamp(state.knowledge[target] + kDelta, 0, 100);
          baseLog = `【アイテム解析】${ITEMS[itemId].name}から${SUBJECTS[target].name}の「神過去問」を発掘！勝利を確信した。`;
          logType = 'success';
          details = `${SUBJECTS[target].name}+${kDelta}`;
       } else {
          const sanDelta = -30;
          state.sanity = clamp(state.sanity + sanDelta, 0, state.maxSanity);
          baseLog = `【アイテム解析】${ITEMS[itemId].name}の中身は...ブラクラ画像だった。精神的ダメージを受けた。`;
          logType = 'danger';
          details = formatDelta('SAN', sanDelta) || "";
       }
       break;
    }
  }
  pushLog(state, `${baseLog}\n(${details})`, logType);
  return state;
};