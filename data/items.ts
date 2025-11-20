
import { Item, ItemId } from '../types';

export const ITEMS: Record<ItemId, Item> = {
  [ItemId.USB_MEMORY]: {
    id: ItemId.USB_MEMORY,
    name: '先輩のUSB',
    description: '過去問データが入っている...かもしれない。',
    effectDescription: '成功でランダム科目+20 / 失敗でSAN大幅減 (使い切り)'
  },
  [ItemId.HIGH_CACAO_CHOCO]: {
    id: ItemId.HIGH_CACAO_CHOCO,
    name: '高カカオチョコ',
    description: '脳のエネルギー源。苦味が意識を繋ぎ止める。',
    effectDescription: 'HP+10, SAN+10, カフェイン-10 (使い切り)'
  },
  [ItemId.REFERENCE_BOOK]: {
    id: ItemId.REFERENCE_BOOK,
    name: '「わかる」本',
    description: '試験直前の駆け込み寺。',
    effectDescription: '最低点数の科目+15 (使い切り)'
  },
  [ItemId.SMART_DRUG]: {
    id: ItemId.SMART_DRUG,
    name: '怪しいサプリ',
    description: '個人輸入した未承認薬。震えと引き換えに冴えを得る。',
    effectDescription: 'SAN+40, HP-15, カフェイン+50 (使い切り)'
  }
};
