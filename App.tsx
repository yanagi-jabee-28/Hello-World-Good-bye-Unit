import React, { useState, useEffect } from 'react';
import { Layout } from './components/Layout';
import { StatusDisplay } from './components/StatusDisplay';
import { LogWindow } from './components/LogWindow';
import { ActionPanel } from './components/ActionPanel';
import { OverlayLayer } from './components/OverlayLayer';
import { useGameController } from './hooks/useGameController';
import { Terminal, Activity, Zap, Utensils, Coins } from 'lucide-react';
import { GameStatus, ItemId } from './types';
import { Sound } from './utils/sound';
import { SwipeableStatus } from './components/status/SwipeableStatus';
import { CAFFEINE_THRESHOLDS, SATIETY_CONSTANTS } from './config/gameConstants';
import { MiniBar } from './components/ui/MiniBar';
import { useMediaQuery } from './hooks/useMediaQuery';

const App: React.FC = () => {
  const { state, ui, actions } = useGameController();
  const [showDeathSequence, setShowDeathSequence] = useState(false);
  const [showEndingScreen, setShowEndingScreen] = useState(false);
  
  // Layout Integrity Protocol: JS-based breakpoint detection
  // 1024px matches Tailwind's 'lg' breakpoint
  const isDesktop = useMediaQuery('(min-width: 1024px)');
  
  const [inspectedItem, setInspectedItem] = useState<{ id: ItemId; mode: 'inventory' | 'shop' } | null>(null);

  useEffect(() => {
    if (state.status === GameStatus.GAME_OVER_HP || state.status === GameStatus.GAME_OVER_SANITY) {
      if (!showEndingScreen) {
        setShowDeathSequence(true);
      }
    } else if (state.status === GameStatus.VICTORY || state.status === GameStatus.FAILURE) {
      setShowEndingScreen(true);
    } else {
      setShowDeathSequence(false);
      setShowEndingScreen(false);
    }
  }, [state.status, showEndingScreen]);

  const handleSequenceComplete = () => {
    setShowDeathSequence(false);
    setShowEndingScreen(true);
  };

  const handleRestart = () => {
    setShowEndingScreen(false);
    setShowDeathSequence(false);
    actions.restart();
  }

  const handleInspect = (itemId: ItemId, mode: 'inventory' | 'shop') => {
    Sound.play('button_click');
    setInspectedItem({ id: itemId, mode });
  };

  const handleCloseInspect = () => {
    setInspectedItem(null);
  };

  const hpColor = state.hp < 30 ? "bg-red-500" : "bg-green-500";
  const sanColor = state.sanity < 30 ? "bg-purple-500" : "bg-blue-500";
  const caffeineColor = state.caffeine >= CAFFEINE_THRESHOLDS.TOXICITY ? "bg-red-600" : state.caffeine >= CAFFEINE_THRESHOLDS.ZONE ? "bg-orange-500" : "bg-yellow-500";
  const satietyColor = state.satiety >= SATIETY_CONSTANTS.STUFFED ? "bg-yellow-600" : "bg-blue-400";

  return (
    <Layout 
      state={state} 
      onMenuOpen={actions.openMenu} 
      uiScale={ui.uiScale}
      overlays={
        <OverlayLayer 
          state={state}
          ui={ui}
          actions={actions}
          inspectedItem={inspectedItem}
          onCloseInspect={handleCloseInspect}
          onInspect={handleInspect}
          showDeathSequence={showDeathSequence}
          onSequenceComplete={handleSequenceComplete}
          showEndingScreen={showEndingScreen}
          onRestartEnding={handleRestart}
        />
      }
    >
      {/* Layout Guard: Mutually Exclusive Rendering */}
      {isDesktop ? (
        /* --- DESKTOP LAYOUT --- */
        <div className="flex-1 grid grid-cols-12 gap-4 h-full min-h-0 p-4 pt-0">
          <div className="col-span-3 h-full min-h-0 overflow-hidden">
            <StatusDisplay state={state} />
          </div>

          <div className="col-span-9 flex flex-col gap-4 h-full min-h-0">
            <div className="flex-1 min-h-0 relative">
               <div className="absolute inset-0">
                 <LogWindow logs={state.logs} day={state.day} timeSlot={state.timeSlot} />
               </div>
            </div>
            {/* Action Panel Container */}
            <div className="shrink-0 h-[420px]">
              <ActionPanel 
                state={state} 
                actions={actions} 
                onInspect={handleInspect}
                isMobile={false}
              />
            </div>
          </div>
        </div>
      ) : (
        /* --- MOBILE LAYOUT --- */
        <div className="flex flex-col h-full">
          <div className="flex-1 overflow-hidden relative flex flex-col min-h-0">
            {ui.mobileTab === 'terminal' ? (
               <div className="flex flex-col h-full">
                  <div className="flex-1 min-h-0 relative">
                     <div className="absolute inset-0">
                       <LogWindow logs={state.logs} day={state.day} timeSlot={state.timeSlot} />
                     </div>
                  </div>
                  <div className="shrink-0 h-[50%] max-h-[400px] min-h-[300px] border-t-2 border-green-900 bg-black/95 shadow-[0_-5px_20px_rgba(0,0,0,0.5)] z-10 flex flex-col">
                    <div className="fs-xxs bg-green-900/20 text-green-500 px-2 py-1 text-center font-bold border-b border-green-900/50 flex justify-between shrink-0">
                      <span>ACTION_MODULE</span>
                      <span className="opacity-50">v2.1.0</span>
                    </div>
                    <div className="flex-1 min-h-0 overflow-hidden">
                      <ActionPanel 
                        state={state} 
                        actions={actions} 
                        onInspect={handleInspect}
                        isMobile={true}
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

          {/* Bottom Nav */}
          <div className="shrink-0 bg-black border-t border-green-800 p-2 pb-[max(env(safe-area-inset-bottom),0.5rem)] z-30 shadow-[0_-2px_10px_rgba(0,0,0,0.5)]">
            <div className="grid grid-cols-12 gap-2 mb-2 px-1">
               <div className="col-span-7 grid grid-cols-1 gap-1.5">
                 <div className="grid grid-cols-2 gap-2">
                   <MiniBar label="HP" value={state.hp} max={state.maxHp} color={hpColor} warn={state.hp < 30} />
                   <MiniBar label="SAN" value={state.sanity} max={state.maxSanity} color={sanColor} warn={state.sanity < 30} />
                 </div>
                 <div className="grid grid-cols-2 gap-2">
                   <MiniBar label="CFN" icon={<Zap size={8}/>} value={state.caffeine} max={200} color={caffeineColor} warn={state.caffeine >= CAFFEINE_THRESHOLDS.TOXICITY} />
                   <MiniBar label="SAT" icon={<Utensils size={8}/>} value={state.satiety} max={state.maxSatiety} color={satietyColor} warn={state.satiety >= SATIETY_CONSTANTS.STUFFED} />
                 </div>
               </div>
               
               <div className="col-span-5 flex flex-col justify-between border-l border-gray-800 pl-2">
                  <MiniBar label="FUNDS" icon={<Coins size={8}/>} value={state.money} max={50000} color="bg-yellow-500" />
                  <div className="flex justify-end items-end h-full pt-1">
                     <span className="fs-xxs text-gray-600 font-mono">TURN: {state.turnCount}</span>
                  </div>
               </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
               <button
                  onClick={() => actions.setMobileTab('terminal')}
                  className={`p-2.5 rounded-sm fs-xs font-bold border flex items-center justify-center gap-2 transition-all active:scale-95 ${
                     ui.mobileTab === 'terminal' 
                     ? 'bg-green-900/40 border-green-500 text-green-400 shadow-[0_0_10px_rgba(34,197,94,0.2)]' 
                     : 'bg-gray-900/20 border-gray-800 text-gray-500 hover:bg-gray-900'
                  }`}
               >
                  <Terminal size={16} /> TERMINAL
               </button>
               <button
                  onClick={() => actions.setMobileTab('status')}
                  className={`p-2.5 rounded-sm fs-xs font-bold border flex items-center justify-center gap-2 transition-all active:scale-95 ${
                     ui.mobileTab === 'status' 
                     ? 'bg-green-900/40 border-green-500 text-green-400 shadow-[0_0_10px_rgba(34,197,94,0.2)]' 
                     : 'bg-gray-900/20 border-gray-800 text-gray-500 hover:bg-gray-900'
                  }`}
               >
                  <Activity size={16} /> STATUS_MONITOR
               </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default App;