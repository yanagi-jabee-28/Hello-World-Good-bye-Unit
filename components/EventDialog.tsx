
import React, { useEffect } from 'react';
import { GameEvent, ActionType } from '../types';
import { AlertTriangle, CheckCircle, Shield, Zap } from 'lucide-react';
import { Sound } from '../utils/sound';

interface Props {
  event: GameEvent;
  onResolve: (optionId: string) => void;
}

export const EventDialog: React.FC<Props> = ({ event, onResolve }) => {
  useEffect(() => {
    Sound.play('event_trigger');
  }, []);

  if (!event.options) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-sm animate-[fadeIn_0.2s_ease-out] p-4">
      <div className="max-w-lg w-full border-2 border-green-600 bg-black shadow-[0_0_50px_rgba(34,197,94,0.2)] flex flex-col">
        
        {/* Header */}
        <div className="p-4 border-b border-green-800 bg-green-900/20">
          <h2 className="text-lg font-bold text-green-400 flex items-center gap-2">
            <AlertTriangle className="text-yellow-500" size={20} />
            INTERRUPT: {event.type.toUpperCase()}_EVENT
          </h2>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <p className="text-md text-gray-200 leading-relaxed whitespace-pre-wrap">
            {event.text}
          </p>
          
          <div className="space-y-3 mt-6">
            {event.options.map((opt) => {
              // リスクレベルに応じたスタイル
              let borderClass = "border-gray-700";
              let riskColor = "text-gray-500";
              let riskIcon = <Shield size={14} />;
              
              if (opt.risk === 'safe') {
                 borderClass = "border-green-800 hover:border-green-500 hover:bg-green-900/20";
                 riskColor = "text-green-500";
                 riskIcon = <Shield size={14} />;
              } else if (opt.risk === 'low') {
                 borderClass = "border-blue-800 hover:border-blue-500 hover:bg-blue-900/20";
                 riskColor = "text-blue-500";
                 riskIcon = <CheckCircle size={14} />;
              } else {
                 borderClass = "border-red-800 hover:border-red-500 hover:bg-red-900/20";
                 riskColor = "text-red-500";
                 riskIcon = <Zap size={14} />;
              }

              return (
                <button
                  key={opt.id}
                  onClick={() => onResolve(opt.id)}
                  className={`w-full p-4 border text-left transition-all group ${borderClass}`}
                >
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-bold text-white group-hover:text-green-300">{opt.label}</span>
                    <div className={`text-xs flex items-center gap-1 uppercase font-mono ${riskColor}`}>
                       {riskIcon} RISK: {opt.risk}
                    </div>
                  </div>
                  <div className="text-xs text-gray-400 group-hover:text-gray-300">
                    {opt.description}
                  </div>
                  <div className="mt-2 text-[10px] text-gray-500 font-mono">
                     成功率: {opt.successRate}%
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="p-2 border-t border-green-900 text-center text-[10px] text-gray-600">
          WAITING FOR USER INPUT...
        </div>
      </div>
    </div>
  );
};
