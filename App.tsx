
import React, { useState } from 'react';
import { Layout } from './components/Layout';
import { StatusDisplay } from './components/StatusDisplay';
import { LogWindow } from './components/LogWindow';
import { ActionPanel } from './components/ActionPanel';
import { EndingScreen } from './components/EndingScreen';
import { ShopModal } from './components/ShopModal';
import { useGameEngine } from './hooks/useGameEngine';
import { ActionType, GameAction, ItemId } from './types';
import { Terminal, Activity } from 'lucide-react';

// ミニステータスバーコンポーネント（スマホ用）
const MiniBar = ({ value, max, color, label }: { value: number; max: number; color: string; label: string }) => (
  <div className="flex-1 flex flex-col gap-0.5">
    <div className="flex justify-between text-[10px] leading-none text-gray-400 font-mono">
       <span>{label}</span>
       <span>{value}</span>
    </div>
    <div className="h-1.5 bg-gray-800 w-full border border-gray-700/50">
       <div className={`h-full ${color} transition-all duration-500`} style={{ width: `${Math.min(100, (value/max)*100)}%` }} />
    </div>
  </div>
);

const App: React.FC = () => {
  const { state, dispatch } = useGameEngine();
  const [isShopOpen, setIsShopOpen] = useState(false);
  const [mobileTab, setMobileTab] = useState<'terminal' | 'status'>('terminal');

  const handleAction = (type: ActionType, payload?: any) => {
    dispatch({ type, payload } as GameAction);
  };

  const handleBuyItem = (itemId: ItemId) => {
    dispatch({ type: ActionType.BUY_ITEM, payload: itemId });
  };

  const overlays = (
    <>
      {isShopOpen && (
        <ShopModal 
          money={state.money} 
          onClose={() => setIsShopOpen(false)} 
          onBuy={handleBuyItem} 
        />
      )}
      <EndingScreen state={state} onRestart={() => handleAction(ActionType.RESTART)} />
    </>
  );

  return (
    <Layout state={state} overlays={overlays}>
      {/* --- DESKTOP LAYOUT (Large Screen) --- */}
      <div className="hidden lg:grid flex-1 grid-cols-12 gap-4 h-full min-h-0">
        {/* Left Column: Status (3 cols) */}
        <div className="col-span-3 h-full min-h-0 overflow-y-auto shrink-0 scrollbar-hide">
          <StatusDisplay state={state} />
        </div>

        {/* Right Column: Logs & Actions (9 cols) */}
        <div className="col-span-9 flex flex-col gap-4 h-full min-h-0">
          {/* Log Window */}
          <div className="flex-1 min-h-0 relative">
             <div className="absolute inset-0">
               <LogWindow logs={state.logs} />
             </div>
          </div>
          {/* Action Panel */}
          <div className="shrink-0">
            <ActionPanel 
              state={state} 
              onAction={handleAction} 
              onShopOpen={() => setIsShopOpen(true)}
            />
          </div>
        </div>
      </div>

      {/* --- MOBILE LAYOUT (Small Screen) --- */}
      <div className="lg:hidden flex flex-col h-full">
        
        {/* Content Area (Tab Switchable) */}
        <div className="flex-1 overflow-hidden relative">
          {mobileTab === 'terminal' ? (
             <div className="flex flex-col h-full">
                {/* Logs: Takes available space */}
                <div className="flex-1 min-h-0 relative">
                   <div className="absolute inset-0">
                     <LogWindow logs={state.logs} />
                   </div>
                </div>
                {/* Action Panel: Constrained height, internal scroll if needed */}
                <div className="shrink-0 max-h-[50vh] overflow-y-auto border-t border-green-900 bg-black">
                  <ActionPanel 
                    state={state} 
                    onAction={handleAction} 
                    onShopOpen={() => setIsShopOpen(true)}
                  />
                </div>
             </div>
          ) : (
             // Status Tab: Full scrollable status
             <div className="h-full overflow-y-auto">
                <StatusDisplay state={state} />
             </div>
          )}
        </div>

        {/* Mobile Bottom Navigation & Mini Status */}
        <div className="shrink-0 bg-black border-t-2 border-green-800 p-2 pb-4 md:pb-2 space-y-3 z-30 shadow-[0_-5px_20px_rgba(0,0,0,0.5)]">
          {/* Mini Status Indicators (Always Visible) */}
          <div className="flex gap-3 px-1">
             <MiniBar 
                label="HP" 
                value={state.hp} 
                max={state.maxHp} 
                color={state.hp < 30 ? "bg-red-500 animate-pulse" : "bg-green-500"} 
             />
             <MiniBar 
                label="SAN" 
                value={state.sanity} 
                max={state.maxSanity} 
                color={state.sanity < 30 ? "bg-purple-500 animate-pulse" : "bg-blue-500"} 
             />
             <MiniBar 
                label="CFN" 
                value={state.caffeine} 
                max={200} 
                color={state.caffeine > 100 ? "bg-red-500 animate-pulse" : state.caffeine > 40 ? "bg-yellow-500" : "bg-yellow-700"} 
             />
          </div>

          {/* Tab Buttons */}
          <div className="grid grid-cols-2 gap-3">
             <button
                onClick={() => setMobileTab('terminal')}
                className={`p-2.5 text-xs font-bold border flex items-center justify-center gap-2 transition-all duration-200 ${
                   mobileTab === 'terminal' 
                   ? 'bg-green-900/40 border-green-500 text-green-400 shadow-[0_0_10px_rgba(34,197,94,0.2)]' 
                   : 'bg-gray-900/20 border-gray-800 text-gray-500 hover:bg-gray-900'
                }`}
             >
                <Terminal size={16} /> TERMINAL
             </button>
             <button
                onClick={() => setMobileTab('status')}
                className={`p-2.5 text-xs font-bold border flex items-center justify-center gap-2 transition-all duration-200 ${
                   mobileTab === 'status' 
                   ? 'bg-green-900/40 border-green-500 text-green-400 shadow-[0_0_10px_rgba(34,197,94,0.2)]' 
                   : 'bg-gray-900/20 border-gray-800 text-gray-500 hover:bg-gray-900'
                }`}
             >
                <Activity size={16} /> BIO_MONITOR
             </button>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default App;
