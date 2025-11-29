
import { Item, ItemId } from '../types';
import { ITEMS } from '../data/items';

export type SortKey = 'DEFAULT' | 'HP' | 'SANITY' | 'CAFFEINE' | 'KNOWLEDGE';

export const SORT_LABELS: Record<SortKey, string> = {
  DEFAULT: '標準 (価格順)',
  HP: 'HP回復量',
  SANITY: 'SAN回復量',
  CAFFEINE: 'カフェイン量',
  KNOWLEDGE: '学力上昇量',
};

/**
 * アイテムリストを指定されたキーでソートして返す
 * 基本的に降順（効果が高い順）
 * 数値効果が0同士の場合は、バフ持ちを優先し、それ以外は価格順
 */
export const sortItems = (itemIds: ItemId[], key: SortKey): ItemId[] => {
  return [...itemIds].sort((aId, bId) => {
    const a = ITEMS[aId];
    const b = ITEMS[bId];
    
    // 1. デフォルトソート（価格昇順 -> ID順）
    if (key === 'DEFAULT') {
        if (a.price !== b.price) return a.price - b.price;
        return a.id.localeCompare(b.id);
    }

    // 値取得ヘルパー
    const getVal = (item: Item, k: SortKey): number => {
      const e = item.effects;
      if (!e) return 0;
      switch (k) {
        case 'HP': return e.hp || 0;
        case 'SANITY': return e.sanity || 0;
        case 'CAFFEINE': return e.caffeine || 0;
        case 'KNOWLEDGE': 
          // 学力は全科目の合計値で判断
          return e.knowledge ? Object.values(e.knowledge).reduce((acc, v) => acc + (v||0), 0) : 0;
        default: return 0;
      }
    };

    const valA = getVal(a, key);
    const valB = getVal(b, key);

    // 2. 数値比較（降順）
    if (valA !== valB) {
      return valB - valA;
    }

    // 3. 数値が同じ（主に0同士）の場合の「空気読み」ロジック
    // バフを持っているアイテムを優先する
    const aHasBuff = (a.effects?.buffs?.length || 0) > 0;
    const bHasBuff = (b.effects?.buffs?.length || 0) > 0;

    if (aHasBuff && !bHasBuff) return -1; // aを先頭へ
    if (!aHasBuff && bHasBuff) return 1;  // bを先頭へ

    // 4. それでも同じなら価格順（安い順＝買いやすい順）
    return a.price - b.price;
  });
};
