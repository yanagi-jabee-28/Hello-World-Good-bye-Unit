
import { SubjectId } from '../types';
import { rng } from '../utils/rng';

/**
 * 学力状況に基づいて勉強する科目を自動選択する
 * 
 * アルゴリズム:
 * 1. 各科目の「不足分 (100 - 現在のスコア)」を基本ウェイトとする。
 * 2. 最も点数が低い科目（弱点）には、さらにウェイトを4倍にするブーストをかける。
 * 3. 重み付き抽選を行い、科目を決定する。
 * 
 * これにより、点数が低い科目ほど選ばれやすくなり、特に最低科目は非常に高い確率で選ばれる。
 * 
 * @param currentKnowledge 現在の学力ステータス
 * @returns 選択された SubjectId
 */
export const selectWeakestSubject = (currentKnowledge: Record<SubjectId, number>): SubjectId => {
  const subjects = Object.keys(currentKnowledge) as SubjectId[];
  
  // 安全策: 科目がない場合はデフォルトを返す
  if (subjects.length === 0) return SubjectId.ALGO;

  // 1. 最低スコアを特定
  const minScore = Math.min(...subjects.map(id => currentKnowledge[id] || 0));

  // 2. ウェイト計算
  const weights = subjects.map(id => {
    const score = currentKnowledge[id] || 0;
    // 基本ウェイト: 点数が低いほど大きい (例: 40点 -> 60, 90点 -> 10)
    // 最低でもウェイト1は確保
    let weight = Math.max(1, 100 - score);

    // 弱点ブースト: 最低点ならウェイト4倍 (かなり高い確率で選ばれるように)
    if (score === minScore) {
      weight *= 4;
    }

    return { id, weight };
  });

  // 3. ルーレット選択 (Weighted Random)
  const totalWeight = weights.reduce((sum, w) => sum + w.weight, 0);
  let randomVal = rng.random() * totalWeight;

  for (const w of weights) {
    randomVal -= w.weight;
    if (randomVal <= 0) {
      return w.id;
    }
  }

  // フォールバック（計算誤差対策）: 最もウェイトが高いものを返す
  return weights.sort((a, b) => b.weight - a.weight)[0].id;
};
