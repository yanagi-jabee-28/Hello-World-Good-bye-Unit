
import React from 'react';
import { GameState, SubjectId, ItemId, RelationshipId } from '../types';
import { SUBJECTS, PASSING_SCORE } from '../data/subjects';
import { ITEMS } from '../data/items';
import { Heart, Brain, Coffee, Package, Users, Wallet, Zap, Bed, AlertOctagon } from 'lucide-react';

interface Props {
  state: GameState;
}

const ProgressBar: React.FC<{ value: number; max: number; colorClass: string; label: string; subLabel?: string }> = ({ value, max, colorClass, label, subLabel }) => {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100));
  
  return (
    <div className="mb-3">
      <div className="flex justify-between text-xs mb-1 font-bold">
        <span>{label}</span>
        <span>{subLabel || `${value}/${max}`}</span>
      </div>
      <div className="h-3 w-full bg-gray-900 border border-gray-800 relative overflow-hidden">
        <div 
          className={`h-full ${colorClass} transition-all duration-500`} 
          style={{ width: `${percentage}%` }}
        />
        <div className="absolute top-0 left-0 w-full h-full bg-[linear-gradient(90deg,transparent_0%,rgba(0,0,0,0.5)_50%,transparent_100%)] opacity-20" />
      </div>
    </div>
  );
};

const SubjectBar: React.FC<{ subjectId: SubjectId; score: number }> = ({ subjectId, score }) => {
  const isPassing = score >= PASSING_SCORE;
  const color = isPassing ? 'bg-green-500' : 'bg-red-500';
  
  return (
    <div className="mb-2">
      <div className="flex justify-between text-xs mb-0.5">
        <span className={isPassing ? 'text-green-400' : 'text-red-400'}>{SUBJECTS[subjectId].name}</span>
        <span>{score}%</span>
      </div>
      <div className="h-2 w-full bg-gray-900 border border-gray-800">
         <div className={`h-full ${color} transition-all duration-500`} style={{ width: `${score}%` }} />
      </div>
    </div>
  );
};

export const StatusDisplay: React.FC<Props> = ({ state }) => {
  const ownedItems = Object.entries(state.inventory)
    .filter(([_, count]) => (count || 0) > 0)
    .map(([id, count]) => ({ id: id as ItemId, count }));

  let caffeineStatus = "NORMAL";
  let caffeineColor = "bg-yellow-700";
  if (state.caffeine >= 50) { caffeineStatus = "AWAKE"; caffeineColor = "bg-yellow-500"; }
  if (state.caffeine >= 100) { caffeineStatus = "ZONE"; caffeineColor = "bg-orange-500"; }
  if (state.caffeine >= 150) { caffeineStatus = "OVERDOSE"; caffeineColor = "bg-red-600 animate-pulse"; }

  return (
    <div className="border-2 border-green-800 bg-black p-4 shadow-[0_0_15px_rgba(34,197,94,0.2)] h-full overflow-y-auto">
      <h2 className="text-lg font-bold mb-4 border-b border-green-900 pb-2 flex items-center gap-2">
        <div className="w-3 h-3 bg-green-500 animate-pulse" /> 
        BIO_MONITOR (生体情報)
      </h2>
      
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
          colorClass={state.sanity < 30 ? 'bg-red-600 animate-pulse' : 'bg-blue-500'} 
        />
        <ProgressBar 
          label="CFN (カフェイン)" 
          value={state.caffeine} 
          max={200} 
          subLabel={`${caffeineStatus} (${state.caffeine}mg)`}
          colorClass={caffeineColor} 
        />
      </div>

      {/* Active Buffs Display */}
      {state.activeBuffs.length > 0 && (
        <div className="mt-6">
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

      <div className="mt-6">
        <h3 className="text-sm font-bold text-green-700 mb-2 border-b border-green-900 pb-1 flex items-center gap-2">
          <Users size={14} /> SOCIAL_LINKS (友好度)
        </h3>
        <div className="space-y-2">
            <ProgressBar 
              label="教授" 
              value={state.relationships[RelationshipId.PROFESSOR]} 
              max={100} 
              colorClass="bg-indigo-500" 
              subLabel={`${state.relationships[RelationshipId.PROFESSOR]}%`}
            />
            <ProgressBar 
              label="先輩" 
              value={state.relationships[RelationshipId.SENIOR]} 
              max={100} 
              colorClass="bg-purple-500" 
              subLabel={`${state.relationships[RelationshipId.SENIOR]}%`}
            />
            <ProgressBar 
              label="友人" 
              value={state.relationships[RelationshipId.FRIEND]} 
              max={100} 
              colorClass="bg-pink-500" 
              subLabel={`${state.relationships[RelationshipId.FRIEND]}%`}
            />
        </div>
      </div>

      <div className="mt-6">
        <h3 className="text-sm font-bold text-green-700 mb-2 border-b border-green-900 pb-1">ACADEMIC_PROGRESS (単位状況)</h3>
        {Object.values(SubjectId).map(id => (
          <SubjectBar key={id} subjectId={id} score={state.knowledge[id]} />
        ))}
      </div>

      <div className="mt-6">
        <h3 className="text-sm font-bold text-green-700 mb-2 border-b border-green-900 pb-1 flex items-center gap-2">
          <Package size={14} /> INVENTORY (所持品)
        </h3>
        {ownedItems.length === 0 ? (
          <div className="text-xs text-gray-600 italic">アイテムを持っていません</div>
        ) : (
          <div className="space-y-2">
            {ownedItems.map((item) => (
              <div key={item.id} className="flex justify-between items-center text-xs border border-gray-800 p-1.5">
                <span className="text-green-400">{ITEMS[item.id].name}</span>
                <span className="text-gray-400">x{item.count}</span>
              </div>
            ))}
          </div>
        )}
      </div>
      
      <div className="mt-6 text-xs text-gray-500">
        <p>STATUS: {state.hp < 30 || state.sanity < 30 ? "CRITICAL" : "STABLE"}</p>
        <p>UPTIME: {state.turnCount} TICKS</p>
      </div>
    </div>
  );
};
