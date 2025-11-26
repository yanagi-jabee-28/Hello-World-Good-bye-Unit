
import React, { useEffect, useState } from 'react';
import { Sound } from '../utils/sound';
import { Activity, Skull, AlertOctagon } from 'lucide-react';

interface Props {
  type: 'hp' | 'sanity';
  cause: string;
  onComplete: () => void;
}

export const DeathSequence: React.FC<Props> = ({ type, cause, onComplete }) => {
  const [stage, setStage] = useState(0);
  const [log, setLog] = useState<string[]>([]);

  // HP Death: Short & Critical
  const hpLogs = [
    "ALERT: VITAL SIGNS CRITICAL",
    "EMERGENCY PROTOCOL... FAILED",
    "SYSTEM SHUTDOWN IMMINENT"
  ];

  // SAN Death: Short & Cryptic
  const sanLogs = [
    "FATAL ERROR: LOGIC COLLAPSE",
    "REALITY INTEGRITY: 0%",
    "NULL POINTER EXCEPTION"
  ];

  useEffect(() => {
    let timeoutIds: number[] = [];

    if (type === 'hp') {
      // HP Sequence
      // 0s: Alert start
      timeoutIds.push(window.setTimeout(() => {
        setStage(1);
        Sound.play('alert');
      }, 100));

      // Logs (Faster)
      hpLogs.forEach((msg, i) => {
        timeoutIds.push(window.setTimeout(() => {
          setLog(prev => [...prev, msg]);
          Sound.play('heartbeat');
        }, 500 + (i * 800)));
      });

      // 3.5s: Flatline start (Screen goes dark red)
      timeoutIds.push(window.setTimeout(() => {
        setStage(2); 
        Sound.play('flatline');
      }, 3500));

      // 5s: CRT Off
      timeoutIds.push(window.setTimeout(() => {
        setStage(3); 
      }, 5000));

      // 6s: Complete
      timeoutIds.push(window.setTimeout(onComplete, 6000));

    } else {
      // Sanity Sequence
      // 0s: Glitch start
      timeoutIds.push(window.setTimeout(() => {
        setStage(1);
        Sound.play('glitch_noise');
      }, 100));

      // Logs (Rapid)
      sanLogs.forEach((msg, i) => {
        timeoutIds.push(window.setTimeout(() => {
          setLog(prev => [...prev, msg]);
          Sound.play('glitch_noise');
        }, 400 + (i * 600)));
      });

      // 3s: Visual Corruption
      timeoutIds.push(window.setTimeout(() => {
        setStage(2); 
        Sound.play('game_over');
      }, 3000));

      // 4.5s: CRT Off
      timeoutIds.push(window.setTimeout(() => {
        setStage(3);
      }, 4500));

      // 5.5s: Complete
      timeoutIds.push(window.setTimeout(onComplete, 5500));
    }

    return () => {
      timeoutIds.forEach(clearTimeout);
    };
  }, [type, onComplete]);

  // --- RENDER ---

  if (stage === 3) {
    // CRT OFF Animation
    return (
      <div className="fixed inset-0 z-[150] bg-black flex items-center justify-center">
        <div className="w-full h-full bg-white animate-crt-off pointer-events-none" />
      </div>
    );
  }

  // Common Background (Transparent at first to show logs, then opaque)
  const bgClass = stage < 2 
    ? "bg-black/40 backdrop-blur-[2px]" // Stage 0-1: 透けて見える
    : type === 'hp' 
      ? "bg-red-950/90" // Stage 2+: HP Death Opaque
      : "bg-black/95";  // Stage 2+: SAN Death Opaque

  // Popup Position: Top biased to reveal bottom logs
  const containerClass = "fixed inset-0 z-[150] flex flex-col items-center justify-start pt-16 md:pt-32 px-4 transition-colors duration-1000";

  if (type === 'hp') {
    return (
      <div className={`${containerClass} ${bgClass} font-mono text-red-500 overflow-hidden`}>
        {/* Red Vignette Pulse (Always visible but stronger later) */}
        <div className={`absolute inset-0 border-[20px] border-red-600 opacity-50 animate-pulse pointer-events-none ${stage < 2 ? 'border-opacity-30' : ''}`} />
        
        {/* Fatal Popup */}
        <div className={`z-10 w-full max-w-lg bg-black border-2 border-red-600 shadow-[0_0_50px_rgba(220,38,38,0.5)] p-6 relative animate-[slideDown_0.5s_ease-out] ${stage >= 2 ? 'opacity-50 blur-sm transition-all duration-1000' : ''}`}>
          
          <div className="absolute top-0 left-0 bg-red-600 text-black text-xs font-bold px-2 py-1">
            CRITICAL ALERT
          </div>

          <div className="flex items-center gap-4 mb-4 mt-2">
             <Activity size={48} className="animate-pulse" />
             <div>
               <h1 className="text-2xl font-bold tracking-widest text-red-500">BIOLOGICAL FAILURE</h1>
               <p className="text-xs text-red-300">VITAL SIGNS UNSTABLE</p>
             </div>
          </div>

          {/* CAUSE DISPLAY */}
          <div className="mb-4 border-l-4 border-red-800 pl-3 py-1 bg-red-900/10">
             <div className="text-[10px] text-red-400 uppercase mb-1">CAUSE OF FAILURE:</div>
             <div className="text-sm font-bold text-white">{cause}</div>
          </div>
          
          <div className="min-h-[80px] w-full text-left bg-black/80 p-2 border border-red-900/50 rounded overflow-hidden">
            {log.map((l, i) => (
              <div key={i} className="text-[10px] animate-[slideInLeft_0.1s]">{`> ${l}`}</div>
            ))}
          </div>
        </div>

        {/* CRT Scanline Overlay */}
        <div className="absolute inset-0 bg-scanlines pointer-events-none opacity-30" />
      </div>
    );
  }

  // SANITY Render
  return (
    <div className={`${containerClass} ${bgClass} font-mono text-purple-500 overflow-hidden`}>
      {/* Chaotic Background Pattern */}
      {stage >= 2 && (
        <div className="absolute inset-0 bg-[url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAQAAAAECAYAAACp8Z5+AAAAIklEQVQIW2NkQAKrVq36zwjjgzhhYWGMYAEYB8RmROaABADeOQ8CXl/xfgAAAABJRU5ErkJggg==')] opacity-20 invert" />
      )}
      
      {/* Fatal Popup */}
      <div className={`z-10 w-full max-w-lg bg-black border-2 border-purple-600 shadow-[0_0_50px_rgba(147,51,234,0.5)] p-6 relative animate-[slideDown_0.5s_ease-out] ${stage >= 1 ? 'animate-rgb-shift' : ''} ${stage >= 2 ? 'animate-shake blur-sm' : ''}`}>
        
        <div className="absolute top-0 right-0 bg-purple-600 text-black text-xs font-bold px-2 py-1 animate-pulse">
          FATAL EXCEPTION
        </div>

        <div className="flex items-center gap-4 mb-4 mt-2">
           <div className="relative">
             <AlertOctagon size={48} className="text-purple-500" />
             <Skull size={24} className="absolute top-3 left-3 text-black animate-pulse" />
           </div>
           <div>
             <h1 className="text-2xl font-bold tracking-widest glitch-text" data-text="MENTAL BREAKDOWN">MENTAL BREAKDOWN</h1>
             <p className="text-xs text-purple-300">LOGIC INTEGRITY: 0%</p>
           </div>
        </div>

        {/* CAUSE DISPLAY */}
        <div className="mb-4 border-l-4 border-purple-800 pl-3 py-1 bg-purple-900/10">
            <div className="text-[10px] text-purple-400 uppercase mb-1">EXCEPTION THROWN AT:</div>
            <div className="text-sm font-bold text-white leading-tight">{cause}</div>
        </div>
        
        <div className="min-h-[80px] w-full text-left bg-black/80 p-2 border border-purple-900/50 rounded overflow-hidden relative">
          {log.map((l, i) => (
            <div key={i} className={`text-[10px] font-bold ${i % 2 === 0 ? 'text-green-500 text-right' : 'text-purple-500 text-left'}`}>
              {Math.random() > 0.5 ? l : l.split('').reverse().join('')}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
