
import React from 'react';
import { GameState } from '../types';
import { AlertOctagon, Heart, Moon, Zap, Activity } from 'lucide-react';

interface Props {
  state: GameState;
}

export const RiskMeter: React.FC<Props> = ({ state }) => {
  if (!state.debugFlags.riskOverlay) return null;

  const { risk, riskBreakdown } = state;
  const percent = Math.round(risk * 100);
  
  // Color based on risk
  let color = 'bg-green-500';
  let textColor = 'text-green-400';
  if (percent > 30) { color = 'bg-yellow-500'; textColor = 'text-yellow-400'; }
  if (percent > 60) { color = 'bg-orange-500'; textColor = 'text-orange-400'; }
  if (percent > 80) { color = 'bg-red-600'; textColor = 'text-red-500'; }

  return (
    <div className="fixed top-20 right-4 z-50 w-48 bg-black/90 border border-gray-700 rounded shadow-[0_0_20px_rgba(0,0,0,0.5)] p-3 backdrop-blur-sm pointer-events-none select-none animate-[fadeIn_0.5s]">
      <div className="flex justify-between items-center mb-1">
        <div className="text-xs font-bold text-gray-400 flex items-center gap-1">
          <Activity size={12} /> DEATH_RISK
        </div>
        <div className={`text-sm font-mono font-bold ${textColor}`}>
          {percent}%
        </div>
      </div>
      
      {/* Main Bar */}
      <div className="h-2 w-full bg-gray-800 rounded-full overflow-hidden mb-2 border border-gray-700/50">
        <div 
          className={`h-full ${color} transition-all duration-300 ease-out motion-reduce:transition-none`}
          style={{ width: `${percent}%` }}
        />
      </div>

      {/* Breakdown */}
      {state.debugFlags.riskDetail && riskBreakdown && (
        <div className="space-y-1 mt-2 pt-2 border-t border-gray-800">
          <div className="flex justify-between items-center text-[10px] text-gray-500">
            <span className="flex items-center gap-1"><Heart size={8} /> HP_FACTOR</span>
            <span className="font-mono">{Math.round(riskBreakdown.hp * 100)}%</span>
          </div>
          <div className="flex justify-between items-center text-[10px] text-gray-500">
            <span className="flex items-center gap-1"><AlertOctagon size={8} /> STRESS</span>
            <span className="font-mono">{Math.round(riskBreakdown.stress * 100)}%</span>
          </div>
          <div className="flex justify-between items-center text-[10px] text-gray-500">
            <span className="flex items-center gap-1"><Moon size={8} /> SLEEP_DEBT</span>
            <span className="font-mono">{Math.round(riskBreakdown.sleep * 100)}%</span>
          </div>
          <div className="flex justify-between items-center text-[10px] text-gray-500">
            <span className="flex items-center gap-1"><Zap size={8} /> STREAK</span>
            <span className="font-mono">{Math.round(riskBreakdown.streak * 100)}%</span>
          </div>
        </div>
      )}
    </div>
  );
};
