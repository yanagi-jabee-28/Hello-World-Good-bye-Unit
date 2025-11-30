
import React from 'react';

interface Props { 
  value: number; 
  max: number; 
  color: string; 
  label: string; 
  icon?: React.ReactNode;
  warn?: boolean;
}

export const MiniBar: React.FC<Props> = ({ 
  value, 
  max, 
  color, 
  label, 
  icon,
  warn = false 
}) => (
  <div className="flex flex-col gap-0.5 min-w-0">
    <div className={`flex justify-between items-center fs-xxs leading-none font-mono ${warn ? 'text-red-400 animate-pulse' : 'text-gray-400'}`}>
       <span className="flex items-center gap-1 scale-90 origin-left">{icon}{label}</span>
       <span className="tracking-tighter">{max > 20000 ? (value/1000).toFixed(1)+'k' : value}</span>
    </div>
    <div className="h-1 bg-gray-800 w-full border border-gray-700/50 rounded-full overflow-hidden">
       <div className={`h-full ${color} transition-all duration-500`} style={{ width: `${Math.min(100, (value/max)*100)}%` }} />
    </div>
  </div>
);
