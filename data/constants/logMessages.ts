
import { SubjectId, RelationshipId } from '../../types';

/**
 * ログ出力用メッセージテンプレート定義
 * ゲーム内のテキストリソース（イベント固有テキスト以外）をここに集約する
 */

export const LOG_TEMPLATES = {
  // パラメータ変動
  PARAM: {
    HP: (delta: number) => `HP${delta > 0 ? '+' : ''}${delta}`,
    SAN: (delta: number) => `SAN${delta > 0 ? '+' : ''}${delta}`,
    MONEY: (delta: number) => `資金${delta > 0 ? '+' : ''}¥${delta.toLocaleString()}`,
    CAFFEINE: (delta: number) => `カフェイン${delta > 0 ? '+' : ''}${delta}`,
    SATIETY: (delta: number) => `胃の負担${delta > 0 ? '+' : ''}${delta}`,
    KNOWLEDGE: (subject: string, delta: number) => `${subject}${delta > 0 ? '+' : ''}${delta}`,
    RELATIONSHIP: (target: string, delta: number) => `${target}${delta > 0 ? '+' : ''}${delta}`,
  },
  // アイテム関連
  ITEM: {
    GET: (name: string) => `${name}を入手`,
    USE: (name: string) => `${name}を使用`,
    LOSE: (name: string) => `${name}を消費`,
    BUY: (name: string) => `${name}を購入`,
  },
  // バフ
  BUFF: {
    DURATION: (desc: string, turns: number) => `${desc}(${turns}T)`,
  }
};

export const ACTION_LOGS = {
  START: "ブートシーケンス完了。これより7日間の地獄の試験対策期間を開始します。",
  
  // Study
  STUDY: {
    MORNING_BONUS: (subject: string) => `【朝の覚醒】静寂な自室。コーヒーの香りと共に${subject}の予習が進む。`,
    AM_NORMAL: (subject: string) => `【午前の講義】${subject}の講義。教授の板書速度が異常に速い。`,
    AM_FOCUSED: (subject: string) => `【真面目な受講】カフェインのおかげで意識は明瞭。${subject}の最前列で猛烈にノートを取った。`,
    NOON_DROWSY: (subject: string) => `【昼の喧騒】学食がうるさすぎて${subject}に集中できない。進捗は芳しくない。`,
    NOON_AWAKE: (subject: string) => `【強制覚醒】カフェインが効いている。昼休みだが${subject}への集中力が研ぎ澄まされている。`,
    AFTERNOON_FIGHT: (subject: string) => `【午後の魔の時間】${subject}の演習中、意識が飛びそうになる。睡魔との死闘。`,
    AFTER_SCHOOL_FOCUS: (subject: string) => `【放課後の集中】図書館の静寂。${subject}の課題を一気に片付ける。`,
    NIGHT_TIRED: (subject: string) => `【夜の疲労】帰宅後のデスク。${subject}に取り組むが、目が霞む。`,
    LATE_NIGHT_ZONE: (subject: string) => `【深夜のゾーン】午前3時。世界に自分と${subject}しか存在しない感覚。神懸かっている。`,
    LATE_NIGHT_FAIL: (subject: string) => `【深夜の寝落ち】気づけば朝チュン。${subject}のノートにはよだれが垂れている...。`,
    JITTER: "【カフェイン中毒】心臓が早鐘を打っている。焦燥感ばかりで手が動かない。",
    MADNESS: "\n【狂気】精神の摩耗と引き換えに、異常な集中力を発揮している。",
    STUFFED: "【食べ過ぎ】胃が重くて集中できない。インターバルが必要だ。(効率微減)",
  },

  // Rest
  REST: {
    SUCCESS: "死んだように眠った。脳のキャッシュがクリアされた。",
    SHORT: "机に突っ伏して仮眠をとった。身体がバキバキだが、マシにはなった。",
    CAFFEINE_FAIL: "目を閉じると瞼の裏で極彩色のフラクタル図形が回転している。一睡もできず、SAN値だけが減る。",
    MORNING_SLEEP: "【二度寝】誘惑に負けて布団に戻った。罪悪感で精神は休まらない。",
    NOON_NAP: "【昼寝】午後の講義に備えて机で仮眠。脳のオーバーヒートが少し収まった。",
    SHALLOW: "【浅い眠り】カフェインが脳を締め付け、深く眠れなかった。",
    ANXIETY: " 試験日が迫るプレッシャーで、動悸が収まらない...",
  },

  // Escapism
  ESCAPISM: {
    NORMAL: "【現実逃避】全てを忘れて没頭した。明日から本気出す。",
    SKIP_CLASS: "【サボり】講義をサボってゲーセンへ。背徳感がスパイスだ。",
  },

  // Item
  ITEM: {
    USE_DEFAULT: (name: string) => `【アイテム使用】${name}を使用した。`,
    BUY_SUCCESS: (name: string, balance: number) => `【購入】${name}を購入した。(残高: ¥${balance.toLocaleString()})`,
    BUY_FAIL: (name: string) => `【エラー】資金不足。${name}を買う金がない。`,
  },

  // Social
  SOCIAL: {
    PROF_ABSENT: "教授室は留守のようだ。",
    SENIOR_ABSENT: "先輩は見当たらなかった。",
    FRIEND_BUSY: "友人は忙しいようだ。",
    ISOLATION: (turns: number, dmg: number) => `【孤独】誰とも話さず${turns}ターン経過。社会からの隔絶が精神を蝕む。(SAN-${dmg})`,
  },

  // System
  SYSTEM: {
    DAY_START: (day: number) => `=== DAY ${day} START ===`,
    GAME_OVER_MADNESS: "【思考停止】プツン、と何かが切れる音がした。現実と夢の境界が崩壊。ドロップアウト。",
    GAME_OVER_HP: "【緊急搬送】視界がブラックアウト。栄養失調とカフェイン過剰摂取で倒れ、救急車で運ばれた。",
    VICTORY: "合格発表日。掲示板に自分の番号を見つけた。灰色の空が、少しだけ青く見えた。",
    FAILURE: "不合格。留年確定。奨学金の返済計画が脳裏をよぎる...",
    RESET_INHERIT: "【強くてニューゲーム】現在の状態から学習データを50%継承し、DAY 1へループしました。",
    RESET_HARD: "【再履修】周回を諦め、新たな気持ちでDAY 1から開始します。（継承なし）",
    RESTART_MSG: "【強くてニューゲーム】前回の学習データの50%を復元しました。",
    LOADED: "【SYSTEM】セーブデータをロードしました。",
    STARVATION: "", // 廃止
  }
};

export const RELATIONSHIP_NAMES: Record<RelationshipId, string> = {
  [RelationshipId.PROFESSOR]: '教授友好度',
  [RelationshipId.SENIOR]: '先輩友好度',
  [RelationshipId.FRIEND]: '友人友好度',
};
