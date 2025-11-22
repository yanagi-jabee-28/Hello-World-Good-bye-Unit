
import React, { ReactNode } from 'react';
import { GameState } from '../types';
import { Clock, Calendar, Save, Menu } from 'lucide-react';

interface Props {
  state: GameState;
  children: ReactNode;
  overlays?: ReactNode;
  onMenuOpen?: () => void; // New
}

export const Layout: React.FC<Props> = ({ state, children, overlays, onMenuOpen }) => {
  return (
    <div className="flex flex-col h-screen w-screen bg-black text-green-500 font-mono overflow-hidden selection:bg-green-900 selection:text-white">
      {/* Header */}
      <header className="flex-none h-12 border-b-2 border-green-800 flex items-center justify-between px-4 bg-gray-900 z-20 relative shadow-[0_0_20px_rgba(34,197,94,0.2)]">
        <h1 className="font-bold text-lg tracking-wider flex items-center gap-2 text-shadow-glow overflow-hidden whitespace-nowrap">
          <span className="w-3 h-3 bg-green-500 inline-block animate-pulse shadow-[0_0_10px_rgba(34,197,94,0.8)] shrink-0"></span>
          <span className="truncate">RSA_ADVENTURE</span>
          <span className="text-xs text-green-700 ml-2 hidden sm:inline">v1.1.0</span>
        </h1>
        
        <div className="flex items-center gap-4 shrink-0 ml-2">
          {/* Date/Time Info */}
          <div className="hidden md:flex items-center gap-3 md:gap-6 text-sm">
            <div className="flex items-center gap-1.5 text-green-400">
              <Calendar size={14} />
              <span className="font-bold">DAY {state.day}</span>
            </div>
            <div className="flex items-center gap-1.5 text-yellow-400 w-20 justify-end">
              <Clock size={14} />
              <span className="font-bold">{state.timeSlot}</span>
            </div>
          </div>

          {/* Menu Button */}
          <button 
            onClick={onMenuOpen}
            className="flex items-center gap-2 bg-green-900/50 border border-green-700 px-3 py-1 hover:bg-green-700 transition-colors text-xs font-bold text-green-300 hover:text-black"
          >
            <Menu size={14} />
            MENU
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 min-h-0 relative flex flex-col overflow-hidden">
        {children}
      </main>

      {/* Footer */}
      <footer className="flex-none h-8 border-t border-green-900 bg-black flex items-center justify-between px-4 text-[10px] text-gray-500 z-20 relative">
        <div className="flex items-center gap-4">
           <div className="flex items-center gap-1.5 text-green-700" title="State is automatically saved to LocalStorage">
             <Save size={10} />
             <span>AUTO_SAVE: ACTIVE</span>
           </div>
        </div>
        
        {/* Mobile Date/Time (Shown in footer on small screens) */}
        <div className="md:hidden flex items-center gap-3">
           <span>DAY {state.day}</span>
           <span className="text-yellow-600">{state.timeSlot}</span>
        </div>
      </footer>

      {/* Overlays (Modals, etc) */}
      {overlays}
    </div>
  );
};
