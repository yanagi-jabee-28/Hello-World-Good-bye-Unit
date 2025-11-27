
import React, { useState } from 'react';
import { GameState } from '../types';
import { CAFFEINE_THRESHOLDS, BUFF_SOFT_CAP_ASYMPTOTE } from '../config/gameConstants';
import { BarChart2, Activity, Cpu } from 'lucide-react';
import { BioMonitor } from './status/BioMonitor';
import { AcademicMonitor } from './status/AcademicMonitor';
import { InventoryList } from './status/InventoryList';
import { Panel } from './ui/Panel';

interface Props {
  state: GameState;
}

export const StatusDisplay: React.FC<Props> = ({ state }) => {
  const [showDevMetrics, setShowDevMetrics] = useState(false);

  return (
    <Panel 
      title="BIO_METRICS" 
      className="h-full"
      rightAction={
        <button 
          onClick={() => setShowDevMetrics(!showDevMetrics)}
          className="opacity-30 hover:opacity-100 transition-opacity text-green-400"
          title="Toggle Dev Metrics"
        >
           <Cpu size={14} />
        </button>
      }
    >
      <div className="space-y-6">
        {/* Avatar / Visual could go here */}
        <div className="relative">
           <BioMonitor state={state} />
        </div>
        
        <div className="border-t border-green-900/30 my-4" />
        
        <AcademicMonitor state={state} />
        
        <div className="border-t border-green-900/30 my-4" />
        
        <InventoryList state={state} />
        
        <div className="mt-6 grid grid-cols-2 gap-2 fs-xxs text-gray-500 font-mono border-t border-gray-800 pt-2">
          <div className="flex justify-between">
             <span>HEART_RATE:</span>
             <span className={state.caffeine > 100 ? "text-red-500 animate-pulse" : "text-green-500"}>
                {60 + Math.floor(state.caffeine * 0.5)} BPM
             </span>
          </div>
          <div className="flex justify-between">
             <span>CORTISOL:</span>
             <span className={state.sanity < 40 ? "text-red-500" : "text-blue-500"}>
                {Math.max(0, 100 - state.sanity)}%
             </span>
          </div>
          <div className="flex justify-between">
             <span>SYS_UPTIME:</span>
             <span>{state.turnCount} TICKS</span>
          </div>
          <div className="flex justify-between">
             <span>STATUS:</span>
             <span>{state.hp < 30 || state.sanity < 30 ? "CRITICAL" : "STABLE"}</span>
          </div>
        </div>

        {showDevMetrics && (
          <div className="mt-4 p-2 bg-black border border-green-900 fs-xxs font-mono text-green-600">
             <div className="font-bold border-b border-green-900 mb-1 text-green-400">DEBUG_LAYER</div>
             <div>Soft Cap Asymp: +{BUFF_SOFT_CAP_ASYMPTOTE}</div>
             <div>Thresholds: {Object.values(CAFFEINE_THRESHOLDS).join('/')}</div>
             <div>Buff Count: {state.activeBuffs.length}</div>
             <div>Event Hist: {state.eventHistory.length}</div>
          </div>
        )}
      </div>
    </Panel>
  );
};