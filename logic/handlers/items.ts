
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
      const cafDelta = 50;
      const hpDelta = 5;
      const sanDelta = 2;
      state.caffeine = clamp(state.caffeine + cafDelta, 0, 200);
      state.hp = clamp(state.hp + hpDelta, 0, state.maxHp);
      state.sanity = clamp(state.sanity + sanDelta, 0, state.maxSanity);
      baseLog = `【アイテム使用】${ITEMS[itemId].name}を一気飲み。安っぽい苦味が、無理やり脳を叩き起こす。`;
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
      baseLog = `【アイテム使用】${ITEMS[itemId].name}を飲んだ。少し高いだけあって、ミルクの優しさが荒んだ心に染みる。`;
      logType = 'success';
      details = joinMessages([formatDelta('カフェイン', cafDelta), formatDelta('HP', hpDelta), formatDelta('SAN', sanDelta)], ', ');
      break;
    }
    case ItemId.HIGH_CACAO_CHOCO: {
      const hpDelta = 10;
      const sanDelta = 15;
      const cafDelta = 15;
      state.hp = clamp(state.hp + hpDelta, 0, state.maxHp);
      state.sanity = clamp(state.sanity + sanDelta, 0, state.maxSanity);
      state.caffeine = clamp(state.caffeine + cafDelta, 0, 200);
      baseLog = `【アイテム使用】${ITEMS[itemId].name}を食べた。カカオポリフェノールが脳細胞を保護している...と信じたい。`;
      logType = 'success';
      details = joinMessages([formatDelta('HP', hpDelta), formatDelta('SAN', sanDelta), formatDelta('カフェイン', cafDelta)], ', ');
      break;
    }
    case ItemId.CUP_RAMEN: {
      const hpDelta = 40;
      const sanDelta = 10;
      state.hp = clamp(state.hp + hpDelta, 0, state.maxHp);
      state.sanity = clamp(state.sanity + sanDelta, 0, state.maxSanity);
      baseLog = `【アイテム使用】${ITEMS[itemId].name}をすする。ジャンクな塩分が、疲弊した肉体に活力を与える。`;
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
      baseLog = `【アイテム使用】${ITEMS[itemId].name}を注入。視界がバチバチと明滅する。400円分の寿命を前借りした感覚だ。`;
      logType = 'warning';
      details = joinMessages([formatDelta('HP', hpDelta), formatDelta('SAN', sanDelta), formatDelta('カフェイン', cafDelta)], ', ');
      break;
    }
    case ItemId.EARPLUGS: {
      const sanDelta = 30;
      state.sanity = clamp(state.sanity + sanDelta, 0, state.maxSanity);
      baseLog = `【アイテム使用】${ITEMS[itemId].name}を装着。2000円近くしただけあって、完全なる静寂が訪れた。`;
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
      baseLog = `【アイテム使用】${ITEMS[itemId].name}を摂取。5000円もしたのだ、効果がないと困る。世界がスローモーションに見え始めた。`;
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
      baseLog = `【アイテム使用】${ITEMS[itemId].name}を装着。じんわりとした温かさが、眼精疲労を溶かしていく。`;
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

      baseLog = `【禁断】約3万円の${ITEMS[itemId].name}を震える手で服用。内臓が焼けるような感覚と共に、脳の処理能力が限界を突破する！`;
      logType = 'danger';
      details = joinMessages([formatDelta('全学力', knowDelta), formatDelta('SAN', sanDelta), formatDelta('HP', hpDelta)], ', ');
      break;
    }
    case ItemId.REFERENCE_BOOK: {
      const lowestSub = Object.values(SubjectId).reduce((a, b) => state.knowledge[a] < state.knowledge[b] ? a : b);
      const kDelta = 15;
      state.knowledge[lowestSub] = clamp(state.knowledge[lowestSub] + kDelta, 0, 100);
      baseLog = `【アイテム使用】${ITEMS[itemId].name}を熟読。1万円近い投資だ、一文字も見逃さない。${SUBJECTS[lowestSub].name}の理解が一気に深まった。`;
      logType = 'success';
      details = `${SUBJECTS[lowestSub].name}+${kDelta}`;
      break;
    }
    case ItemId.USB_MEMORY: {
       if (chance(70)) {
          const target = Object.values(SubjectId)[Math.floor(Math.random() * 4)];
          const kDelta = 20;
          state.knowledge[target] = clamp(state.knowledge[target] + kDelta, 0, 100);
          baseLog = `【アイテム解析】${ITEMS[itemId].name}から${SUBJECTS[target].name}の「神過去問」を発掘！これが先輩たちの遺産か...！`;
          logType = 'success';
          details = `${SUBJECTS[target].name}+${kDelta}`;
       } else {
          const sanDelta = -30;
          state.sanity = clamp(state.sanity + sanDelta, 0, state.maxSanity);
          baseLog = `【アイテム解析】${ITEMS[itemId].name}の中身は...大量のブラクラ画像だった。信じていたのに...精神的ダメージを受けた。`;
          logType = 'danger';
          details = formatDelta('SAN', sanDelta) || "";
       }
       break;
    }
  }
  pushLog(state, `${baseLog}\n(${details})`, logType);
  return state;
};
