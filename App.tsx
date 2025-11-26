
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
import { ItemDetailModal } from './components/ItemDetailModal'; // Import
import { useGameController } from './hooks/useGameController';
import { Terminal, Activity } from 'lucide-react';
import { GameStatus, ItemId } from './types';
import { ITEMS } from './data/items';
import { Sound } from './utils/sound';

// ミニステータスバー (Mobile only helper)
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
    <Layout state={state} overlays={overlays} onMenuOpen={actions.openMenu}>
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

      {/* --- MOBILE LAYOUT --- */}
      <div className="lg:hidden flex flex-col h-full">
        {/* Content Area */}
        <div className="flex-1 overflow-hidden relative">
          {ui.mobileTab === 'terminal' ? (
             <div className="flex flex-col h-full">
                <div className="flex-1 min-h-0">
                   <LogWindow logs={state.logs} />
                </div>
                <div className="shrink-0 max-h-[50vh] overflow-y-auto border-t border-green-900 bg-black">
                  <ActionPanel 
                    state={state} 
                    actions={actions} 
                    onInspect={handleInspect}
                  />
                </div>
             </div>
          ) : (
             <div className="h-full overflow-y-auto p-2">
                <StatusDisplay state={state} />
             </div>
          )}
        </div>

        {/* Bottom Nav */}
        <div className="shrink-0 bg-black border-t-2 border-green-800 p-2 pb-4 md:pb-2 space-y-3 z-30 shadow-[0_-5px_20px_rgba(0,0,0,0.5)]">
          <div className="flex gap-3 px-1">
             <MiniBar 
                label="HP" value={state.hp} max={state.maxHp} 
                color={state.hp < 30 ? "bg-red-500 animate-pulse" : "bg-green-500"} 
             />
             <MiniBar 
                label="SAN" value={state.sanity} max={state.maxSanity} 
                color={state.sanity < 30 ? "bg-purple-500 animate-pulse" : "bg-blue-500"} 
             />
             <MiniBar 
                label="CFN" value={state.caffeine} max={200} 
                color={state.caffeine > 100 ? "bg-red-500 animate-pulse" : state.caffeine > 40 ? "bg-yellow-500" : "bg-yellow-700"} 
             />
          </div>

          <div className="grid grid-cols-2 gap-3">
             <button
                onClick={() => actions.setMobileTab('terminal')}
                className={`p-2.5 text-xs font-bold border flex items-center justify-center gap-2 transition-all duration-200 ${
                   ui.mobileTab === 'terminal' 
                   ? 'bg-green-900/40 border-green-500 text-green-400 shadow-[0_0_10px_rgba(34,197,94,0.2)]' 
                   : 'bg-gray-900/20 border-gray-800 text-gray-500 hover:bg-gray-900'
                }`}
             >
                <Terminal size={16} /> TERMINAL
             </button>
             <button
                onClick={() => actions.setMobileTab('status')}
                className={`p-2.5 text-xs font-bold border flex items-center justify-center gap-2 transition-all duration-200 ${
                   ui.mobileTab === 'status' 
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
