
import React, { useState } from 'react';
import { GameState, DebugFlags } from '../types';
import { evaluateExam } from '../logic/examEvaluation';
import { getExamWarnings } from '../logic/warningSystem';
import { Bug, ChevronDown, ChevronUp, AlertTriangle } from 'lucide-react';

interface Props {
  state: GameState;
  onToggleFlag: (flag: keyof DebugFlags) => void;
}

/**
 * デバッグ/学習支援パネル
 */
export const DebugPanel: React.FC<Props> = ({ state, onToggleFlag }) => {
  const [expanded, setExpanded] = useState(false);
  const [showProjection, setShowProjection] = useState(false);

  // 現時点での試験予測
  const projection = evaluateExam(state);
  const warnings = getExamWarnings(state);

  if (!expanded) {
    return (
      <button
        onClick={() => setExpanded(true)}
        className="fixed bottom-4 right-4 p-2 bg-gray-900 border border-green-700 hover:bg-gray-800 transition-colors z-50 rounded-full opacity-50 hover:opacity-100"
        title="デバッグパネルを開く"
      >
        <Bug size={20} className="text-green-500" />
      </button>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 w-80 md:w-96 max-h-[80vh] overflow-y-auto bg-gray-950 border-2 border-green-700 p-4 font-mono text-xs z-50 shadow-lg rounded">
      {/* ヘッダー */}
      <div className="flex items-center justify-between mb-3 pb-2 border-b border-gray-700">
        <div className="flex items-center gap-2">
          <Bug size={16} className="text-green-500" />
          <span className="text-green-400 font-bold">DEBUG MODE</span>
        </div>
        <button
          onClick={() => setExpanded(false)}
          className="text-gray-500 hover:text-gray-300"
        >
          <ChevronDown size={16} />
        </button>
      </div>

      {/* DEBUG TOGGLES */}
      <div className="mb-4 bg-gray-900/50 p-2 rounded border border-gray-800">
        <h3 className="text-cyan-500 font-bold mb-2">DEBUG SETTINGS</h3>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-gray-400">リスク/成功率表示:</span>
            <button
              onClick={() => onToggleFlag('showRisks')}
              className={`flex items-center gap-2 px-2 py-1 rounded text-[10px] font-bold ${state.debugFlags.showRisks ? 'bg-green-900/50 text-green-400 border border-green-700' : 'bg-gray-800 text-gray-500 border border-gray-700'}`}
            >
              {state.debugFlags.showRisks ? 'ON' : 'OFF'}
            </button>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-400">死亡リスクヒント:</span>
            <button
              onClick={() => onToggleFlag('showDeathHints')}
              className={`flex items-center gap-2 px-2 py-1 rounded text-[10px] font-bold ${state.debugFlags.showDeathHints ? 'bg-red-900/50 text-red-400 border border-red-700' : 'bg-gray-800 text-gray-500 border border-gray-700'}`}
            >
              {state.debugFlags.showDeathHints ? 'ON' : 'OFF'}
            </button>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-400">イベントログ出力:</span>
            <button
              onClick={() => onToggleFlag('logEventFlow')}
              className={`flex items-center gap-2 px-2 py-1 rounded text-[10px] font-bold ${state.debugFlags.logEventFlow ? 'bg-blue-900/50 text-blue-400 border border-blue-700' : 'bg-gray-800 text-gray-500 border border-gray-700'}`}
            >
              {state.debugFlags.logEventFlow ? 'ON' : 'OFF'}
            </button>
          </div>
        </div>
      </div>

      {/* 警告セクション */}
      {warnings.length > 0 && (
        <div className="mb-4 space-y-2">
          <h3 className="text-yellow-500 font-bold flex items-center gap-2">
            <AlertTriangle size={14} />
            WARNINGS ({warnings.length})
          </h3>
          <div className="space-y-1">
            {warnings.map((w, i) => (
              <div
                key={i}
                className={`p-2 border fs-xxs leading-tight rounded ${
                  w.severity === 'critical' ? 'border-red-700 bg-red-900/20' :
                  w.severity === 'danger' ? 'border-orange-700 bg-orange-900/20' :
                  w.severity === 'caution' ? 'border-yellow-700 bg-yellow-900/20' :
                  'border-blue-700 bg-blue-900/20'
                }`}
              >
                <div className="font-bold text-gray-200">{w.icon} {w.message}</div>
                {w.hint && <div className="text-gray-400 mt-1 pl-4">💡 {w.hint}</div>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 隠しステータス */}
      <div className="mb-4 bg-gray-900 p-2 rounded border border-gray-800">
        <h3 className="text-cyan-500 font-bold mb-2">HIDDEN STATUS</h3>
        <div className="space-y-1 fs-xxs">
          <div className="flex justify-between">
            <span className="text-gray-400">睡眠負債:</span>
            <span className="text-cyan-300">{state.flags.sleepDebt?.toFixed(1) || 0}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">前夜睡眠品質:</span>
            <span className="text-cyan-300">{((state.flags.lastSleepQuality || 0.8) * 100).toFixed(0)}%</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">狂気スタック:</span>
            <span className="text-purple-400">{state.flags.madnessStack || 0}/4</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">カフェイン依存:</span>
            <span className="text-orange-400">{state.flags.caffeineDependent ? 'YES' : 'NO'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">過去問入手数:</span>
            <span className="text-green-400">{state.flags.hasPastPapers || 0} (Stack)</span>
          </div>
        </div>
      </div>

      {/* 試験予測 */}
      <div>
        <button
          onClick={() => setShowProjection(!showProjection)}
          className="w-full flex items-center justify-between text-yellow-500 font-bold mb-2 hover:text-yellow-400 p-1 hover:bg-gray-900 rounded"
        >
          <span>EXAM PROJECTION</span>
          {showProjection ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>
        
        {showProjection && (
          <div className="space-y-2 animate-[fadeIn_0.2s]">
            <div className="p-2 bg-gray-900 border border-gray-700 rounded">
              <div className="flex justify-between mb-1">
                <span className="text-gray-400">基礎スコア:</span>
                <span className="text-white font-bold">{projection.baseScore.toFixed(0)}</span>
              </div>
              <div className="fs-xxs text-gray-500 space-y-0.5">
                <div className="flex justify-between">
                  <span>Physical:</span>
                  <span className={projection.physicalCondition < 0.8 ? 'text-red-400' : 'text-green-400'}>
                    {(projection.physicalCondition * 100).toFixed(0)}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Mental:</span>
                  <span className={projection.mentalStability < 0.8 ? 'text-red-400' : 'text-green-400'}>
                    {(projection.mentalStability * 100).toFixed(0)}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Sleep:</span>
                  <span className={projection.sleepQuality < 0.85 ? 'text-orange-400' : 'text-green-400'}>
                    {(projection.sleepQuality * 100).toFixed(0)}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Caffeine:</span>
                  <span className={projection.caffeineJitter < 0.95 ? 'text-orange-400' : 'text-green-400'}>
                    {(projection.caffeineJitter * 100).toFixed(0)}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Professor:</span>
                  <span className="text-blue-400">{(projection.professorBonus * 100).toFixed(0)}%</span>
                </div>
                <div className="flex justify-between">
                  <span>Senior Leak:</span>
                  <span className="text-purple-400">{(projection.seniorLeakBonus * 100).toFixed(0)}%</span>
                </div>
              </div>
              <div className="mt-2 pt-2 border-t border-gray-700 flex justify-between">
                <span className="text-yellow-500 font-bold">予測最終スコア:</span>
                <span className="text-yellow-300 font-bold">{projection.finalScore.toFixed(0)}</span>
              </div>
              <div className="mt-1 text-center">
                <span className={`font-bold text-lg ${
                  projection.rank === 'S' ? 'text-yellow-400' :
                  projection.rank === 'A' ? 'text-blue-400' :
                  projection.rank === 'B' ? 'text-green-400' :
                  projection.rank === 'C' ? 'text-orange-400' :
                  'text-red-400'
                }`}>
                  {projection.rank} RANK
                </span>
              </div>
            </div>
            <div className="fs-xxs text-gray-500 leading-tight">
              ⚠ これは現時点での予測値です。最終日までのコンディション管理が合否を分けます。
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
