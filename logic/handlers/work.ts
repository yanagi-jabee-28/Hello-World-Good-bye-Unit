
import { GameState, TimeSlot } from '../../types';
import { clamp, formatDelta, joinMessages, chance } from '../../utils/common';
import { pushLog } from '../stateHelpers';
import { getWorkConfig } from '../../data/work';

type WorkResultType = 'CRITICAL_SUCCESS' | 'SUCCESS' | 'NORMAL' | 'FAILURE' | 'CRITICAL_FAILURE';

interface WorkResult {
  type: WorkResultType;
  salaryMult: number;
  hpCostMult: number;
  sanityCostMult: number;
  logPrefix: string;
  logType: 'success' | 'info' | 'warning' | 'danger';
}

/**
 * 時間帯ごとの確率分布を定義
 */
const getWorkResult = (timeSlot: TimeSlot): WorkResult => {
  const rand = Math.random() * 100;

  // 深夜・早朝(LATE_NIGHT)はハイリスク・ハイリターン
  // 塾講師(AFTER_SCHOOL, NIGHT)は精神的ブレ幅が大きい
  // その他は安定

  if (timeSlot === TimeSlot.LATE_NIGHT) {
    // 深夜緊急対応: 天国か地獄か
    if (rand < 15) return { // 15% 大成功
      type: 'CRITICAL_SUCCESS',
      salaryMult: 1.5, hpCostMult: 0.2, sanityCostMult: 0.2,
      logPrefix: "【神対応】", logType: 'success'
    };
    if (rand < 30) return { // 15% 成功
      type: 'SUCCESS',
      salaryMult: 1.2, hpCostMult: 0.8, sanityCostMult: 0.8,
      logPrefix: "【順調】", logType: 'success'
    };
    if (rand < 60) return { // 30% 通常
      type: 'NORMAL',
      salaryMult: 1.0, hpCostMult: 1.0, sanityCostMult: 1.0,
      logPrefix: "【完了】", logType: 'info'
    };
    if (rand < 85) return { // 25% 失敗 (泥沼)
      type: 'FAILURE',
      salaryMult: 1.0, hpCostMult: 1.5, sanityCostMult: 1.5, // 給料変わらず疲労増
      logPrefix: "【泥沼】", logType: 'warning'
    };
    return { // 15% 大失敗 (システム崩壊)
      type: 'CRITICAL_FAILURE',
      salaryMult: 0.5, hpCostMult: 2.0, sanityCostMult: 2.0, // 減給＆大ダメージ
      logPrefix: "【炎上】", logType: 'danger'
    };
  }

  // 通常シフト
  if (rand < 5) return {
    type: 'CRITICAL_SUCCESS',
    salaryMult: 1.5, hpCostMult: 0.8, sanityCostMult: 0.8,
    logPrefix: "【臨時収入】", logType: 'success'
  };
  if (rand < 20) return {
    type: 'SUCCESS',
    salaryMult: 1.1, hpCostMult: 0.9, sanityCostMult: 0.9,
    logPrefix: "【好調】", logType: 'success'
  };
  if (rand < 75) return {
    type: 'NORMAL',
    salaryMult: 1.0, hpCostMult: 1.0, sanityCostMult: 1.0,
    logPrefix: "【完了】", logType: 'info'
  };
  if (rand < 95) return {
    type: 'FAILURE',
    salaryMult: 0.8, hpCostMult: 1.2, sanityCostMult: 1.2,
    logPrefix: "【トラブル】", logType: 'warning'
  };
  return {
    type: 'CRITICAL_FAILURE',
    salaryMult: 0.5, hpCostMult: 1.5, sanityCostMult: 1.5,
    logPrefix: "【事故】", logType: 'danger'
  };
};

/**
 * 状況に応じたフレーバーテキストを生成
 */
const getFlavorText = (config: ReturnType<typeof getWorkConfig>, result: WorkResultType): string => {
  const base = config.logText.split('。')[0]; // 基本テキストの最初の文を取得

  switch (result) {
    case 'CRITICAL_SUCCESS':
      if (config.label.includes("深夜")) return "再起動一発で障害復旧。余った時間で技術書を読み、特別手当まで出た。";
      if (config.label.includes("塾")) return "担当生徒が模試でA判定を出した！保護者から心付けを頂いた。";
      return "現場リーダーに気に入られ、こっそりボーナスを握らされた。";
    
    case 'SUCCESS':
      if (config.label.includes("深夜")) return "ログ調査だけで原因特定。平和な夜だった。";
      return "作業は驚くほどスムーズに進んだ。";

    case 'NORMAL':
      return config.logText; // デフォルトを使用

    case 'FAILURE':
      if (config.label.includes("深夜")) return "原因不明のエラー。朝までログと睨めっこする羽目になった。";
      if (config.label.includes("塾")) return "生徒が全く話を聞かない。説明だけで喉が枯れた。";
      return "客からの理不尽なクレーム対応で時間を浪費した。";

    case 'CRITICAL_FAILURE':
      if (config.label.includes("深夜")) return "「DBをDROPしました」...新人のミスをカバーするため、命を削って復旧作業を行った。";
      if (config.label.includes("塾")) return "「先生の教え方、最悪」モンペアが乗り込んできて修羅場と化した。";
      return "備品を破損してしまった。弁償代が給料から引かれる...。";
    
    default:
      return config.logText;
  }
};

export const handleWork = (state: GameState): GameState => {
  const config = getWorkConfig(state.timeSlot);
  const result = getWorkResult(state.timeSlot);
  
  // Calculate final values
  const finalSalary = Math.floor(config.salary * result.salaryMult);
  const finalHpCost = Math.floor(config.hpCost * result.hpCostMult);
  const finalSanityCost = Math.floor(config.sanityCost * result.sanityCostMult);

  // State Update
  state.money += finalSalary;
  state.hp = clamp(state.hp - finalHpCost, 0, state.maxHp);
  state.sanity = clamp(state.sanity - finalSanityCost, 0, state.maxSanity);
  
  const flavorText = getFlavorText(config, result.type);
  
  const details = joinMessages([
    `資金+¥${finalSalary.toLocaleString()}`,
    formatDelta('HP', -finalHpCost),
    formatDelta('SAN', -finalSanityCost),
    result.type === 'CRITICAL_SUCCESS' ? '(大成功!)' : null,
    result.type === 'CRITICAL_FAILURE' ? '(大失敗...)' : null,
  ], ', ');

  pushLog(state, `${result.logPrefix} ${flavorText}\n(${details})`, result.logType);
  return state;
};
