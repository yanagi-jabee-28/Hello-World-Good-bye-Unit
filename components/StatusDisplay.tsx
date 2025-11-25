
import React, { useState } from 'react';
import { GameState } from '../types';
import { CAFFEINE_THRESHOLDS, BUFF_SOFT_CAP_ASYMPTOTE } from '../config/gameConstants';
import { BarChart2, Activity } from 'lucide-react';
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
      title="BIO_MONITOR" 
      className="h-full"
      rightAction={
        <button 
          onClick={() => setShowDevMetrics(!showDevMetrics)}
          className="opacity-30 hover:opacity-100 transition-opacity"
          title="Toggle Dev Metrics"
        >
           <BarChart2 size={12} />
        </button>
      }
    >
      <div className="space-y-6">
        <BioMonitor state={state} />
        <div className="border-t border-gray-800 my-4" />
        <AcademicMonitor state={state} />
        <div className="border-t border-gray-800 my-4" />
        <InventoryList state={state} />
        
        <div className="mt-6 text-[10px] text-gray-600 font-mono flex justify-between">
          <span>STATUS: {state.hp < 30 || state.sanity < 30 ? "CRITICAL" : "STABLE"}</span>
          <span>UPTIME: {state.turnCount} TICKS</span>
        </div>

        {showDevMetrics && (
          <div className="mt-4 p-2 bg-gray-900 border border-gray-700 text-[10px] font-mono text-gray-300">
             <div className="font-bold border-b border-gray-700 mb-1 text-yellow-500">DEV METRICS</div>
             <div>Soft Cap Asymp: +{BUFF_SOFT_CAP_ASYMPTOTE}</div>
             <div>Awake/Zone/Toxic: {Object.values(CAFFEINE_THRESHOLDS).join('/')}</div>
             <div>Buff Count: {state.activeBuffs.length}</div>
             <div>Event Hist: {state.eventHistory.length}</div>
          </div>
        )}
      </div>
    </Panel>
  );
};
