import React, { useEffect, useState } from 'react';
import { GameState, GameStatus } from '../types';
import { generateGameEvaluation } from '../utils/ai';
import { Terminal } from 'lucide-react';

interface Props {
  state: GameState;
  onRestart: () => void;
}

export const EndingScreen: React.FC<Props> = ({ state, onRestart }) => {
  const [evaluation, setEvaluation] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

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
  }, [state.status]); // Only re-run if status changes (e.g. playing -> victory)

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

  const msg = getMessage();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-sm animate-[fadeIn_0.5s_ease-out] overflow-y-auto py-10">
      <div className="max-w-3xl w-full border-4 border-green-800 bg-black p-8 text-center shadow-[0_0_50px_rgba(34,197,94,0.2)] m-4">
        <div className={`text-4xl md:text-6xl font-bold mb-4 ${msg.color} tracking-tighter glitch-text`}>
          {msg.title}
        </div>
        <p className="text-sm md:text-xl text-gray-300 mb-8 font-mono">{msg.sub}</p>
        
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left mb-8 border-t border-b border-green-900 py-6">
           <div className="space-y-2">
             <h4 className="text-gray-500 text-xs font-bold mb-2">ACADEMIC_RESULT</h4>
             {Object.entries(state.knowledge).map(([key, val]) => (
               <div key={key} className="flex justify-between font-mono text-sm">
                 <span className="text-gray-400">{key}</span>
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

        <button
          onClick={onRestart}
          className="bg-green-700 text-black font-bold text-xl px-8 py-4 hover:bg-green-600 transition-all transform hover:scale-105 active:scale-95 shadow-[0_0_20px_rgba(34,197,94,0.4)] w-full md:w-auto"
        >
          sudo reboot (再起動)
        </button>
      </div>
    </div>
  );
};