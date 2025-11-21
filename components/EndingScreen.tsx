
import React, { useEffect, useState } from 'react';
import { GameState, GameStatus, SubjectId } from '../types';
import { generateGameEvaluation } from '../utils/ai';
import { evaluateExam } from '../logic/examEvaluation';
import { Terminal, FileText, Eye, EyeOff, CheckCircle, AlertTriangle, AlertOctagon } from 'lucide-react';
import { SUBJECTS } from '../data/subjects';

interface Props {
  state: GameState;
  onRestart: () => void;
}

export const EndingScreen: React.FC<Props> = ({ state, onRestart }) => {
  const [evaluation, setEvaluation] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isLogMode, setIsLogMode] = useState(false);
  
  // Calculate exam metrics
  const examMetrics = React.useMemo(() => {
    if (state.status === GameStatus.VICTORY || state.status === GameStatus.FAILURE) {
      return evaluateExam(state);
    }
    return null;
  }, [state.status]);

  useEffect(() => {
    let isMounted = true;

    const fetchEvaluation = async () => {
      if (state.status === GameStatus.PLAYING) {
        setEvaluation(null);
        return;
      }

      setIsLoading(true);
      try {
        const text = await generateGameEvaluation(state);
        if (isMounted) setEvaluation(text);
      } catch (e) {
        if (isMounted) setEvaluation("Error retrieving data.");
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    fetchEvaluation();

    return () => {
      isMounted = false;
    };
  }, [state.status]);

  if (state.status === GameStatus.PLAYING) return null;

  const getMessage = () => {
    switch (state.status) {
      case GameStatus.VICTORY:
        return { title: "COMPILE SUCCESS", color: "text-green-500", sub: "ビルド完了：卒業要件を満たしました" };
      case GameStatus.FAILURE:
        return { title: "BUILD FAILED", color: "text-orange-500", sub: "依存関係エラー：単位不足により留年" };
      case GameStatus.GAME_OVER_HP:
        return { title: "SYSTEM SHUTDOWN", color: "text-red-600", sub: "ハードウェア障害：過労により緊急搬送" };
      case GameStatus.GAME_OVER_SANITY:
        return { title: "RUNTIME ERROR", color: "text-purple-600", sub: "無限再帰：思考回路が断絶" };
      default:
        return { title: "UNKNOWN STATE", color: "text-gray-500", sub: "" };
    }
  };

  const msg = getMessage();
  const lastLogs = state.logs.slice(-4).reverse();

  if (isLogMode) {
    return (
      <div className="fixed inset-0 z-50 pointer-events-none flex flex-col justify-start items-center pt-20 md:pt-24">
        <div className="pointer-events-auto bg-black/90 border-2 border-green-800 p-4 shadow-[0_0_20px_rgba(34,197,94,0.4)] flex gap-4 items-center rounded animate-[slideDown_0.3s_ease-out]">
          <span className="text-green-500 font-bold text-sm animate-pulse">LOG_VIEW_MODE</span>
          <button
            onClick={() => setIsLogMode(false)}
            className="bg-green-700 text-black px-4 py-2 text-sm font-bold hover:bg-green-600 transition-colors flex items-center gap-2"
          >
            <EyeOff size={16} />
            結果画面に戻る
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-sm animate-[fadeIn_0.5s_ease-out] overflow-y-auto py-10">
      <div className="max-w-3xl w-full border-4 border-green-800 bg-black p-6 md:p-8 text-center shadow-[0_0_50px_rgba(34,197,94,0.2)] m-4 relative">
        
        <div className="flex justify-end mb-4">
          <button 
            onClick={() => setIsLogMode(true)}
            className="text-gray-500 hover:text-green-400 flex items-center gap-1 text-xs border border-gray-800 p-2 hover:border-green-500 transition-all"
          >
            <FileText size={14} />
            <span className="hidden md:inline">CHECK_LOGS (ログ確認)</span>
            <span className="md:hidden">LOGS</span>
          </button>
        </div>

        <div className={`text-3xl md:text-5xl font-bold mb-2 ${msg.color} tracking-tighter glitch-text mt-0`}>
          {msg.title}
        </div>
        <p className="text-sm md:text-lg text-gray-300 mb-6 font-mono">{msg.sub}</p>
        
        {/* Exam Evaluation Details (Victory/Failure only) */}
        {examMetrics && (
           <div className="mb-6 bg-gray-900 border border-green-900 p-4 text-left font-mono">
              <h3 className="text-green-400 border-b border-green-800 pb-2 mb-3 font-bold flex justify-between">
                <span>FINAL_EVALUATION_REPORT</span>
                <span className={`text-xl ${examMetrics.rank === 'S' ? 'text-yellow-400' : examMetrics.rank === 'F' ? 'text-red-500' : 'text-white'}`}>RANK: {examMetrics.rank}</span>
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs md:text-sm">
                 <div>
                    <div className="text-gray-500 mb-1">SUBJECT SCORES (RAW)</div>
                    {Object.entries(examMetrics.rawKnowledge).map(([sid, score]) => (
                       <div key={sid} className="flex justify-between">
                          <span className="text-gray-400">{SUBJECTS[sid as SubjectId].name}</span>
                          <span className="text-white">{score.toFixed(0)}</span>
                       </div>
                    ))}
                    <div className="flex justify-between border-t border-gray-700 mt-1 pt-1">
                       <span className="text-gray-400">BASE TOTAL</span>
                       <span className="text-white font-bold">{examMetrics.baseScore.toFixed(0)}</span>
                    </div>
                 </div>
                 
                 <div>
                    <div className="text-gray-500 mb-1">CONDITION MULTIPLIERS</div>
                    <div className="flex justify-between">
                       <span className="text-gray-400">Physical (HP)</span>
                       <span className={examMetrics.physicalCondition < 0.8 ? "text-red-400" : "text-green-400"}>x{examMetrics.physicalCondition.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                       <span className="text-gray-400">Mental (SAN)</span>
                       <span className={examMetrics.mentalStability < 0.8 ? "text-red-400" : "text-green-400"}>x{examMetrics.mentalStability.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                       <span className="text-gray-400">Sleep Quality</span>
                       <span className={examMetrics.sleepQuality < 0.85 ? "text-orange-400" : "text-green-400"}>x{examMetrics.sleepQuality.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                       <span className="text-gray-400">Networking</span>
                       <span className="text-blue-400">x{(examMetrics.professorBonus * examMetrics.seniorLeakBonus).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between border-t border-gray-700 mt-1 pt-1">
                       <span className="text-yellow-500">TOTAL MULTIPLIER</span>
                       <span className="text-yellow-500 font-bold">x{examMetrics.conditionMultiplier.toFixed(2)}</span>
                    </div>
                 </div>
              </div>
              
              <div className="mt-4 text-center border-t border-gray-800 pt-3">
                 <div className="text-gray-500 text-xs">FINAL SCORE</div>
                 <div className="text-3xl font-bold text-white">{examMetrics.finalScore.toFixed(0)}</div>
                 <div className="text-xs text-gray-600 mt-1">PASSING LINE: 850</div>
              </div>
           </div>
        )}

        {/* AI Analysis Section */}
        <div className="mb-8 text-left bg-gray-900/50 p-4 border border-green-800/50 rounded relative min-h-[100px]">
           <h4 className="text-green-600 text-xs font-bold mb-2 flex items-center gap-2">
             <Terminal size={14} />
             SYSTEM_ANALYSIS_LOG // AI_EVALUATOR
           </h4>
           <div className="font-mono text-sm leading-relaxed text-green-400">
             {isLoading ? (
               <div className="animate-pulse flex flex-col gap-1">
                 <span>&gt; Connecting to Faculty Mainframe...</span>
                 <span>&gt; Analyzing performance metrics...</span>
                 <span className="inline-block w-2 h-4 bg-green-500 animate-ping mt-2"/>
               </div>
             ) : (
               <div className="typewriter">
                 <span className="text-green-600 mr-2">&gt;</span>
                 {evaluation}
                 <span className="animate-pulse inline-block w-2 h-4 bg-green-500 ml-1 align-middle"/>
               </div>
             )}
           </div>
        </div>

        <div className="flex flex-col md:flex-row gap-4 justify-center">
          <button
            onClick={onRestart}
            className="bg-green-700 text-black font-bold text-xl px-8 py-3 hover:bg-green-600 transition-all transform hover:scale-105 active:scale-95 shadow-[0_0_20px_rgba(34,197,94,0.4)] w-full md:w-auto"
          >
            sudo reboot (再起動)
          </button>
        </div>
      </div>
    </div>
  );
};
