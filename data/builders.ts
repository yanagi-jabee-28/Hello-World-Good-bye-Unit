
import { GameEvent, GameEventOption, EventTriggerType, Persona } from '../types';
import { SUCCESS_RATES, WEIGHTS } from '../config/gameBalance';

type OptionParams = Omit<GameEventOption, 'successRate' | 'risk'> & {
  successRate?: number;
  risk?: GameEventOption['risk'];
};

type EventParams = Omit<GameEvent, 'id' | 'trigger' | 'text' | 'type' | 'weight'> & {
  type?: GameEvent['type'];
  weight?: number;
};

/**
 * イベント生成ビルダー
 * デフォルト値を補完し、記述量を削減する
 */
export const createEvent = (
  id: string,
  base: { trigger: EventTriggerType; text: string; persona?: Persona },
  params: EventParams = {}
): GameEvent => {
  return {
    id,
    trigger: base.trigger,
    text: base.text,
    persona: base.persona || 'SYSTEM',
    type: params.type || 'flavor',
    weight: params.weight ?? WEIGHTS.COMMON,
    options: params.options || [],
    effect: params.effect || {},
    conditions: params.conditions || {},
    ...params,
  };
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
    successRate: params.successRate ?? SUCCESS_RATES.HIGH,
    ...params,
    risk: 'low',
  };
};

/**
 * 中リスクな選択肢 (成功率中程度, risk: high)
 * MID成功率は失敗確率30%あるのでリスク高め表示とする
 */
export const midRiskOption = (params: Omit<OptionParams, 'risk'>): GameEventOption => {
  return {
    successRate: params.successRate ?? SUCCESS_RATES.MID,
    ...params,
    risk: 'high', 
  };
};

/**
 * 高リスクな選択肢 (成功率低め, risk: high)
 */
export const highRiskOption = (params: Omit<OptionParams, 'risk'>): GameEventOption => {
  return {
    successRate: params.successRate ?? SUCCESS_RATES.RISKY,
    ...params,
    risk: 'high',
  };
};
