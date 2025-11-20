
import React, { ReactNode } from 'react';
import { GameState, TimeSlot } from '../types';
import { Clock, Calendar } from 'lucide-react';

interface Props {
  children: ReactNode;
  state: GameState;
}

export const Layout: React.FC<Props> = ({ children, state }) => {
  const isLateNight = state.timeSlot === TimeSlot.LATE_NIGHT;

  return (
    <div className={`min-h-screen flex flex-col bg-black text-green-500 p-2 md:p-4 transition-colors duration-1000 ${isLateNight ? 'shadow-[inset_0_0_100px_rgba(50,0,0,0.2)]' : ''}`}>
      {/* Header */}
      <header className="flex justify-between items-center border-b-2 border-green-800 pb-4 mb-4 bg-gray-950/50 p-4 sticky top-0 z-20 backdrop-blur-sm">
        <h1 className="text-xl md:text-2xl font-bold tracking-tighter flex items-center gap-2">
          <span className="bg-green-700 text-black px-2 py-0.5">SYS.ROOT</span>
          <span>HELLO_WORLD_GOOD_BYE_UNIT</span>
        </h1>
        
        <div className="flex gap-4 text-sm md:text-base font-mono">
          <div className="flex items-center gap-2">
            <Calendar size={18} />
            <span className={state.day > 5 ? 'text-red-500 animate-pulse' : ''}>{state.day}日目 / 7</span>
          </div>
          <div className="flex items-center gap-2 w-32">
            <Clock size={18} />
            <span className={isLateNight ? 'text-purple-400' : ''}>{state.timeSlot}</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden relative z-10">
        {children}
      </main>

      {/* Footer */}
      <footer className="mt-4 text-[10px] text-center text-gray-600 border-t border-gray-900 pt-2">
        MEMORY_USAGE: 256MB | THREADS: 4 | NO_SLEEP_DETECTED
      </footer>
    </div>
  );
};
