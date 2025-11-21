import React, { useEffect, useState } from 'react';
import { GameState, GameStatus, SubjectId } from '../types';
import { generateGameEvaluation } from '../utils/ai';
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
        return { title: "COMPILE SUCCESS", color: "text-green-500", sub: "ビルド完了：エラー0, 警告99 (卒業要件を満たしました)" };
      case GameStatus.FAILURE:
        return { title: "BUILD FAILED", color: "text-orange-500", sub: "依存関係が解決できません：単位不足により留年が確定しました" };
      case GameStatus.GAME_OVER_HP:
        return { title: "SYSTEM SHUTDOWN", color: "text-red-600", sub: "ハードウェア障害を検知：過労により緊急搬送されました" };
      case GameStatus.GAME_OVER_SANITY:
        return { title: "RUNTIME ERROR", color: "text-purple-600", sub: "無限再帰プロセスを検知：思考回路が断絶しました" };
      default:
        return { title: "UNKNOWN STATE", color: "text-gray-500", sub: "" };
    }
  };

  // Determine log section style based on status
  const getLogSectionConfig = () => {
    switch (state.status) {
      case GameStatus.VICTORY:
        return {
          title: "FINAL_EXECUTION_LOG (最終実行ログ)",
          icon: CheckCircle,
          bgClass: "bg-green-950/20",
          borderClass: "border-green-900/50",
          textClass: "text-green-500"
        };
      case GameStatus.FAILURE:
        return {
          title: "COMPILATION_ERROR_LOG (エラーログ)",
          icon: AlertTriangle,
          bgClass: "bg-orange-950/20",
          borderClass: "border-orange-900/50",
          textClass: "text-orange-500"
        };
      default: // HP/SAN GameOver
        return {
          title: "FATAL_EXCEPTION (直近のイベント)",
          icon: AlertOctagon,
          bgClass: "bg-red-950/20",
          borderClass: "border-red-900/50",
          textClass: "text-red-500"
        };
    }
  };

  const msg = getMessage();
  const logConfig = getLogSectionConfig();
  const LogIcon = logConfig.icon;
  const lastLogs = state.logs.slice(-4).reverse(); // 直近のログを取得

  // ログ確認モード時は、背景の入力を許可しつつ、操作ボタンだけを表示する
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
        
        {/* ログ確認ボタン */}
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

        <div className={`text-3xl md:text-6xl font-bold mb-4 ${msg.color} tracking-tighter glitch-text mt-0`}>
          {msg.title}
        </div>
        <p className="text-sm md:text-xl text-gray-300 mb-6 font-mono">{msg.sub}</p>
        
        {/* RECENT EVENTS Section - Dynamic Style */}
        <div className={`text-left mb-6 border p-3 ${logConfig.bgClass} ${logConfig.borderClass}`}>
           <h4 className={`${logConfig.textClass} text-xs font-bold mb-2 flex items-center gap-2`}>
             <LogIcon size={12} /> {logConfig.title}
           </h4>
           <div className="space-y-1 font-mono text-xs md:text-sm text-gray-400">
             {lastLogs.map((log, i) => (
               <div key={log.id} className={`${i === 0 ? 'text-white font-bold' : 'opacity-70'}`}>
                 <span className="mr-2 opacity-50">{log.timestamp}</span>
                 {i === 0 && <span className={`${logConfig.textClass} mr-1`}>&gt;&gt;</span>}
                 {log.text}
               </div>
             ))}
           </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left mb-6 border-t border-b border-green-900 py-4">
           <div className="space-y-2">
             <h4 className="text-gray-500 text-xs font-bold mb-2">ACADEMIC_RESULT</h4>
             {Object.entries(state.knowledge).map(([key, val]) => (
               <div key={key} className="flex justify-between font-mono text-sm">
                 <span className="text-gray-400">
                   {SUBJECTS[key as SubjectId]?.name || key}
                 </span>
                 <span className={(val as number) >= 60 ? "text-green-400 font-bold" : "text-red-500 font-bold"}>{val as number}pts</span>
               </div>
             ))}
           </div>
           <div className="space-y-2">
             <h4 className="text-gray-500 text-xs font-bold mb-2">VITAL_SIGNS</h4>
             <div className="flex justify-between font-mono text-sm">
                <span className="text-gray-400">HP Remaining</span>
                <span className={state.hp > 30 ? "text-green-400" : "text-red-500"}>{state.hp}/100</span>
             </div>
             <div className="flex justify-between font-mono text-sm">
                <span className="text-gray-400">Sanity Level</span>
                <span className={state.sanity > 30 ? "text-blue-400" : "text-red-500"}>{state.sanity}/100</span>
             </div>
             <div className="flex justify-between font-mono text-sm">
                <span className="text-gray-400">Caffeine Toxicity</span>
                <span className={state.caffeine < 100 ? "text-yellow-400" : "text-red-500"}>{state.caffeine}mg</span>
             </div>
           </div>
        </div>

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
                 <span>&gt; Decrypting professor's comments...</span>
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