
import { GameEvent } from '../types';
import { PROFESSOR_EVENTS } from './events/professor';
import { SENIOR_EVENTS } from './events/senior';
import { FRIEND_EVENTS } from './events/friend';
import { TURN_END_EVENTS } from './events/turnEnd';
import { BRANCHING_EVENTS } from './events/branching';

export const LOG_MESSAGES = {
  start: "ブートシーケンス完了。これより7日間の地獄の試験対策期間を開始します。",
  
  study_morning_bonus: (subject: string) => `【朝の覚醒】静寂な自室。コーヒーの香りと共に${subject}の予習が進む。`,
  study_am_normal: (subject: string) => `【午前の講義】${subject}の講義。教授の板書速度が異常に速い。`,
  study_noon_drowsy: (subject: string) => `【昼の喧騒】学食がうるさすぎて${subject}に集中できない。進捗は芳しくない。`,
  study_afternoon_fight: (subject: string) => `【午後の魔の時間】${subject}の演習中、意識が飛びそうになる。睡魔との死闘。`,
  study_after_school_focus: (subject: string) => `【放課後の集中】図書館の静寂。${subject}の課題を一気に片付ける。`,
  study_caffeine_awake: (subject: string) => `【強制覚醒】カフェインが効いている。昼休みだが${subject}への集中力が研ぎ澄まされている。`,
  study_night_tired: (subject: string) => `【夜の疲労】帰宅後のデスク。${subject}に取り組むが、目が霞む。`,
  study_late_night_zone: (subject: string) => `【深夜のゾーン】午前3時。世界に自分と${subject}しか存在しない感覚。神懸かっている。`,
  study_late_night_fail: (subject: string) => `【深夜の寝落ち】気づけば朝チュン。${subject}のノートにはよだれが垂れている...。`,
  
  study_jitter: "【カフェイン中毒】心臓が早鐘を打っている。焦燥感ばかりで手が動かない。",
  
  madness_gameover: "【思考停止】プツン、と何かが切れる音がした。現実と夢の境界が崩壊。ドロップアウト。",
  hp_gameover: "【緊急搬送】視界がブラックアウト。栄養失調とカフェイン過剰摂取で倒れ、救急車で運ばれた。",
  
  rest_success: "死んだように眠った。脳のキャッシュがクリアされた。",
  rest_short: "机に突っ伏して仮眠をとった。身体がバキバキだが、マシにはなった。",
  rest_caffeine_fail: "目を閉じると瞼の裏で極彩色のフラクタル図形が回転している。一睡もできず、SAN値だけが減る。",
  
  caffeine_ingest: "エナドリのプルタブを開ける。脳が強制再起動される感覚。寿命を前借りする音がする。",
  
  victory: "合格発表日。掲示板に自分の番号を見つけた。灰色の空が、少しだけ青く見えた。",
  failure: "不合格。留年確定。奨学金の返済計画が脳裏をよぎる...",
};

/**
 * ALL_EVENTS Aggregation
 * 各モジュールからイベントを集約して公開
 */
export const ALL_EVENTS: GameEvent[] = [
  ...PROFESSOR_EVENTS,
  ...SENIOR_EVENTS,
  ...FRIEND_EVENTS,
  ...TURN_END_EVENTS,
  ...BRANCHING_EVENTS
];
