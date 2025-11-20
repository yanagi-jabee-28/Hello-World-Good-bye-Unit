
import React, { useEffect, useRef, useState } from 'react';
import { LogEntry } from '../types';
import { Volume2, Loader2 } from 'lucide-react';
import { playLogAudio } from '../utils/tts';

interface Props {
  logs: LogEntry[];
}

export const LogWindow: React.FC<Props> = ({ logs }) => {
  const bottomRef = useRef<HTMLDivElement>(null);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Auto scroll to new logs if log count changes
    if (bottomRef.current) {
       bottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs.length]); // Trigger when log count changes

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
      default: return 'text-green-600'; // Darker green for normal info
    }
  };

  return (
    <div className="flex flex-col h-full border-2 border-green-800 bg-black shadow-[0_0_15px_rgba(34,197,94,0.1)] relative overflow-hidden">
      <div className="absolute top-0 left-0 right-0 bg-green-900 text-black text-xs px-2 py-1 font-bold z-10 flex justify-between items-center">
        <span>CONSOLE_OUT (実行ログ)</span>
        <span className="text-[10px] opacity-70 flex items-center gap-1">
          <Volume2 size={10} /> TTS_MODULE: ONLINE
        </span>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 pt-8 font-mono text-sm space-y-3">
        {/* Standard terminal order: Oldest at top, Newest at bottom */}
        {logs.map((log) => (
          <div key={log.id} className="border-l-2 border-green-900 pl-2 animate-[fadeIn_0.3s_ease-out] group relative hover:bg-green-900/10 transition-colors">
            <div className="flex justify-between items-start mb-0.5">
                <div className="text-xs text-gray-600">[{log.timestamp}]</div>
                <button 
                    onClick={() => handlePlay(log)}
                    disabled={isLoading && playingId !== log.id}
                    className={`transition-opacity p-1 rounded hover:bg-green-900/50 
                      ${playingId === log.id ? 'opacity-100 text-green-400' : 'opacity-0 group-hover:opacity-100 text-gray-600'}`}
                    title="読み上げ再生"
                >
                    {playingId === log.id ? <Loader2 size={14} className="animate-spin" /> : <Volume2 size={14} />}
                </button>
            </div>
            <div className={`${getColor(log.type)} leading-relaxed whitespace-pre-wrap pr-6`}>
              {`> ${log.text}`}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
    </div>
  );
};
