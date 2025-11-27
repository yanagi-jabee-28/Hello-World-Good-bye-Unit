
import React from 'react';

interface Props {
  value: number;
  max: number;
  colorClass: string;
  label: string;
  subLabel?: string;
  effectClass?: string;
  animate?: boolean;
}

export const ProgressBar: React.FC<Props> = ({ value, max, colorClass, label, subLabel, effectClass, animate = false }) => {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100));
  
  return (
    <div className={`mb-3 group ${effectClass || ''}`}>
      <div className="flex justify-between fs-xxs mb-1 font-bold uppercase tracking-wider text-gray-400 group-hover:text-white transition-colors">
        <span className="flex items-center gap-1.5">
          {/* Indicator Dot */}
          <span className={`w-1.5 h-1.5 rounded-full bg-current opacity-80 shadow-[0_0_5px_currentColor]`} />
          {label}
        </span>
        <span className="font-mono tabular-nums opacity-80">{subLabel || `${Math.floor(value)}/${max}`}</span>
      </div>
      
      <div className="h-2.5 w-full bg-gray-900/80 border border-gray-700/50 relative overflow-hidden rounded-sm backdrop-blur-sm">
        {/* Background Grid in empty space */}
        <div className="absolute inset-0 opacity-10 bg-[url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAQAAAAECAYAAACp8Z5+AAAAIklEQVQIW2NkQAKrVq36zwjjgzhhYWGMYAEYB8RmROaABADeOQ8CXl/xfgAAAABJRU5ErkJggg==')]" />
        
        {/* Bar Wrapper */}
        <div 
          className="h-full relative transition-all duration-700 ease-out"
          style={{ width: `${percentage}%` }}
        >
            {/* 1. Base Color Layer */}
            <div className={`absolute inset-0 ${colorClass} ${animate ? 'animate-pulse' : ''}`} />

            {/* 2. Striped Pattern Overlay */}
            <div 
              className="absolute inset-0 opacity-30 mix-blend-overlay"
              style={{
                backgroundImage: 'linear-gradient(45deg,rgba(0,0,0,.4) 25%,transparent 25%,transparent 50%,rgba(0,0,0,.4) 50%,rgba(0,0,0,.4) 75%,transparent 75%,transparent)',
                backgroundSize: '6px 6px'
              }}
            />
            
            {/* 3. Gloss/Shine Effect */}
            <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent opacity-40 pointer-events-none" />
            
            {/* 4. Glowing Tip */}
            <div className="absolute top-0 right-0 w-[2px] h-full bg-white shadow-[0_0_10px_white] z-10 opacity-90" />
        </div>
      </div>
    </div>
  );
};
