
import React from 'react';
import { GameState } from '../../types';
import { CAFFEINE_THRESHOLDS, SATIETY_CONSTANTS } from '../../config/gameConstants';
import { Wallet, Zap, Bed, AlertOctagon } from 'lucide-react';
import { ProgressBar } from '../ui/ProgressBar';

interface Props {
  state: GameState;
}

export const BioMonitor: React.FC<Props> = ({ state }) => {
  // Caffeine Logic
  let caffeineStatus = "NORMAL";
  let caffeineColor = "bg-yellow-700";
  let caffeineEffect = "";
  
  if (state.caffeine >= CAFFEINE_THRESHOLDS.AWAKE) { 
      caffeineStatus = "AWAKE"; 
      caffeineColor = "bg-yellow-500"; 
  }
  if (state.caffeine >= CAFFEINE_THRESHOLDS.ZONE) { 
      caffeineStatus = "ZONE"; 
      caffeineColor = "bg-orange-500";
      caffeineEffect = "animate-pulse shadow-[0_0_10px_rgba(249,115,22,0.5)]"; 
  }
  if (state.caffeine >= CAFFEINE_THRESHOLDS.TOXICITY) { 
      caffeineStatus = "TOXICITY"; 
      caffeineColor = "bg-red-600"; 
      caffeineEffect = "animate-[pulse_0.2s_infinite] shadow-[0_0_15px_rgba(220,38,38,0.8)]";
  }

  // Satiety Logic (Item Capacity)
  let satietyStatus = "NORMAL";
  let satietyColor = "bg-green-600";
  let satietyEffect = "";

  if (state.satiety >= SATIETY_CONSTANTS.STUFFED) {
    satietyStatus = "STUFFED (満腹)";
    satietyColor = "bg-yellow-600"; // Warning (Full)
  } else if (state.satiety >= 60) {
    satietyStatus = "FULL (適度)";
    satietyColor = "bg-blue-500";
  } else if (state.satiety <= 20) {
    satietyStatus = "EMPTY (空腹)"; // Good for eating
    satietyColor = "bg-green-500";
  } else {
    satietyStatus = "NORMAL (普通)";
    satietyColor = "bg-green-600";
  }

  return (
    <div className="space-y-4">
        <div className="flex justify-between items-center border-b border-green-900/50 pb-2 mb-2">
           <div className="flex items-center gap-2 text-sm text-green-400">
             <Wallet size={16} /> FUNDS (所持金)
           </div>
           <div className="text-lg font-bold text-yellow-400 font-mono">
             ¥{state.money.toLocaleString()}
           </div>
        </div>

        <ProgressBar 
          label="HP (体力)" 
          value={state.hp} 
          max={state.maxHp} 
          colorClass={state.hp < 30 ? 'bg-red-600 animate-pulse' : 'bg-green-600'} 
        />
        <ProgressBar 
          label="SAN (正気度)" 
          value={state.sanity} 
          max={state.maxSanity} 
          colorClass={state.sanity < 30 ? 'bg-purple-600 animate-pulse' : 'bg-blue-500'} 
        />
        <ProgressBar 
          label="CFN (カフェイン)" 
          value={state.caffeine} 
          max={200} 
          subLabel={`${caffeineStatus} (${state.caffeine}mg)`}
          colorClass={caffeineColor}
          effectClass={caffeineEffect}
        />
        <ProgressBar 
          label="SAT (胃袋)" 
          value={state.satiety} 
          max={state.maxSatiety} 
          subLabel={`${satietyStatus}`}
          colorClass={satietyColor}
          effectClass={satietyEffect}
        />

      {/* Active Buffs */}
      {state.activeBuffs.length > 0 && (
        <div className="mt-4">
          <h3 className="text-sm font-bold text-yellow-500 mb-2 border-b border-yellow-900 pb-1 flex items-center gap-2">
            <Zap size={14} /> ACTIVE EFFECTS (状態異常)
          </h3>
          <div className="space-y-2">
            {state.activeBuffs.map((buff) => {
              let icon = <Zap size={12} />;
              let color = 'text-yellow-400';
              if (buff.type === 'REST_EFFICIENCY') { icon = <Bed size={12} />; color = 'text-blue-400'; }
              if (buff.type === 'SANITY_DRAIN') { icon = <AlertOctagon size={12} />; color = 'text-red-400'; }
              
              return (
                <div key={buff.id} className="flex justify-between items-center text-xs border border-gray-800 p-1.5 bg-gray-900/30">
                  <div className={`flex items-center gap-2 ${color}`}>
                    {icon}
                    <span>{buff.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-500">{buff.description}</span>
                    <span className="font-mono font-bold text-white bg-gray-800 px-1 rounded">
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
