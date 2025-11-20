
import React, { useEffect, useRef } from 'react';
import { LogEntry } from '../types';

interface Props {
  logs: LogEntry[];
}

export const LogWindow: React.FC<Props> = ({ logs }) => {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Auto scroll to new logs if log count changes
    if (bottomRef.current) {
       bottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs[0]?.id]); // Trigger when the newest log changes

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
      <div className="absolute top-0 left-0 bg-green-900 text-black text-xs px-2 py-1 font-bold z-10">
        CONSOLE_OUT (実行ログ)
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 pt-8 font-mono text-sm space-y-3">
        {/* Reverse mapping to show new logs at bottom, but we store them new->old for safety */}
        {[...logs].reverse().map((log) => (
          <div key={log.id} className="border-l-2 border-green-900 pl-2 animate-[fadeIn_0.3s_ease-out]">
            <div className="text-xs text-gray-600 mb-0.5">[{log.timestamp}]</div>
            <div className={`${getColor(log.type)} leading-relaxed whitespace-pre-wrap`}>
              {`> ${log.text}`}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
    </div>
  );
};
