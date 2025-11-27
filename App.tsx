
import React, { useState, useEffect } from 'react';
import { Layout } from './components/Layout';
import { StatusDisplay } from './components/StatusDisplay';
import { LogWindow } from './components/LogWindow';
import { ActionPanel } from './components/ActionPanel';
import { EndingScreen } from './components/EndingScreen';
import { ShopModal } from './components/ShopModal';
import { DebugPanel } from './components/DebugPanel';
import { EventDialog } from './components/EventDialog';
import { SaveLoadModal } from './components/SaveLoadModal';
import { DeathSequence } from './components/DeathSequence';
import { ItemDetailModal } from './components/ItemDetailModal';
import { useGameController } from './hooks/useGameController';
import { Terminal, Activity } from 'lucide-react';
import { GameStatus, ItemId } from './types';
import { ITEMS } from './data/items';
import { Sound } from './utils/sound';
import { SwipeableStatus } from './components/status/SwipeableStatus';

// ミニステータスバー (Mobile only helper)
const MiniBar = ({ value, max, color, label }: { value: number; max: number; color: string; label: string }) => (
  <div className="flex-1 flex flex-col gap-0.5">
    <div className="flex justify-between fs-xxs leading-none text-gray-400 font-mono">
       <span>{label}</span>
       <span>{max > 20000 ? value.toLocaleString() : value}</span>
    </div>
    <div className="h-1.5 bg-gray-800 w-full border border-gray-700/50">
       <div className={`h-full ${color} transition-all duration-500`} style={{ width: `${Math.min(100, (value/max)*100)}%` }} />
    </div>
  </div>
);

