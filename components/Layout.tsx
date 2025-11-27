
import React, { ReactNode, useEffect } from 'react';
import { GameState, UiScale } from '../types';
import { Clock, Calendar, Save, Menu, Zap } from 'lucide-react';

interface Props {
  state: GameState;
  children: ReactNode;
  overlays?: ReactNode;
  onMenuOpen?: () => void;
  uiScale?: UiScale;
}

export const Layout: React.FC<Props> = ({ state, children, overlays, onMenuOpen, uiScale = 'normal' }) => {
  // Apply UI Scale by modifying the root font size
  useEffect(() => {
    const root = document.documentElement;
    switch (uiScale) {
      case 'compact':
        root.style.fontSize = '14px';
        break;
      case 'large':
        root.style.fontSize = '18px';
        break;
      default: // normal
        root.style.fontSize = '16px';
        break;
    }
  }, [uiScale]);

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
            <div className="fs-xxs text-green-600 tracking-[0.2em] uppercase">
              Resource Survival Architecture
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-6 shrink-0">
          {/* Date/Time Info */}
          <div className="hidden md:flex items-center gap-6 text-sm font-bold font-mono">
            <div className="flex flex-col items-end leading-none">
              <span className="fs-xxs text-gray-500 uppercase">Timeline</span>
              <div className="flex items-center gap-2 text-green-400">
                DAY {state.day.toString().padStart(2, '0')}
              </div>
            </div>
            <div className="w-px h-8 bg-green-900/50" />
            <div className="flex flex-col items-end leading-none">
              <span className="fs-xxs text-gray-500 uppercase">Clock</span>
              <div className="flex items-center gap-2 text-yellow-400">
                {state.timeSlot}
              </div>
            </div>
          </div>

          {/* Menu Button */}
          <button 
            onClick={onMenuOpen}
            className="group relative px-4 py-2 bg-green-950 border border-green-800 text-green-400 hover:bg-green-900 hover:text-green-300 hover:border-green-500 transition-all duration-200 flex items-center gap-2"
          >
            <Menu size={18} />
            <span className="hidden sm:inline font-bold text-xs tracking-widest">SYSTEM</span>
            
            {/* Corner decorations */}
            <div className="absolute top-0 left-0 w-1 h-1 border-t border-l border-green-500 opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="absolute bottom-0 right-0 w-1 h-1 border-b border-r border-green-500 opacity-0 group-hover:opacity-100 transition-opacity" />
          </button>
        </div>
      </header>

      {/* Main Content Layer */}
      <main className="flex-1 relative overflow-hidden z-10">
        {/* Background Grid Animation */}
        <div className="absolute inset-0 pointer-events-none opacity-20 z-0">
          <div className="w-full h-full bg-[linear-gradient(rgba(0,255,0,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(0,255,0,0.03)_1px,transparent_1px)] bg-[size:40px_40px] [transform-origin:center] animate-[pulse_4s_ease-in-out_infinite]" />
        </div>
        
        {children}
      </main>

      {/* Overlay Layer (Modals, Dialogs) */}
      {/* FIXED: Removed the full-screen blocking wrapper div. 
          Overlays (mostly fixed positioned components) are rendered directly. */}
      {overlays}
      
      {/* Scanline Effect */}
      <div className="absolute inset-0 pointer-events-none bg-scanlines opacity-10 z-40 mix-blend-overlay" />
    </div>
  );
};
