
import { GameState, ItemId, SubjectId, LogEntry } from '../../types';
import { ITEMS } from '../../data/items';
import { SUBJECTS } from '../../data/subjects';
import { clamp, chance } from '../../utils/common';
import { getItemEffectDescription } from '../../utils/logFormatter';
import { ACTION_LOGS, LOG_TEMPLATES } from '../../data/constants/logMessages';
import { pushLog } from '../stateHelpers';
import { applyEffect } from '../effectProcessor';

export const handleBuyItem = (state: GameState, itemId: ItemId): GameState => {
  const item = ITEMS[itemId];
  if (state.money >= item.price) {
    state.money -= item.price;
    state.inventory[itemId] = (state.inventory[itemId] || 0) + 1;
    pushLog(state, ACTION_LOGS.ITEM.BUY_SUCCESS(item.name, state.money), 'success');
  } else {
    pushLog(state, ACTION_LOGS.ITEM.BUY_FAIL(item.name), 'danger');
  }
  return state;
};

export const handleUseItem = (state: GameState, itemId: ItemId): GameState => {
  if ((state.inventory[itemId] || 0) <= 0) return state;
  
  let newState = { ...state };
  const item = ITEMS[itemId];
  newState.inventory[itemId] = (newState.inventory[itemId] || 0) - 1;
  
  let logType: LogEntry['type'] = 'info';
  let baseLog = ACTION_LOGS.ITEM.USE_DEFAULT(item.name);
  
  // --- 汎用効果の適用 (Data Driven) ---
  // Types are now unified in assets.ts, so we can pass item.effects directly
  if (item.effects) {
    const res = applyEffect(newState, item.effects);
    newState = res.newState;
    // メッセージは getItemEffectDescription で一括生成するため、res.messages はここでは使用しない
    // または、res.messages を details として使うことも可能だが、現状のUIに合わせる
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
      // Custom logic for lowest subject boost (Can't be genericized easily)
      const lowestSub = Object.values(SubjectId).reduce((a, b) => newState.knowledge[a] < newState.knowledge[b] ? a : b);
      const kDelta = 15;
      newState.knowledge[lowestSub] = clamp(newState.knowledge[lowestSub] + kDelta, 0, 100);
      baseLog = `【攻略】${item.name}を熟読。高いだけあって要点がまとまっている。苦手な${SUBJECTS[lowestSub].name}の理解が一気に深まった。`;
      logType = 'success';
      pushLog(newState, `${baseLog}\n(${LOG_TEMPLATES.PARAM.KNOWLEDGE(SUBJECTS[lowestSub].name, kDelta)})`, logType);
      return newState; 
    }
    case ItemId.USB_MEMORY: {
       if (chance(60)) {
          const target = Object.values(SubjectId)[Math.floor(Math.random() * 4)];
          const kDelta = 20;
          newState.knowledge[target] = clamp(newState.knowledge[target] + kDelta, 0, 100);
          newState.flags.hasPastPapers = true;
          baseLog = `【解析成功】${item.name}から${SUBJECTS[target].name}の「神過去問」を発掘！これが先輩たちの遺産か...！`;
          logType = 'success';
          pushLog(newState, `${baseLog}\n(${LOG_TEMPLATES.PARAM.KNOWLEDGE(SUBJECTS[target].name, kDelta)})`, logType);
       } else {
          const sanDelta = -20; 
          newState.sanity = clamp(newState.sanity + sanDelta, 0, newState.maxSanity);
          baseLog = `【解析失敗】${item.name}の中身は...大量のウィルス入りファイルだった。PCがフリーズし、精神的ダメージを受けた。`;
          logType = 'danger';
          pushLog(newState, `${baseLog}\n(${LOG_TEMPLATES.PARAM.SAN(sanDelta)})`, logType);
       }
       return newState;
    }
  }

  const detailsStr = getItemEffectDescription(item);
  pushLog(newState, `${baseLog}\n(${detailsStr})`, logType);
  return newState;
};
