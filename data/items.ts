
import { Item, ItemId } from '../types';

export const ITEMS: Record<ItemId, Item> = {
  [ItemId.USB_MEMORY]: {
    id: ItemId.USB_MEMORY,
    name: '先輩のUSB',
    description: '過去問データが入っている...かもしれない。',
    effectDescription: '成功でランダム科目+20 / 失敗でSAN大幅減 (使い切り)',
    price: 99999, // 非売品
  },
  [ItemId.BLACK_COFFEE]: {
    id: ItemId.BLACK_COFFEE,
    name: '缶コーヒー(微糖)',
    description: '自販機の安いやつ。とりあえず脳を叩き起こす。',
    effectDescription: 'カフェイン+50, HP+5, SAN+2 (使い切り)',
    price: 150,
  },
  [ItemId.CAFE_LATTE]: {
    id: ItemId.CAFE_LATTE,
    name: 'カフェラテ',
    description: 'ミルクの優しさが荒んだ心を癒やす。',
    effectDescription: 'カフェイン+30, HP+20, SAN+15 (使い切り)',
    price: 350,
  },
  [ItemId.HIGH_CACAO_CHOCO]: {
    id: ItemId.HIGH_CACAO_CHOCO,
    name: '高カカオチョコ',
    description: '脳のエネルギー源。苦味が意識を繋ぎ止める。',
    effectDescription: 'HP+10, SAN+15, カフェイン+15 (使い切り)',
    price: 250,
  },
  [ItemId.ENERGY_DRINK]: {
    id: ItemId.ENERGY_DRINK,
    name: 'ZONe (Ver.Infinity)',
    description: 'デジタル没入エナジー。もはや合法ドラッグ。',
    effectDescription: 'カフェイン+90, HP+10, SAN-10 (使い切り)',
    price: 400,
  },
  [ItemId.CUP_RAMEN]: {
    id: ItemId.CUP_RAMEN,
    name: '激辛カップ麺',
    description: '深夜の研究室の味。内臓への負担と引き換えに満足感を得る。',
    effectDescription: 'HP+40, SAN+10 (使い切り)',
    price: 450,
  },
  [ItemId.EARPLUGS]: {
    id: ItemId.EARPLUGS,
    name: '高性能耳栓',
    description: '世界のノイズを遮断し、内なる宇宙と対話する。',
    effectDescription: 'SAN+30 (使い切り)',
    price: 1200,
  },
  [ItemId.REFERENCE_BOOK]: {
    id: ItemId.REFERENCE_BOOK,
    name: '「わかる」本',
    description: '試験直前の駆け込み寺。高いが背に腹は代えられない。',
    effectDescription: '最低点数の科目+15 (使い切り)',
    price: 6000,
  },
  [ItemId.GAMING_SUPPLEMENT]: {
    id: ItemId.GAMING_SUPPLEMENT,
    name: 'ゲーミングサプリ',
    description: '集中力ブースト。副作用で精神が少しずつ削れる。',
    effectDescription: '5ターンの間、学習効率1.5倍 & 毎ターンSAN-3',
    price: 3500,
  },
  [ItemId.HOT_EYE_MASK]: {
    id: ItemId.HOT_EYE_MASK,
    name: 'ホットアイマスク',
    description: '目の疲れを癒やし、休息の質を高める。',
    effectDescription: '3ターンの間、休息コマンドの効果1.8倍',
    price: 1000,
  },
  [ItemId.SMART_DRUG]: {
    id: ItemId.SMART_DRUG,
    name: '怪しいサプリ',
    description: '個人輸入した未承認薬。寿命と引き換えに脳をオーバークロックする。',
    effectDescription: '全科目学力+5, HP-40, SAN-40 (使い切り)',
    price: 15000,
  }
};