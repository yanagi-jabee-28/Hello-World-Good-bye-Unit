
import { Item, ItemId } from '../types';

export const ITEMS: Record<ItemId, Item> = {
  [ItemId.USB_MEMORY]: {
    id: ItemId.USB_MEMORY,
    name: '先輩のUSB',
    description: '過去問データが入っている...かもしれない。',
    specialEffectDescription: '成功でランダム科目+20 / 失敗でSAN大幅減 (使い切り)',
    price: 99999, // 非売品
  },
  // --- Level 1: Cheap & Light Effect ---
  [ItemId.MINERAL_WATER]: {
    id: ItemId.MINERAL_WATER,
    name: 'ミネラルウォーター',
    description: 'カフェイン濃度を中和(-50mg)し、リセットする。',
    price: 110,
    effects: {
      caffeine: -50, // 計算しやすいよう50刻み
      hp: 5,
      sanity: 2
    }
  },
  [ItemId.BLACK_COFFEE]: {
    id: ItemId.BLACK_COFFEE,
    name: '缶コーヒー(微糖)',
    description: '覚醒剤代わり。1本で覚醒状態(40mg~)へ。2ターン効果が続く。',
    price: 140,
    effects: {
      caffeine: 50, // 0 -> 50(Awake) -> 40(Awake) -> 30(Normal)
      hp: 5,
      sanity: 2
    }
  },
  [ItemId.GUMMY_CANDY]: {
    id: ItemId.GUMMY_CANDY,
    name: 'ハードグミ',
    description: '噛むことでストレスを軽減。顎が疲れるくらいの弾力が良い。',
    price: 160,
    effects: {
      sanity: 12, 
      hp: 2
    }
  },
  // --- Level 2: Moderate & Specific ---
  [ItemId.PROTEIN_BAR]: {
    id: ItemId.PROTEIN_BAR,
    name: 'プロテインバー',
    description: '手軽にタンパク質補給。勉強に必要なのは根性ではなく筋肉だ。',
    price: 220,
    effects: {
      hp: 30, // HP回復強化
    }
  },
  [ItemId.HIGH_CACAO_CHOCO]: {
    id: ItemId.HIGH_CACAO_CHOCO,
    name: '高カカオチョコ',
    description: '脳のエネルギー源。苦味が意識を繋ぎ止める。',
    price: 300,
    effects: {
      hp: 5,
      sanity: 15,
      caffeine: 20 // 微調整用
    }
  },
  [ItemId.CAFE_LATTE]: {
    id: ItemId.CAFE_LATTE,
    name: 'カフェラテ',
    description: 'ミルクの優しさが荒んだ心を癒やす。バランスが良い。',
    price: 350,
    effects: {
      caffeine: 30, 
      hp: 15,
      sanity: 15 
    }
  },
  // --- Level 3: High Effect & Risk ---
  [ItemId.ENERGY_DRINK]: {
    id: ItemId.ENERGY_DRINK,
    name: 'ZONe (Ver.Infinity)',
    description: 'デジタル没入エナジー。一撃でZONE(100mg~)へ突入する。',
    price: 400,
    effects: {
      caffeine: 120, // 0 -> 120(ZONE)
      hp: 10,
      sanity: -5 
    }
  },
  [ItemId.HERBAL_TEA]: {
    id: ItemId.HERBAL_TEA,
    name: '高級ハーブティー',
    description: 'カモミールとラベンダーの香り。カフェインを強力に排出(-100mg)。',
    price: 450,
    effects: {
      caffeine: -100, // 強力なリセット
      sanity: 30,
      hp: 5
    }
  },
  [ItemId.CUP_RAMEN]: {
    id: ItemId.CUP_RAMEN,
    name: '激辛カップ麺',
    description: '深夜の研究室の味。内臓への負担と引き換えに満足感を得る。',
    price: 450,
    effects: {
      hp: 50, 
      sanity: 5
    }
  },
  // --- Level 4: Utilities & Buffs ---
  [ItemId.HOT_EYE_MASK]: {
    id: ItemId.HOT_EYE_MASK,
    name: 'ホットアイマスク',
    description: '目の疲れを癒やし、休息の質を高める。',
    price: 1500,
    effects: {
      buffs: [
        {
          name: '温熱効果',
          type: 'REST_EFFICIENCY',
          value: 1.5,
          duration: 3,
          description: '休息効果1.5倍'
        }
      ]
    }
  },
  [ItemId.EARPLUGS]: {
    id: ItemId.EARPLUGS,
    name: '高性能耳栓',
    description: '世界のノイズを遮断し、内なる宇宙と対話する。',
    price: 1980,
    effects: {
      sanity: 40 
    }
  },
  [ItemId.GIFT_SWEETS]: {
    id: ItemId.GIFT_SWEETS,
    name: '手土産スイーツ',
    description: 'デパ地下で買った高級菓子。先輩への貢ぎ物として最強。',
    specialEffectDescription: '「先輩」コマンドで使用。友好度大幅UP&成功確定',
    price: 3500,
  },
  [ItemId.GAMING_SUPPLEMENT]: {
    id: ItemId.GAMING_SUPPLEMENT,
    name: 'ゲーミングサプリ',
    description: '集中力ブースト。副作用で精神が少しずつ削れる。',
    price: 5800,
    effects: {
      buffs: [
        {
          name: '集中モード',
          type: 'STUDY_EFFICIENCY',
          value: 1.3, // マイルドに調整
          duration: 5,
          description: '学習効率1.3倍'
        },
        {
          name: '反動',
          type: 'SANITY_DRAIN',
          value: 2,
          duration: 5,
          description: '毎ターンSAN-2'
        }
      ]
    }
  },
  // --- Level 5: Ultimate ---
  [ItemId.REFERENCE_BOOK]: {
    id: ItemId.REFERENCE_BOOK,
    name: '「わかる」本',
    description: '試験直前の駆け込み寺。専門書は高いが背に腹は代えられない。',
    specialEffectDescription: '最低点数の科目+15 (使い切り)',
    price: 9800,
  },
  [ItemId.SMART_DRUG]: {
    id: ItemId.SMART_DRUG,
    name: '怪しいサプリ',
    description: '脳内物質を強制分泌させる未承認薬。学習効率が劇的に向上するが、反動も大きい。',
    price: 12800,
    effects: {
      hp: -20, 
      buffs: [
        {
          name: '限界突破',
          type: 'STUDY_EFFICIENCY',
          value: 2.0,
          duration: 4,
          description: '学習効率2倍'
        },
        {
          name: '精神崩壊',
          type: 'SANITY_DRAIN',
          value: 8, 
          duration: 4,
          description: '毎ターンSAN-8'
        }
      ]
    },
  },
};