const App: React.FC = () => {
  const { state, ui, actions } = useGameController();
  const [showDeathSequence, setShowDeathSequence] = useState(false);
  const [showEndingScreen, setShowEndingScreen] = useState(false);
  
  // Inspect State
  const [inspectedItem, setInspectedItem] = useState<{ id: ItemId; mode: 'inventory' | 'shop' } | null>(null);

  // Watch for Game Over status to trigger sequence
  useEffect(() => {
    if (state.status === GameStatus.GAME_OVER_HP || state.status === GameStatus.GAME_OVER_SANITY) {
      if (!showEndingScreen) {
        setShowDeathSequence(true);
      }
    } else if (state.status === GameStatus.VICTORY || state.status === GameStatus.FAILURE) {
      // Normal ending (Pass/Fail) shows immediately
      setShowEndingScreen(true);
    } else {
      // Playing state reset
      setShowDeathSequence(false);
      setShowEndingScreen(false);
    }
  }, [state.status]);

  const handleSequenceComplete = () => {
    setShowDeathSequence(false);
    setShowEndingScreen(true);
  };

  const handleRestart = () => {
    setShowEndingScreen(false);
    setShowDeathSequence(false);
    actions.restart();
  }

  // Inspect Handlers
  const handleInspect = (itemId: ItemId, mode: 'inventory' | 'shop') => {
    Sound.play('button_click');
    setInspectedItem({ id: itemId, mode });
  };

  const handleCloseInspect = () => {
    setInspectedItem(null);
  };

  const overlays = (
    <>
      {ui.isShopOpen && (
        <ShopModal 
          money={state.money} 
          onClose={actions.closeShop} 
          onBuy={actions.buyItem} 
          onInspect={handleInspect}
        />
      )}
      {ui.isMenuOpen && (
        <SaveLoadModal
          currentState={state}
          onClose={actions.closeMenu}
          onLoad={actions.loadState}
          onReset={actions.fullReset}
          onSoftReset={actions.softReset}
          onHardReset={actions.hardRestart}
          uiScale={ui.uiScale}
          onSetUiScale={actions.setUiScale}
        />
      )}
      {state.pendingEvent && (
        <EventDialog 
          event={state.pendingEvent} 
          onResolve={actions.resolveEvent} 
        />
      )}
      
      {/* Item Detail Modal */}
      {inspectedItem && (
        <ItemDetailModal
          item={ITEMS[inspectedItem.id]}
          mode={inspectedItem.mode}
          onClose={handleCloseInspect}
          onBuy={(id) => { actions.buyItem(id); handleCloseInspect(); }}
          onUse={(id) => { actions.useItem(id); handleCloseInspect(); }}
          canBuy={state.money >= ITEMS[inspectedItem.id].price}
          canUse={(state.inventory[inspectedItem.id] || 0) > 0}
        />
      )}

      {/* Death Sequence Overlay */}
      {showDeathSequence && (
        <DeathSequence 
          type={state.status === GameStatus.GAME_OVER_HP ? 'hp' : 'sanity'} 
          cause={state.logs[state.logs.length - 1]?.text || "UNKNOWN ERROR"}
          onComplete={handleSequenceComplete} 
        />
      )}

      {/* Ending Screen */}
      {showEndingScreen && (
        <EndingScreen state={state} onRestart={handleRestart} />
      )}
      
      <DebugPanel state={state} />
    </>
  );

  return (
    <Layout state={state} overlays={overlays} onMenuOpen={actions.openMenu} uiScale={ui.uiScale}>
      {/* --- DESKTOP LAYOUT --- */}
      <div className="hidden lg:grid flex-1 grid-cols-12 gap-4 h-full min-h-0 p-4 pt-0">
        {/* Left: Status */}
        <div className="col-span-3 h-full min-h-0 overflow-hidden">
          <StatusDisplay state={state} />
        </div>

        {/* Right: Logs & Actions */}
        <div className="col-span-9 flex flex-col gap-4 h-full min-h-0">
          <div className="flex-1 min-h-0">
             <LogWindow logs={state.logs} />
          </div>
          <div className="shrink-0">
            <ActionPanel 
              state={state} 
              actions={actions} 
              onInspect={handleInspect}
            />
          </div>
        </div>
      </div>

      {/* --- MOBILE LAYOUT (Refined) --- */}
      <div className="lg:hidden flex flex-col h-full">
        
        {/* Main Content Area (Scrollable) */}
        <div className="flex-1 overflow-hidden relative flex flex-col">
          {ui.mobileTab === 'terminal' ? (
             <div className="flex flex-col h-full">
                {/* Log Window takes remaining space */}
                <div className="flex-1 min-h-0 overflow-hidden">
                   <LogWindow logs={state.logs} />
                </div>
                {/* Action Panel is scrollable but constrained height */}
                <div className="shrink-0 h-[55%] border-t-2 border-green-900 bg-black/95 shadow-[0_-5px_20px_rgba(0,0,0,0.5)] z-10 flex flex-col">
                  <div className="fs-xxs bg-green-900/20 text-green-500 px-2 py-1 text-center font-bold border-b border-green-900/50">
                    ACTION_MODULE
                  </div>
                  <div className="flex-1 min-h-0 overflow-y-auto">
                    <ActionPanel 
                      state={state} 
                      actions={actions} 
                      onInspect={handleInspect}
                    />
                  </div>
                </div>
             </div>
          ) : (
             <div className="h-full w-full">
                <SwipeableStatus state={state} />
             </div>
          )}
        </div>

        {/* Bottom Nav (Always visible) */}
        <div className="shrink-0 bg-black border-t border-green-800 p-2 pb-safe z-30 shadow-[0_-2px_10px_rgba(0,0,0,0.5)]">
          {/* Mini Status Grid */}
          <div className="grid grid-cols-3 gap-2 mb-2 px-1">
             <MiniBar label="HP" value={state.hp} max={state.maxHp} color={state.hp < 30 ? "bg-red-500 animate-pulse" : "bg-green-500"} />
             <MiniBar label="SAN" value={state.sanity} max={state.maxSanity} color={state.sanity < 30 ? "bg-purple-500 animate-pulse" : "bg-blue-500"} />
             <MiniBar label="¥" value={state.money} max={30000} color="bg-yellow-500" />
          </div>

          {/* Tab Buttons */}
          <div className="grid grid-cols-2 gap-3">
             <button
                onClick={() => actions.setMobileTab('terminal')}
                className={`p-3 rounded-sm fs-xs font-bold border flex items-center justify-center gap-2 transition-all active:scale-95 ${
                   ui.mobileTab === 'terminal' 
                   ? 'bg-green-900/40 border-green-500 text-green-400 shadow-[0_0_10px_rgba(34,197,94,0.2)]' 
                   : 'bg-gray-900/20 border-gray-800 text-gray-500 hover:bg-gray-900'
                }`}
             >
                <Terminal size={18} /> TERMINAL
             </button>
             <button
                onClick={() => actions.setMobileTab('status')}
                className={`p-3 rounded-sm fs-xs font-bold border flex items-center justify-center gap-2 transition-all active:scale-95 ${
                   ui.mobileTab === 'status' 
                   ? 'bg-green-900/40 border-green-500 text-green-400 shadow-[0_0_10px_rgba(34,197,94,0.2)]' 
                   : 'bg-gray-900/20 border-gray-800 text-gray-500 hover:bg-gray-900'
                }`}
             >
                <Activity size={18} /> STATUS
             </button>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default App;
