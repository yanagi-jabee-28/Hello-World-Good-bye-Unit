
import { GameEvent, SubjectId, TimeSlot, RelationshipId } from '../../../types';
import { WEIGHTS, COOLDOWNS, REL_TIERS, KNOWLEDGE_GAINS, REL_GAINS, COSTS, SUCCESS_RATES, RECOVERY_VALS } from '../../../config/gameBalance';
import { SATIETY_CONSUMPTION } from '../../../config/gameConstants';
import { lowRiskOption, midRiskOption, highRiskOption, safeOption } from '../../builders';

export const systemBranching: GameEvent[] = [
  {
    id: 'branching_git_conflict',
    trigger: 'turn_end',
    persona: 'SYSTEM',
    text: "【衝突】Gitで巨大なコンフリクト発生！マージに失敗し、数時間の作業が消える危機。",
    type: 'mixed',
    category: 'tech_trouble',
    weight: WEIGHTS.RARE,
    conditions: { timeSlots: [TimeSlot.AFTER_SCHOOL, TimeSlot.NIGHT, TimeSlot.LATE_NIGHT] },
    coolDownTurns: COOLDOWNS.MEDIUM,
    options: [
      midRiskOption({
        id: 'opt_git_manual_fix',
        label: '手動で解消',
        description: 'Diffを丁寧に読んで修正する。時間はかかるが確実性は高い。',
        successRate: SUCCESS_RATES.MID, // 70%
        successEffect: {
          hp: COSTS.HP.MEDIUM,
          satiety: COSTS.SATIETY.SMALL,
          knowledge: { [SubjectId.ALGO]: KNOWLEDGE_GAINS.SMALL }
        },
        successLog: "地道な作業の末、なんとかマージできた。コードへの理解も深まった気がする。",
        failureEffect: {
          sanity: COSTS.SANITY.LARGE,
          hp: COSTS.HP.LARGE
        },
        failureLog: "修正中に新たなバグを埋め込んでしまった...。泥沼だ。"
      }),
      highRiskOption({
        id: 'opt_git_force_push',
        label: 'Force Push',
        description: '「俺のコードが正しい」全てを上書きする賭け。',
        successRate: SUCCESS_RATES.RISKY, // 30%
        successEffect: {
          sanity: COSTS.SANITY.BOOST_MID,
          hp: COSTS.HP.TINY
        },
        successLog: "神に祈りながらEnterッ！...奇跡的に動いた。強引だが解決だ。",
        failureEffect: {
          sanity: COSTS.SANITY.CRITICAL,
          knowledge: { [SubjectId.ALGO]: -5 }
        },
        failureLog: "必要なコードまで消し飛んだ。取り返しがつかない..."
      }),
      safeOption({
        id: 'opt_git_giveup',
        label: '諦めて寝る',
        description: '今日の作業はなかったことにする。精神的ダメージは最小限。',
        successEffect: {
          sanity: 5
        },
        successLog: "「git reset --hard」...美しい虚無だ。寝よう。"
      })
    ]
  },
  {
    id: 'branching_sudden_drowsiness',
    trigger: 'turn_end',
    persona: 'SYSTEM',
    text: "【睡魔】抗いがたい眠気が襲う。意識が飛びそうだ。どうする？",
    type: 'mixed',
    category: 'drowsiness',
    weight: WEIGHTS.UNCOMMON,
    conditions: { timeSlots: [TimeSlot.AFTERNOON, TimeSlot.NIGHT], caffeineMax: 20 },
    coolDownTurns: COOLDOWNS.SHORT,
    options: [
      lowRiskOption({
        id: 'opt_drowsiness_slap',
        label: '頬を叩く',
        description: '物理的衝撃で目を覚ます。',
        successRate: SUCCESS_RATES.LOW, // 60%
        successEffect: {
          hp: COSTS.HP.TINY,
          sanity: 5
        },
        successLog: "バチン！痛みが脳を刺激し、意識がクリアになった。",
        failureEffect: {
          hp: COSTS.HP.TINY,
          sanity: COSTS.SANITY.MEDIUM
        },
        failureLog: "痛いだけで眠気は消えない。惨めだ..."
      }),
      highRiskOption({
        id: 'opt_drowsiness_nap',
        label: '5分仮眠',
        description: '短時間の睡眠で回復を狙う。寝過ごすリスクあり。',
        successRate: SUCCESS_RATES.VERY_LOW, // 40%
        successEffect: {
          sanity: COSTS.SANITY.BOOST_LARGE,
          hp: 5,
          satiety: -SATIETY_CONSUMPTION.REST
        },
        successLog: "完璧なパワーナップ。脳が再起動した。",
        failureEffect: {
          sanity: COSTS.SANITY.LARGE
        },
        failureLog: "気づけば1時間経っていた...。自己嫌悪でSAN値が減る。"
      })
    ]
  },
  { 
    id: 'branching_rainy_day', 
    trigger: 'turn_end',
    persona: 'SYSTEM',
    text: "【天候】ゲリラ豪雨。傘を持っていない。", 
    type: 'mixed',
    weight: WEIGHTS.UNCOMMON,
    conditions: { timeSlots: [TimeSlot.MORNING, TimeSlot.AFTER_SCHOOL, TimeSlot.NIGHT] },
    coolDownTurns: COOLDOWNS.MEDIUM,
    options: [
      safeOption({
        id: 'opt_rain_taxi',
        label: 'タクシーを使う',
        description: '金を払って快適に帰る。',
        successEffect: {
          money: -2000,
          hp: 5
        },
        successLog: "快適な移動。出費は痛いが、体調には代えられない。"
      }),
      lowRiskOption({
        id: 'opt_rain_call_friend',
        label: '友人に電話する',
        description: '迎えに来てもらい、そのまま遊びに行く。',
        conditions: { minRelationship: REL_TIERS.MID }, // 30
        successRate: 75,
        successEffect: {
          sanity: RECOVERY_VALS.LARGE,
          satiety: -SATIETY_CONSUMPTION.ESCAPISM,
          relationships: { [RelationshipId.FRIEND]: REL_GAINS.MEDIUM }
        },
        successLog: "「おっ、いいぜ！」友人が車で颯爽と登場。そのままカラオケで雨宿りした。",
        failureEffect: {
          hp: COSTS.HP.SMALL,
          sanity: COSTS.SANITY.MEDIUM
        },
        failureLog: "電話は繋がらなかった...。雨の中、孤独を噛み締めながら帰った。"
      }),
      midRiskOption({
        id: 'opt_rain_run',
        label: '走って帰る',
        description: '気合で乗り切る。',
        successRate: SUCCESS_RATES.LOW, // 50%
        successEffect: {
          hp: COSTS.HP.TINY,
          sanity: 5
        },
        successLog: "ずぶ濡れだが、なんだか爽やかな気分だ。風邪も引かなそうだ。",
        failureEffect: {
          hp: COSTS.HP.LARGE,
          sanity: COSTS.SANITY.SMALL
        },
        failureLog: "完全に冷えた。明日熱が出るかもしれない..."
      })
    ]
  },
  {
    id: 'branching_blue_screen',
    trigger: 'turn_end',
    persona: 'SYSTEM',
    text: "【絶望】レポート保存直前にブルースクリーン！画面が青一色に染まる。",
    type: 'mixed',
    weight: 2, // Very Rare
    maxOccurrences: 1,
    options: [
      lowRiskOption({
        id: 'opt_bsod_wait',
        label: '待つ',
        description: 'OSの復旧機能を信じる。',
        successRate: SUCCESS_RATES.LOW, // 60%
        successEffect: {
          sanity: COSTS.SANITY.SMALL
        },
        successLog: "再起動後、自動保存ファイルが残っていた！OSに感謝。",
        failureEffect: {
          sanity: -25
        },
        failureLog: "データは消えていた。虚無だけが残った。"
      }),
      highRiskOption({
        id: 'opt_bsod_hit',
        label: '叩く',
        description: '昭和の修理法。精密機器には逆効果の可能性大。',
        successRate: 20,
        successEffect: {
          sanity: 20
        },
        successLog: "ガンッ！...画面が戻った！？奇跡だ。",
        failureEffect: {
          money: COSTS.MONEY.PENALTY_LARGE,
          sanity: COSTS.SANITY.CRITICAL
        },
        failureLog: "バキッという嫌な音がした。PCが物理的に壊れた..."
      }),
      safeOption({
        id: 'opt_bsod_giveup',
        label: '諦めてスマホを見る',
        description: '現実逃避。PCのことは忘れる。',
        successEffect: {
          sanity: 10,
          hp: 5
        },
        successLog: "今日はもう店じまいだ。猫の動画を見て癒やされた。"
      })
    ]
  },
  {
    id: 'turn_end_mystery_junk',
    trigger: 'turn_end',
    persona: 'SYSTEM',
    text: "【発掘】実験室のジャンク箱から、型番不明の謎のICチップを発見した。オーラを感じる。",
    type: 'mixed',
    weight: WEIGHTS.UNCOMMON,
    options: [
      safeOption({
        id: 'opt_junk_datasheet',
        label: '型番を特定する',
        description: '顕微鏡とテスターを使って地道に調べる。回路の勉強になる。',
        successEffect: {
          knowledge: { [SubjectId.CIRCUIT]: KNOWLEDGE_GAINS.MEDIUM },
           sanity: COSTS.SANITY.SMALL
        },
        successLog: "地道な測定の結果、廃盤になったレアなオペアンプだと判明した。回路特性への理解が深まった。"
      }),
      highRiskOption({
        id: 'opt_junk_test',
        label: '通電してみる',
        description: '男なら一発勝負。回路に組み込んで電源ON。',
        successRate: SUCCESS_RATES.RISKY, // 30%
        successEffect: {
          knowledge: { [SubjectId.CIRCUIT]: KNOWLEDGE_GAINS.LARGE },
          sanity: 15
        },
        successLog: "動いた！しかもこれ、超高性能なFPGAだ！この感動はプライスレス。",
        failureEffect: {
          hp: COSTS.HP.MEDIUM,
          sanity: COSTS.SANITY.MEDIUM
        },
        failureLog: "「逆電圧か！？」強烈な異臭と共にチップが破裂。飛散した破片が頬をかすめた。顔が煤だらけだ。"
      }),
      lowRiskOption({
        id: 'opt_junk_auction',
        label: 'ヤフオクに出す',
        description: '「動作未確認ジャンク」として出品。小銭を稼ぐ。',
        successRate: SUCCESS_RATES.HIGH, // 80%
        successEffect: {
          money: 3000
        },
        successLog: "「NCNR（ノークレーム・ノーリターン）」で出品したら、マニアが即決価格で落札してくれた。",
        failureEffect: {
          sanity: COSTS.SANITY.SMALL
        },
        failureLog: "「送料の方が高い」とクレームが来て、結局廃棄する羽目になった。徒労だ。"
      })
    ]
  }
];
