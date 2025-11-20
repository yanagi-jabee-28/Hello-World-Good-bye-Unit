
import React, { useState } from 'react';
import { Layout } from './components/Layout';
import { StatusDisplay } from './components/StatusDisplay';
import { LogWindow } from './components/LogWindow';
import { ActionPanel } from './components/ActionPanel';
import { EndingScreen } from './components/EndingScreen';
import { ShopModal } from './components/ShopModal';
import { useGameEngine } from './hooks/useGameEngine';
import { ActionType, GameAction, ItemId } from './types';

const App: React.FC = () => {
  const { state, dispatch } = useGameEngine();
  const [isShopOpen, setIsShopOpen] = useState(false);

  // Overload implementation to match ActionPanel expectations
  const handleAction = (type: ActionType, payload?: any) => {
    // We can safely cast here because the components enforce the payload types
    // via the interface logic before calling this.
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
      {/* Main Grid Layout */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-4 h-full min-h-0">
        
        {/* Left Column: Status (3 cols) */}
        <div className="lg:col-span-3 lg:h-full h-48 min-h-0 overflow-y-auto shrink-0 scrollbar-hide">
          <StatusDisplay state={state} />
        </div>

        {/* Right Column: Logs & Actions (9 cols) */}
        <div className="lg:col-span-9 flex flex-col gap-4 h-full min-h-0">
          
          {/* Log Window (Takes remaining height, constrained scroll) */}
          <div className="flex-1 min-h-0 relative">
             <div className="absolute inset-0">
               <LogWindow logs={state.logs} />
             </div>
          </div>

          {/* Action Panel (Fixed height at bottom) */}
          <div className="shrink-0">
            <ActionPanel 
              state={state} 
              onAction={handleAction} 
              onShopOpen={() => setIsShopOpen(true)}
            />
          </div>
        
        </div>
      </div>
    </Layout>
  );
};

export default App;
