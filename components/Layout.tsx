
import React, { ReactNode } from 'react';
import { GameState, TimeSlot } from '../types';
import { Clock, Calendar } from 'lucide-react';

interface Props {
  children: ReactNode;
  overlays?: ReactNode;
  state: GameState;
}

export const Layout: React.FC<Props> = ({ children, overlays, state }) => {
  const isLateNight = state.timeSlot === TimeSlot.LATE_NIGHT;

  return (
    // h-screen で高さを固定し、内部スクロールさせることでスマホアプリのような操作感にする
    // p-0 md:p-4 に変更し、スマホでは画面端まで有効活用する
    <div className={`h-screen flex flex-col bg-black text-green-500 p-0 md:p-4 transition-colors duration-1000 overflow-hidden ${isLateNight ? 'shadow-[inset_0_0_100px_rgba(50,0,0,0.2)]' : ''}`}>
      {/* Header */}
      <header className="shrink-0 flex justify-between items-center border-b-2 border-green-800 bg-gray-950/80 p-3 md:p-4 backdrop-blur-sm z-20">
        <h1 className="text-base md:text-2xl font-bold tracking-tighter flex items-center gap-2">
          <span className="bg-green-700 text-black px-1.5 py-0.5 text-xs md:text-base">SYS.ROOT</span>
          <span className="truncate max-w-[150px] md:max-w-none">HELLO_WORLD</span>
        </h1>
        
        <div className="flex gap-3 text-xs md:text-base font-mono shrink-0">
          <div className="flex items-center gap-1 md:gap-2">
            <Calendar size={14} className="md:w-5 md:h-5" />
            <span className={state.day > 5 ? 'text-red-500 animate-pulse' : ''}>{state.day}日</span>
          </div>
          <div className="flex items-center gap-1 md:gap-2 w-16 md:w-32 justify-end">
            <Clock size={14} className="md:w-5 md:h-5" />
            <span className={isLateNight ? 'text-purple-400' : ''}>{state.timeSlot}</span>
          </div>
        </div>
      </header>

      {/* Main Content - overflow-hidden で親スクロールを抑制 */}
      <main className="flex-1 flex flex-col overflow-hidden relative z-10 bg-black/50">
        {children}
      </main>

      {/* Footer - PCのみ表示、スマホはボトムバーがあるので非表示 */}
      <footer className="hidden md:block shrink-0 mt-4 text-[10px] text-center text-gray-600 border-t border-gray-900 pt-2">
        MEMORY_USAGE: 256MB | THREADS: 4 | NO_SLEEP_DETECTED
      </footer>

      {/* Overlays (Modals) */}
      {overlays}
    </div>
  );
};
