
import React from 'react';
import { GameState } from '../../types';
import { CAFFEINE_THRESHOLDS, SATIETY_CONSTANTS } from '../../config/gameConstants';
import { Wallet, Zap, Bed, AlertOctagon, Heart, Brain, Coffee, Utensils } from 'lucide-react';
import { ProgressBar } from '../ui/ProgressBar';
import { Badge } from '../ui/Badge';

interface Props {
  state: GameState;
}

export const BioMonitor: React.FC<Props> = ({ state }) => {
  // Helper to determine color and status text based on thresholds
  const getCaffeineState = (val: number) => {
    if (val >= CAFFEINE_THRESHOLDS.TOXICITY) return { status: "TOXICITY", color: "bg-red-600", badge: "danger", animate: true };
    if (val >= CAFFEINE_THRESHOLDS.ZONE) return { status: "ZONE", color: "bg-orange-500", badge: "warning", animate: true };
    if (val >= CAFFEINE_THRESHOLDS.AWAKE) return { status: "AWAKE", color: "bg-yellow-500", badge: "warning", animate: false };
    return { status: "NORMAL", color: "bg-gray-600", badge: "outline", animate: false };
  };

  const getSatietyState = (val: number) => {
    if (val >= SATIETY_CONSTANTS.STUFFED) return { status: "STUFFED", color: "bg-yellow-600", badge: "warning" };
    if (val >= 60) return { status: "FULL", color: "bg-blue-500", badge: "info" };
    if (val <= 20) return { status: "HUNGRY", color: "bg-green-500", badge: "success" };
    return { status: "NORMAL", color: "bg-gray-600", badge: "outline" };
  };

  const cfnState = getCaffeineState(state.caffeine);
  const satState = getSatietyState(state.satiety);

  return (
    <div className="space-y-5">
        {/* Funds Display */}
        <div className="flex justify-between items-center bg-green-900/10 border border-green-800/50 p-2 rounded">
           <div className="flex items-center gap-2 text-sm text-green-400 font-bold">
             <Wallet size={16} /> FUNDS
           </div>
           <div className="text-lg font-bold text-yellow-400 font-mono tracking-wider text-shadow-glow">
             ¥{state.money.toLocaleString()}
           </div>
        </div>

        {/* Primary Vitals */}
        <div className="space-y-3">
          <div className="flex items-end justify-between mb-1">
             <h4 className="fs-xxs text-gray-500 font-bold uppercase tracking-widest">VITAL_SIGNS</h4>
          </div>
          
          <ProgressBar 
            label="HP (体力)" 
            value={state.hp} 
            max={state.maxHp} 
            colorClass={state.hp < 30 ? 'bg-red-600 animate-pulse shadow-[0_0_10px_rgba(220,38,38,0.5)]' : 'bg-gradient-to-r from-green-600 to-green-400'} 
            subLabel={`${state.hp}%`}
          />
          <ProgressBar 
            label="SAN (正気度)" 
            value={state.sanity} 
            max={state.maxSanity} 
            colorClass={state.sanity < 30 ? 'bg-purple-600 animate-pulse shadow-[0_0_10px_rgba(147,51,234,0.5)]' : 'bg-gradient-to-r from-blue-600 to-cyan-400'} 
            subLabel={`${state.sanity}%`}
          />
        </div>

        {/* Secondary Stats (2 col) */}
        <div className="grid grid-cols-2 gap-3">
           <div className="bg-gray-900/30 border border-gray-800 p-2 rounded relative overflow-hidden">
              <div className="flex justify-between items-start mb-2">
                 <div className="text-orange-400 fs-xxs font-bold flex items-center gap-1"><Coffee size={12}/> CAFFEINE</div>
                 <Badge variant={cfnState.badge as any} className="scale-75 origin-top-right">{cfnState.status}</Badge>
              </div>
              <div className="relative h-1.5 w-full bg-gray-800 rounded-full overflow-hidden">
                 <div className={`absolute top-0 left-0 h-full ${cfnState.color} transition-all duration-500`} style={{ width: `${Math.min(100, (state.caffeine / 200) * 100)}%` }} />
              </div>
              <div className="text-right fs-xxs font-mono text-gray-400 mt-1">{state.caffeine}mg</div>
           </div>

           <div className="bg-gray-900/30 border border-gray-800 p-2 rounded relative overflow-hidden">
              <div className="flex justify-between items-start mb-2">
                 <div className="text-blue-400 fs-xxs font-bold flex items-center gap-1"><Utensils size={12}/> SATIETY</div>
                 <Badge variant={satState.badge as any} className="scale-75 origin-top-right">{satState.status}</Badge>
              </div>
              <div className="relative h-1.5 w-full bg-gray-800 rounded-full overflow-hidden">
                 <div className={`absolute top-0 left-0 h-full ${satState.color} transition-all duration-500`} style={{ width: `${Math.min(100, (state.satiety / state.maxSatiety) * 100)}%` }} />
              </div>
              <div className="text-right fs-xxs font-mono text-gray-400 mt-1">{state.satiety}%</div>
           </div>
        </div>

      {/* Active Buffs */}
      {state.activeBuffs.length > 0 && (
        <div className="mt-4 animate-fadeIn">
          <h3 className="text-xs font-bold text-yellow-500 mb-2 border-b border-yellow-900/50 pb-1 flex items-center gap-2">
            <Zap size={12} /> ACTIVE EFFECTS
          </h3>
          <div className="space-y-1.5">
            {state.activeBuffs.map((buff) => {
              let icon = <Zap size={12} />;
              let color = 'text-yellow-400';
              let border = 'border-yellow-900/30 bg-yellow-900/10';
              
              if (buff.type === 'REST_EFFICIENCY') { 
                 icon = <Bed size={12} />; 
                 color = 'text-blue-400';
                 border = 'border-blue-900/30 bg-blue-900/10';
              }
              if (buff.type === 'SANITY_DRAIN') { 
                 icon = <AlertOctagon size={12} />; 
                 color = 'text-red-400';
                 border = 'border-red-900/30 bg-red-900/10';
              }
              
              return (
                <div key={buff.id} className={`flex justify-between items-center text-xs border p-1.5 rounded ${border}`}>
                  <div className={`flex items-center gap-2 ${color} font-bold`}>
                    {icon}
                    <span>{buff.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-500 fs-xxs hidden sm:inline">{buff.description}</span>
                    <span className="font-mono font-bold text-white bg-black/50 px-1.5 py-0.5 rounded text-[10px] border border-gray-700">
                      {buff.duration}T
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
