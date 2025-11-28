
import { GameEventOption } from '../types';
import { SUCCESS_RATES } from '../config/gameBalance';

type OptionParams = Omit<GameEventOption, 'successRate' | 'risk'> & {
  successRate?: number;
  risk?: GameEventOption['risk'];
};

/**
 * 基本的なオプション生成
 * 指定がない場合、デフォルトで risk: 'low', successRate: MID (70) を設定
 */
export const createOption = (params: OptionParams): GameEventOption => {
  return {
    risk: params.risk || 'low',
    successRate: params.successRate ?? SUCCESS_RATES.MID,
    ...params,
  };
};

/**
 * 安全な選択肢 (成功率100%, risk: safe)
 */
export const safeOption = (params: Omit<OptionParams, 'risk' | 'successRate'>): GameEventOption => {
  return {
    ...params,
    risk: 'safe',
    successRate: SUCCESS_RATES.GUARANTEED,
  };
};

/**
 * 低リスクな選択肢 (成功率高め, risk: low)
 */
export const lowRiskOption = (params: Omit<OptionParams, 'risk'>): GameEventOption => {
  return {
    successRate: SUCCESS_RATES.HIGH,
    ...params,
    risk: 'low',
  };
};

/**
 * 中リスクな選択肢 (成功率中程度, risk: low or high)
 */
export const midRiskOption = (params: Omit<OptionParams, 'risk'>): GameEventOption => {
  return {
    successRate: SUCCESS_RATES.MID,
    ...params,
    risk: 'high', // MID成功率は失敗確率30%あるのでリスク高め表示とする
  };
};

/**
 * 高リスクな選択肢 (成功率低め, risk: high)
 */
export const highRiskOption = (params: Omit<OptionParams, 'risk'>): GameEventOption => {
  return {
    successRate: SUCCESS_RATES.RISKY, // 30%
    ...params,
    risk: 'high',
  };
};
