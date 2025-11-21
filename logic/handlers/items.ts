
import { GameState, ItemId, SubjectId, LogEntry } from '../../types';
import { ITEMS } from '../../data/items';
import { SUBJECTS } from '../../data/subjects';
import { clamp, chance, formatDelta, joinMessages, getItemEffectDescription } from '../../utils/common';
import { pushLog } from '../stateHelpers';

export const handleBuyItem = (state: GameState, itemId: ItemId): GameState => {
  const item = ITEMS[itemId];
  if (state.money >= item.price) {
    state.money -= item.price;
    state.inventory[itemId] = (state.inventory[itemId] || 0) + 1;
    pushLog(state, `【購入】${item.name}を購入した。(残高: ¥${state.money.toLocaleString()})`, 'success');
  } else {
    pushLog(state, `【エラー】資金不足。${item.name}を買う金がない。`, 'danger');
  }
  return state;
};

export const handleUseItem = (state: GameState, itemId: ItemId): GameState => {
  if ((state.inventory[itemId] || 0) <= 0) return state;
  
  const item = ITEMS[itemId];
  state.inventory[itemId] = (state.inventory[itemId] || 0) - 1;
  
  let logType: LogEntry['type'] = 'info';
  let baseLog = `【アイテム使用】${item.name}を使用した。`;
  
  // --- 汎用効果の適用 (Data Driven) ---
  if (item.effects) {
    const { effects } = item;
    
    if (effects.hp) state.hp = clamp(state.hp + effects.hp, 0, state.maxHp);
    if (effects.sanity) state.sanity = clamp(state.sanity + effects.sanity, 0, state.maxSanity);
    if (effects.caffeine) state.caffeine = clamp(state.caffeine + effects.caffeine, 0, 200);
    
    // 全科目への知識効果 (Smart Drug等)
    if (effects.knowledge) {
      Object.keys(state.knowledge).forEach((key) => {
        const id = key as SubjectId;
        state.knowledge[id] = clamp(state.knowledge[id] + (effects.knowledge || 0), 0, 100);
      });
    }

    // バフの適用
    if (effects.buffs) {
      effects.buffs.forEach(buffData => {
        state.activeBuffs.push({
          ...buffData,
          id: `BUFF_${itemId}_${state.turnCount}_${Math.random()}` // ユニークID生成
        });
      });
    }
  }

  // --- 特殊効果 & フレーバーテキスト (Custom Logic) ---
  switch (itemId) {
    case ItemId.MINERAL_WATER:
      baseLog = `【デトックス】${item.name}を一気飲みした。血液が希釈され、カフェイン濃度が下がる感覚がある。`;
      break;
    case ItemId.BLACK_COFFEE:
      baseLog = `【覚醒】${item.name}のプルタブを開ける。馴染みのある苦味が脳のスイッチを入れる。`;
      break;
    case ItemId.GUMMY_CANDY:
      baseLog = `【咀嚼】${item.name}を無心で噛み続ける。顎への刺激がストレスを少し和らげてくれた。`;
      break;
    case ItemId.PROTEIN_BAR:
      baseLog = `【栄養補給】${item.name}を齧る。パサパサしているが、筋肉と脳のエネルギーになる。`;
      logType = 'success';
      break;
    case ItemId.HERBAL_TEA:
      baseLog = `【安らぎ】${item.name}の香りが鼻腔をくすぐる。張り詰めた神経が緩み、SAN値が回復していく。`;
      logType = 'success';
      break;
    case ItemId.CAFE_LATTE:
      baseLog = `【癒やし】${item.name}を飲んだ。ミルクの優しさが荒んだ心に染みる。`;
      logType = 'success';
      break;
    case ItemId.HIGH_CACAO_CHOCO:
      baseLog = `【糖分】${item.name}を食べた。カカオポリフェノールが脳細胞を保護している...と信じたい。`;
      logType = 'success';
      break;
    case ItemId.CUP_RAMEN:
      baseLog = `【夜食】${item.name}をすする。ジャンクな塩分が、疲弊した肉体に活力を与える。`;
      logType = 'success';
      break;
    case ItemId.ENERGY_DRINK:
      baseLog = `【注入】${item.name}を流し込む。視界がバチバチと明滅する。寿命を削って集中力を買った。`;
      logType = 'warning';
      break;
    case ItemId.EARPLUGS:
      baseLog = `【遮断】${item.name}を装着。完全なる静寂が訪れ、自分だけの世界に没入する。`;
      logType = 'success';
      break;
    case ItemId.GAMING_SUPPLEMENT:
      baseLog = `【ブースト】${item.name}を摂取。世界がスローモーションに見え始めた。`;
      logType = 'warning';
      break;
    case ItemId.HOT_EYE_MASK:
      baseLog = `【休息】${item.name}を装着。じんわりとした温かさが、眼精疲労を溶かしていく。`;
      logType = 'success';
      break;
    case ItemId.SMART_DRUG:
      baseLog = `【禁断】${item.name}を服用。脳のリミッターが外れる音がした。副作用で視界が歪んでいるが、思考速度は神の領域だ。`;
      logType = 'warning';
      break;
      
    case ItemId.REFERENCE_BOOK: {
      const lowestSub = Object.values(SubjectId).reduce((a, b) => state.knowledge[a] < state.knowledge[b] ? a : b);
      const kDelta = 15;
      state.knowledge[lowestSub] = clamp(state.knowledge[lowestSub] + kDelta, 0, 100);
      baseLog = `【攻略】${item.name}を熟読。高いだけあって要点がまとまっている。苦手な${SUBJECTS[lowestSub].name}の理解が一気に深まった。`;
      logType = 'success';
      pushLog(state, `${baseLog}\n(${SUBJECTS[lowestSub].name}+${kDelta})`, logType);
      return state; 
    }
    case ItemId.USB_MEMORY: {
       // Balance Adjust: 70% -> 60% success, -30 SAN -> -20 SAN
       if (chance(60)) {
          const target = Object.values(SubjectId)[Math.floor(Math.random() * 4)];
          const kDelta = 20;
          state.knowledge[target] = clamp(state.knowledge[target] + kDelta, 0, 100);
          // USB解析成功で過去問入手
          state.flags.hasPastPapers = true;
          baseLog = `【解析成功】${item.name}から${SUBJECTS[target].name}の「神過去問」を発掘！これが先輩たちの遺産か...！`;
          logType = 'success';
          pushLog(state, `${baseLog}\n(${SUBJECTS[target].name}+${kDelta})`, logType);
       } else {
          const sanDelta = -20; // Mitigated penalty
          state.sanity = clamp(state.sanity + sanDelta, 0, state.maxSanity);
          baseLog = `【解析失敗】${item.name}の中身は...大量のウィルス入りファイルだった。PCがフリーズし、精神的ダメージを受けた。`;
          logType = 'danger';
          pushLog(state, `${baseLog}\n(${formatDelta('SAN', sanDelta)})`, logType);
       }
       return state;
    }
  }

  // 汎用ログ生成
  const details = getItemEffectDescription(item);
  pushLog(state, `${baseLog}\n(${details})`, logType);
  return state;
};
