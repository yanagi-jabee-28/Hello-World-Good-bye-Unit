
import React, { useEffect, useRef, useState } from 'react';
import { LogEntry } from '../types';
import { Volume2, Loader2 } from 'lucide-react';
import { playLogAudio } from '../utils/tts';
import { Panel } from './ui/Panel';

interface Props {
  logs: LogEntry[];
}

export const LogWindow: React.FC<Props> = ({ logs }) => {
  const bottomRef = useRef<HTMLDivElement>(null);
  const [playingId, setPlayingId] = useState<string | null>(null);

  useEffect(() => {
    if (bottomRef.current) {
       bottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs.length]);

  const handlePlay = async (log: LogEntry) => {
    // If clicking the same log that is currently playing, do nothing (or could implement stop)
    if (playingId === log.id) return;
    
    // Set new playing ID immediately (switching logs)
    setPlayingId(log.id);
    
    try {
        await playLogAudio(log.text);
    } catch (e) {
        console.error(e);
    } finally {
        // Only clear playing state if this specific log finished naturally
        // If playingId has changed (interrupted by another click), don't clear it
        setPlayingId(prev => prev === log.id ? null : prev);
    }
  };

  const getColor = (type: LogEntry['type']) => {
    switch (type) {
      case 'success': return 'text-green-400 border-l-2 border-green-500';
      case 'warning': return 'text-yellow-400 border-l-2 border-yellow-500';
      case 'danger': return 'text-red-500 border-l-2 border-red-600 bg-red-900/10';
      case 'system': return 'text-cyan-400 border-l-2 border-cyan-500 italic';
      default: return 'text-gray-300 border-l-2 border-gray-700';
    }
  };

  return (
    <Panel 
      title="CONSOLE_OUTPUT" 
      className="h-full" 
      noPadding
      rightAction={
        <span className="fs-xxs opacity-50 flex items-center gap-1 font-mono animate-pulse">
          <span className="w-2 h-2 bg-green-500 rounded-full"/> LIVE_FEED
        </span>
      }
    >
      <div className="p-4 pt-2 font-mono fs-sm space-y-1">
        {logs.map((log, index) => {
          const isLast = index === logs.length - 1;
          return (
            <div 
              key={log.id} 
              className={`pl-3 py-2 animate-[slideInLeft_0.2s_ease-out] group relative transition-colors hover:bg-white/5 ${getColor(log.type)} ${isLast ? 'bg-green-900/10' : ''}`}
            >
              <div className="flex justify-between items-start mb-1 opacity-50 group-hover:opacity-100 transition-opacity">
                  <div className="fs-xxs font-mono tracking-wider text-gray-500">
                     [{log.timestamp}]
                  </div>
                  <button 
                      onClick={() => handlePlay(log)}
                      className={`transition-opacity p-1 rounded hover:bg-green-500/20 
                        ${playingId === log.id ? 'opacity-100 text-green-400' : 'opacity-0 group-hover:opacity-100 text-gray-500'}`}
                      title="TTS Playback"
                  >
                      {playingId === log.id ? <Loader2 size={12} className="animate-spin" /> : <Volume2 size={12} />}
                  </button>
              </div>
              <div className="leading-relaxed whitespace-pre-wrap pr-4 relative">
                {log.text}
                {isLast && <span className="inline-block w-2 h-4 bg-green-500 ml-2 animate-ping align-middle" />}
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>
    </Panel>
  );
};
