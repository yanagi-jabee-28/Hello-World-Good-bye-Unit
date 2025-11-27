
import { Item, ItemId } from '../types';

export const ITEMS: Record<ItemId, Item> = {
  [ItemId.USB_MEMORY]: {
    id: ItemId.USB_MEMORY,
    name: '先輩のUSB',
    description: '過去問データが入っている...かもしれない。',
    specialEffectDescription: '確率(60%)で科目+20 / 失敗でSAN-20 (使い切り)',
    price: 99999, // 非売品
  },
  // --- Level 1: Cheap & Light Effect ---
  [ItemId.MINERAL_WATER]: {
    id: ItemId.MINERAL_WATER,
    name: 'ミネラルウォーター',
    description: '口の中をさっぱりさせる。カフェインが少し抜ける。',
    price: 120, // 110 -> 120
    effects: {
      caffeine: -15, // -50 -> -15: ガブ飲みしないと抜けないように変更
      hp: 2, // 5 -> 2
      sanity: 1, // 2 -> 1
      satiety: 5 // 8 -> 5
    }
  },
  [ItemId.BLACK_COFFEE]: {
    id: ItemId.BLACK_COFFEE,
    name: '缶コーヒー(微糖)',
    description: '覚醒剤代わり。1本で覚醒状態(40mg~)へ。',
    price: 160,
    effects: {
      caffeine: 50,
      hp: 2,
      sanity: 2,
      satiety: 12 // 液体だが刺激物
    }
  },
  [ItemId.GUMMY_CANDY]: {
    id: ItemId.GUMMY_CANDY,
    name: 'ハードグミ',
    description: '噛むことでストレスを軽減。顎が疲れるくらいの弾力が良い。',
    price: 180,
    effects: {
      sanity: 15,
      hp: 2,
      satiety: 18 // よく噛んで食べるので
    }
  },
  [ItemId.RICE_BALL]: {
    id: ItemId.RICE_BALL,
    name: 'コンビニおにぎり',
    description: 'コスパ最強の炭水化物。腹を満たすならこれ。',
    price: 150,
    effects: {
      hp: 15,
      satiety: 50 // 米はずっしり来る
    }
  },
  // --- Level 2: Moderate & Specific ---
  [ItemId.PROTEIN_BAR]: {
    id: ItemId.PROTEIN_BAR,
    name: 'プロテインバー',
    description: '手軽にタンパク質補給。勉強に必要なのは根性ではなく筋肉だ。',
    price: 250,
    effects: {
      hp: 35,
      satiety: 35 // 固形物としてしっかり
    }
  },
  [ItemId.ENERGY_JELLY]: {
    id: ItemId.ENERGY_JELLY,
    name: 'エナジーゼリー',
    description: '10秒でチャージ。満腹になりにくく、即効性の元気が出る。',
    price: 280,
    effects: {
      hp: 25,
      caffeine: 20,
      satiety: 15 // 流動食なので軽い
    }
  },
  [ItemId.HIGH_CACAO_CHOCO]: {
    id: ItemId.HIGH_CACAO_CHOCO,
    name: '高カカオチョコ',
    description: '脳のエネルギー源。苦味が意識を繋ぎ止める。',
    price: 320,
    effects: {
      hp: 5,
      sanity: 18,
      caffeine: 15,
      satiety: 22 // 脂質
    }
  },
  [ItemId.CAFE_LATTE]: {
    id: ItemId.CAFE_LATTE,
    name: 'カフェラテ',
    description: 'ミルクの優しさが荒んだ心を癒やす。バランスが良い。',
    price: 380,
    effects: {
      caffeine: 30, 
      hp: 15,
      sanity: 15,
      satiety: 25 // ミルク分でお腹にたまる
    }
  },
  [ItemId.DIGESTIVE_ENZYME]: {
    id: ItemId.DIGESTIVE_ENZYME,
    name: '強力消化酵素',
    description: '胃の中身を急速分解し、満腹度を下げる。食べ過ぎた時や連食したい時に。',
    price: 450,
    effects: {
      satiety: -60, // 強力にリセット
      hp: -3 // 副作用緩和
    }
  },
  // --- Level 3: High Effect & Risk ---
  [ItemId.ENERGY_DRINK]: {
    id: ItemId.ENERGY_DRINK,
    name: 'ZONe (Ver.Infinity)',
    description: 'デジタル没入エナジー。カフェインを大量摂取し、一気に集中モードへ。',
    price: 550,
    effects: {
      caffeine: 120,
      hp: 10,
      sanity: -5,
      satiety: 20 // 炭酸でお腹が膨れる
    }
  },
  [ItemId.HERBAL_TEA]: {
    id: ItemId.HERBAL_TEA,
    name: '高級ハーブティー',
    description: 'カモミールとラベンダーの香り。カフェインを強力に排出(-100mg)。',
    price: 600,
    effects: {
      caffeine: -100,
      sanity: 35,
      hp: 5,
      satiety: 10 // 温かい飲み物
    }
  },
  [ItemId.CUP_RAMEN]: {
    id: ItemId.CUP_RAMEN,
    name: '激辛カップ麺',
    description: '深夜の研究室の味。内臓への負担と引き換えに満足感を得る。',
    price: 480,
    effects: {
      hp: 55,
      sanity: 5,
      satiety: 75 // かなり重い
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
          duration: 4,
          description: '休息効果1.5倍'
        }
      ]
    }
  },
  [ItemId.EARPLUGS]: {
    id: ItemId.EARPLUGS,
    name: '高性能耳栓',
    description: '世界のノイズを遮断し、内なる宇宙と対話する。',
    price: 2200,
    effects: {
      sanity: 45
    }
  },
  [ItemId.GIFT_SWEETS]: {
    id: ItemId.GIFT_SWEETS,
    name: '手土産スイーツ',
    description: 'デパ地下で買った高級菓子。目上の人への貢ぎ物として最強。',
    specialEffectDescription: '「先輩」または「教授」コマンドで使用。友好度大幅UP&成功確定',
    price: 3500,
  },
  [ItemId.GAMING_SUPPLEMENT]: {
    id: ItemId.GAMING_SUPPLEMENT,
    name: 'ゲーミングサプリ',
    description: '集中力ブースト。副作用で精神が少しずつ削れる。',
    price: 4500,
    effects: {
      buffs: [
        {
          name: '集中モード',
          type: 'STUDY_EFFICIENCY',
          value: 1.2,
          duration: 4,
          description: '学習効率1.2倍'
        },
        {
          name: '反動',
          type: 'SANITY_DRAIN',
          value: 4,
          duration: 4,
          description: '毎ターンSAN-4'
        }
      ],
      satiety: 5 // カプセル
    }
  },
  // --- Level 5: Ultimate ---
  [ItemId.REFERENCE_BOOK]: {
    id: ItemId.REFERENCE_BOOK,
    name: '「わかる」本',
    description: '試験直前の駆け込み寺。専門書は高いが背に腹は代えられない。',
    specialEffectDescription: '最低点数の科目+15 (使い切り)',
    price: 10800,
  },
  [ItemId.SMART_DRUG]: {
    id: ItemId.SMART_DRUG,
    name: '怪しいサプリ',
    description: '脳内物質を強制分泌させる未承認薬。学習効率が劇的に向上するが、反動も大きい。',
    price: 15800,
    effects: {
      hp: -40,
      buffs: [
        {
          name: '限界突破',
          type: 'STUDY_EFFICIENCY',
          value: 2.0,
          duration: 3,
          description: '学習効率2倍'
        },
        {
          name: '精神崩壊',
          type: 'SANITY_DRAIN',
          value: 12,
          duration: 3,
          description: '毎ターンSAN-12'
        }
      ],
      satiety: 5 // 錠剤
    },
  },
};
