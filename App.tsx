
import React from 'react';
import { Layout } from './components/Layout';
import { StatusDisplay } from './components/StatusDisplay';
import { LogWindow } from './components/LogWindow';
import { ActionPanel } from './components/ActionPanel';
import { EndingScreen } from './components/EndingScreen';
import { useGameEngine } from './hooks/useGameEngine';
import { ActionType, GameAction } from './types';

const App: React.FC = () => {
  const { state, dispatch } = useGameEngine();

  // Overload implementation to match ActionPanel expectations
  const handleAction = (type: ActionType, payload?: any) => {
    // We can safely cast here because the components enforce the payload types
    // via the interface logic before calling this.
    dispatch({ type, payload } as GameAction);
  };

  return (
    <Layout state={state}>
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
            <ActionPanel state={state} onAction={handleAction} />
          </div>
        
        </div>
      </div>

      {/* Overlays */}
      <EndingScreen state={state} onRestart={() => handleAction(ActionType.RESTART)} />
    </Layout>
  );
};

export default App;
