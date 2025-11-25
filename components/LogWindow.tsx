
import React, { useEffect, useRef, useState } from 'react';
import { LogEntry } from '../types';
import { Volume2, Loader2, Terminal } from 'lucide-react';
import { playLogAudio } from '../utils/tts';
import { Panel } from './ui/Panel';

interface Props {
  logs: LogEntry[];
}

export const LogWindow: React.FC<Props> = ({ logs }) => {
  const bottomRef = useRef<HTMLDivElement>(null);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (bottomRef.current) {
       bottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs.length]);

  const handlePlay = async (log: LogEntry) => {
    if (playingId || isLoading) return;
    
    setPlayingId(log.id);
    setIsLoading(true);
    try {
        await playLogAudio(log.text);
    } catch (e) {
        console.error(e);
    } finally {
        setIsLoading(false);
        setPlayingId(null);
    }
  };

  const getColor = (type: LogEntry['type']) => {
    switch (type) {
      case 'success': return 'text-green-400';
      case 'warning': return 'text-yellow-400';
      case 'danger': return 'text-red-500 font-bold';
      case 'system': return 'text-blue-400';
      default: return 'text-green-600';
    }
  };

  return (
    <Panel 
      title="CONSOLE_OUT" 
      className="h-full" 
      noPadding
      rightAction={
        <span className="text-[10px] opacity-70 flex items-center gap-1">
          <Volume2 size={10} /> TTS: ONLINE
        </span>
      }
    >
      <div className="p-4 pt-2 font-mono text-sm space-y-3">
        {logs.map((log) => (
          <div key={log.id} className="border-l-2 border-green-900/30 pl-3 py-1 animate-[fadeIn_0.3s_ease-out] group relative hover:bg-green-900/10 transition-colors">
            <div className="flex justify-between items-start mb-0.5 opacity-60 group-hover:opacity-100 transition-opacity">
                <div className="text-[10px] text-gray-500 flex items-center gap-2">
                   <span className="text-green-800">[{log.timestamp}]</span>
                </div>
                <button 
                    onClick={() => handlePlay(log)}
                    disabled={isLoading && playingId !== log.id}
                    className={`transition-opacity p-1 rounded hover:bg-green-900/50 
                      ${playingId === log.id ? 'opacity-100 text-green-400' : 'opacity-0 group-hover:opacity-100 text-gray-600'}`}
                    title="読み上げ再生"
                >
                    {playingId === log.id ? <Loader2 size={12} className="animate-spin" /> : <Volume2 size={12} />}
                </button>
            </div>
            <div className={`${getColor(log.type)} leading-relaxed whitespace-pre-wrap pr-6 text-shadow-sm`}>
              <span className="mr-2 opacity-50 select-none">&gt;</span>
              {log.text}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
    </Panel>
  );
};
