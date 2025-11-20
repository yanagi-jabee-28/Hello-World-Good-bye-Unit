
import React from 'react';
import { GameState, GameStatus, ActionType } from '../types';

interface Props {
  state: GameState;
  onRestart: () => void;
}

export const EndingScreen: React.FC<Props> = ({ state, onRestart }) => {
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm animate-[fadeIn_0.5s_ease-out]">
      <div className="max-w-2xl w-full border-4 border-green-800 bg-black p-8 text-center shadow-[0_0_50px_rgba(34,197,94,0.2)]">
        <div className={`text-6xl font-bold mb-4 ${msg.color} tracking-tighter glitch-text`}>
          {msg.title}
        </div>
        <p className="text-xl text-gray-300 mb-8 font-mono">{msg.sub}</p>
        
        <div className="grid grid-cols-2 gap-4 text-left mb-8 border border-green-900 p-4">
           {Object.entries(state.knowledge).map(([key, val]) => (
             <div key={key} className="flex justify-between">
               <span>{key}:</span>
               <span className={val >= 60 ? "text-green-400" : "text-red-500"}>{val}</span>
             </div>
           ))}
        </div>

        <button
          onClick={onRestart}
          className="bg-green-700 text-black font-bold text-xl px-8 py-4 hover:bg-green-600 transition-all transform hover:scale-105 active:scale-95"
        >
          sudo reboot (再起動)
        </button>
      </div>
    </div>
  );
};
