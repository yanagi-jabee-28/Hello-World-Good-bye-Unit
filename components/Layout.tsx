import React, { ReactNode } from 'react';
import { GameState } from '../types';
import { Clock, Calendar, Save, Menu, Zap } from 'lucide-react';

interface Props {
  state: GameState;
  children: ReactNode;
  overlays?: ReactNode;
  onMenuOpen?: () => void;
}

export const Layout: React.FC<Props> = ({ state, children, overlays, onMenuOpen }) => {
  return (
    <div className="relative flex flex-col h-screen w-screen bg-black text-green-500 font-mono overflow-hidden selection:bg-green-500 selection:text-black">
      
      {/* Header */}
      <header className="flex-none h-14 border-b border-green-900/60 bg-black/90 z-20 relative flex items-center justify-between px-4 shadow-[0_0_10px_rgba(34,197,94,0.1)]">
        
        {/* Logo Area */}
        <div className="flex items-center gap-3">
          <div className="relative w-8 h-8 flex items-center justify-center border border-green-700 bg-green-900/20">
            <Zap size={18} className="text-green-400" />
            <div className="absolute -top-1 -left-1 w-2 h-2 border-t border-l border-green-500" />
            <div className="absolute -bottom-1 -right-1 w-2 h-2 border-b border-r border-green-500" />
          </div>
          <div>
            <h1 className="font-bold text-lg tracking-widest text-shadow-glow text-white leading-none">
              RSA_ADVENTURE
            </h1>
            <div className="text-[9px] text-green-600 tracking-[0.2em] uppercase">
              Resource Survival Architecture
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-6 shrink-0">
          {/* Date/Time Info */}
          <div className="hidden md:flex items-center gap-6 text-sm font-bold font-mono">
            <div className="flex flex-col items-end leading-none">
              <span className="text-[9px] text-gray-500 uppercase">Timeline</span>
              <div className="flex items-center gap-2 text-green-400">
                DAY {state.day.toString().padStart(2, '0')}
              </div>
            </div>
            <div className="w-px h-8 bg-green-900/50" />
            <div className="flex flex-col items-end leading-none">
              <span className="text-[9px] text-gray-500 uppercase">Clock</span>
              <div className="flex items-center gap-2 text-yellow-400">
                {state.timeSlot}
              </div>
            </div>
          </div>

          {/* Menu Button */}
          <button 
            onClick={onMenuOpen}
            className="group relative px-4 py-2 bg-green-950 border border-green-800 hover:bg-green-900 transition-all overflow-hidden"
          >
            <div className="absolute top-0 left-0 w-1 h-full bg-green-500 opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="flex items-center gap-2 text-xs font-bold text-green-300 group-hover:text-green-100 tracking-widest">
              <Menu size={14} />
              MENU
            </div>
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 min-h-0 relative flex flex-col overflow-hidden p-1 z-10">
        {children}
      </main>

      {/* Footer */}
      <footer className="flex-none h-6 border-t border-green-900/60 bg-black flex items-center justify-between px-4 text-[10px] text-gray-600 z-20 relative font-mono uppercase tracking-wider">
        <div className="flex items-center gap-4">
           <div className="flex items-center gap-1.5 text-green-800">
             <div className="w-1.5 h-1.5 bg-green-800 rounded-full animate-ping" />
             <span>SYSTEM_ONLINE</span>
           </div>
           <div className="hidden md:flex items-center gap-1.5" title="Auto Save Active">
             <Save size={10} />
             <span>AUTO_SAVE: ACTIVE</span>
           </div>
        </div>
        
        {/* Mobile Date/Time (Shown in footer on small screens) */}
        <div className="md:hidden flex items-center gap-3 text-green-500">
           <span className="font-bold">DAY {state.day}</span>
           <span className="text-yellow-500">[{state.timeSlot}]</span>
        </div>
      </footer>

      {/* Overlays (Modals, etc) */}
      {overlays}
    </div>
  );
};