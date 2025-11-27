
import { GameState } from "../types";

export interface Warning {
  severity: 'info' | 'caution' | 'danger' | 'critical';
  icon: string;
  message: string;
  hint?: string;
}

/**
 * 試験準備度を多角的に評価し、段階的警告を生成
 */
export function getExamWarnings(state: GameState): Warning[] {
  const warnings: Warning[] = [];
  const daysLeft = 8 - state.day;
  
  // DAY 5以降のみ警告表示
  if (daysLeft > 3) return warnings;

  // === 1. 体力チェック ===
  const hpRatio = state.hp / state.maxHp;
  if (hpRatio < 0.3 && daysLeft <= 1) {
    warnings.push({
      severity: 'critical',
      icon: '🚨',
      message: '致命的疲労: 試験中に思考停止の危険',
      hint: '今すぐ長時間睡眠を取らないと手遅れになる'
    });
  } else if (hpRatio < 0.5 && daysLeft <= 2) {
    warnings.push({
      severity: 'danger',
      icon: '⚠️',
      message: '深刻な疲労: 試験パフォーマンス大幅低下',
      hint: '休息を優先すべき状況'
    });
  } else if (hpRatio < 0.7 && daysLeft === 1) {
    warnings.push({
      severity: 'caution',
      icon: '💊',
      message: '疲労蓄積: 体調管理を推奨',
      hint: 'アイテム使用または早めの就寝を検討'
    });
  }

  // === 2. 精神状態チェック ===
  const sanRatio = state.sanity / state.maxSanity;
  if (sanRatio < 0.2 && daysLeft <= 1) {
    warnings.push({
      severity: 'critical',
      icon: '🧠',
      message: 'パニック寸前: 試験で頭が真っ白になる',
      hint: '現実逃避/友人交流で即座にSAN回復が必要'
    });
  } else if (sanRatio < 0.4 && daysLeft <= 2) {
    warnings.push({
      severity: 'danger',
      icon: '😰',
      message: '精神不安定: 集中力が維持できない',
      hint: 'ストレス解消を最優先にすべき'
    });
  }

  // === 3. 睡眠負債チェック ===
  const sleepDebt = state.flags.sleepDebt || 0;
  if (sleepDebt > 2 && daysLeft <= 1) {
    warnings.push({
      severity: 'critical',
      icon: '😴',
      message: '慢性的睡眠不足: 認知機能が著しく低下',
      hint: '今夜は絶対に深夜まで起きてはいけない'
    });
  } else if (sleepDebt > 1 && daysLeft <= 2) {
    warnings.push({
      severity: 'danger',
      icon: '🌙',
      message: '睡眠不足累積: 試験時の思考速度低下',
      hint: '早めの就寝で負債を返済する必要がある'
    });
  }

  // === 4. カフェイン過剰チェック ===
  if (state.caffeine > 150 && daysLeft <= 1) {
    warnings.push({
      severity: 'danger',
      icon: '☕',
      message: 'カフェイン過剰: 手の震え/集中力散漫',
      hint: '試験前日は摂取を控えるべき'
    });
  }

  // === 5. 狂気スタックチェック ===
  const madness = state.flags.madnessStack || 0;
  if (madness >= 4) {
    warnings.push({
      severity: 'caution',
      icon: '👁️',
      message: '異常集中モード準備完了',
      hint: '試験時に1科目のみ異常な集中力を発揮（他科目犠牲）'
    });
  }

  // === 6. 人脈活用チェック ===
  if (daysLeft === 1) {
    const profRel = Object.values(state.relationships)[0] || 0; // PROFESSOR
    const hasPastPapers = state.flags.hasPastPapers;
    
    if (profRel < 30) {
      warnings.push({
        severity: 'info',
        icon: '👨‍🏫',
        message: '教授との関係性が低い: 重点範囲が不明',
        hint: '今からでも質問に行けば情報が得られるかも'
      });
    }
    
    // Check number instead of boolean
    if (!hasPastPapers || hasPastPapers === 0) {
      warnings.push({
        severity: 'info',
        icon: '📚',
        message: '過去問未入手: 出題傾向が分からない',
        hint: '先輩に頼れば秘伝の資料が手に入るかも'
      });
    }
  }

  return warnings.sort((a, b) => {
    const order = { critical: 0, danger: 1, caution: 2, info: 3 };
    return order[a.severity] - order[b.severity];
  });
}
