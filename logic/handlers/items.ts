
import { GameState, ItemId, SubjectId, LogEntry, GameEventEffect } from '../../types';
import { ITEMS } from '../../data/items';
import { SUBJECTS } from '../../data/subjects';
import { getItemEffectDescription, joinMessages } from '../../utils/logFormatter';
import { formatSuccessRate } from '../../utils/math';
import { ACTION_LOGS, LOG_TEMPLATES } from '../../data/constants/logMessages';
import { pushLog } from '../stateHelpers';
import { applyEffect, mergeEffects } from '../effectProcessor';
import { rng } from '../../utils/rng';
import { KNOWLEDGE_THRESHOLDS, USB_SUCCESS_CONFIG } from '../../config/gameBalance';

export const handleBuyItem = (state: GameState, itemId: ItemId): GameState => {
  const item = ITEMS[itemId];
  if (state.money >= item.price) {
    const effect: GameEventEffect = {
      money: -item.price,
      inventory: { [itemId]: 1 }
    };
    const { newState } = applyEffect(state, effect);
    pushLog(newState, ACTION_LOGS.ITEM.BUY_SUCCESS(item.name, newState.money), 'success');
    return newState;
  } else {
    pushLog(state, ACTION_LOGS.ITEM.BUY_FAIL(item.name), 'danger');
    return state;
  }
};

export const handleUseItem = (state: GameState, itemId: ItemId): GameState => {
  if ((state.inventory[itemId] || 0) <= 0) return state;
  
  const item = ITEMS[itemId];
  
  // 基本効果（在庫消費を含む）
  let effect: GameEventEffect = {
    inventory: { [itemId]: -1 }
  };
  
  if (item.effects) {
    effect = mergeEffects(effect, item.effects);
  }

  let logType: LogEntry['type'] = 'info';
  let baseLog = ACTION_LOGS.ITEM.USE_DEFAULT(item.name);
  let itemSuccess = false;
  
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
      const kDelta = 20; // 15 -> 20 (Balance Patch v2.3)
      
      effect = mergeEffects(effect, { knowledge: { [lowestSub]: kDelta } });
      baseLog = `【攻略】${item.name}を熟読。高いだけあって要点がまとまっている。苦手な${SUBJECTS[lowestSub].name}の理解が一気に深まった。`;
      logType = 'success';
      break;
    }
    case ItemId.USB_MEMORY: {
       const algoScore = state.knowledge[SubjectId.ALGO] || 0;
       
       // Success rate logic:
       // If Algo >= 60 (Passing), success is guaranteed (capped at 95% for visual consistency)
       // If Algo < 60, it's a gamble starting at base rate
       let successRate = 0;
       if (algoScore >= USB_SUCCESS_CONFIG.GUARANTEED_THRESHOLD) {
         successRate = 95;
       } else {
         successRate = Math.min(95, USB_SUCCESS_CONFIG.BASE_RATE + (algoScore * USB_SUCCESS_CONFIG.ALGO_SCALAR));
       }

       if (rng.chance(successRate)) {
          const target = rng.pick(Object.values(SubjectId))!;
          const kDelta = 20;
          
          effect = mergeEffects(effect, { knowledge: { [target]: kDelta } });
          
          if (algoScore >= USB_SUCCESS_CONFIG.GUARANTEED_THRESHOLD) {
             baseLog = `【完全解析】(${formatSuccessRate(successRate)}) アルゴリズムの知識(${algoScore}点)で暗号化を完全に掌握！${SUBJECTS[target].name}の「神過去問」を発掘！(学習効率UP)`;
          } else {
             baseLog = `【解析成功】(${formatSuccessRate(successRate)}) アルゴリズムの知識を駆使し、運良く暗号化を解除！${SUBJECTS[target].name}の「神過去問」を発掘！(学習効率UP)`;
          }
          logType = 'success';
          itemSuccess = true;
       } else {
          effect = mergeEffects(effect, { sanity: -USB_SUCCESS_CONFIG.PENALTY_SANITY });
          baseLog = `【解析失敗】(${formatSuccessRate(successRate)}) 解析中にウィルスを踏んだ...。アルゴリズムの理解度(${algoScore}点)が足りなかったか？合格ライン(60点)未達のリスクが露呈した。`;
          logType = 'danger';
       }
       break;
    }
    case ItemId.VERIFIED_PAST_PAPERS: {
        // Very high success rate
        if (rng.chance(98)) {
            const target = rng.pick(Object.values(SubjectId))!;
            const kDelta = 30;
            
            effect = mergeEffects(effect, { knowledge: { [target]: kDelta } });
            baseLog = `【検証済み】${item.name}を活用した。${SUBJECTS[target].name}の出題傾向が完全に理解できた！(学習効率UP)`;
            logType = 'success';
            itemSuccess = true;
        } else {
            // Rare failure
            effect = mergeEffects(effect, { sanity: -10 });
            baseLog = `【破損】${item.name}を開こうとしたが、ファイルが破損していたようだ... 期待が裏切られた。`;
            logType = 'warning';
        }
        break;
    }
  }

  const { newState, messages } = applyEffect(state, effect);

  // Special State Updates: Increment Past Papers Counter
  if (itemSuccess) {
    newState.flags.hasPastPapers = (newState.flags.hasPastPapers || 0) + 1;
  }

  const details = joinMessages(messages, ', ');
  pushLog(newState, `${baseLog}\n(${details})`, logType);
  return newState;
};
