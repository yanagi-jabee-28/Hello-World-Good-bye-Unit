
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
  
  // Striped gradient background
  const bgStyle = {
    width: `${percentage}%`,
    backgroundImage: 'linear-gradient(45deg,rgba(255,255,255,.15) 25%,transparent 25%,transparent 50%,rgba(255,255,255,.15) 50%,rgba(255,255,255,.15) 75%,transparent 75%,transparent)',
    backgroundSize: '1rem 1rem',
  };

  return (
    <div className={`mb-3 group ${effectClass || ''}`}>
      <div className="flex justify-between fs-xxs mb-1 font-bold uppercase tracking-wider text-gray-400 group-hover:text-white transition-colors">
        <span className="flex items-center gap-1.5">
          {/* Indicator Dot */}
          <span className={`w-1.5 h-1.5 rounded-full ${colorClass.split(' ')[0].replace('bg-', 'bg-')} shadow-[0_0_5px_currentColor]`} />
          {label}
        </span>
        <span className="font-mono tabular-nums opacity-80">{subLabel || `${Math.floor(value)}/${max}`}</span>
      </div>
      
      <div className="h-2.5 w-full bg-gray-900/80 border border-gray-700/50 relative overflow-hidden rounded-sm backdrop-blur-sm">
        {/* Background Grid in empty space */}
        <div className="absolute inset-0 opacity-10 bg-[url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAQAAAAECAYAAACp8Z5+AAAAIklEQVQIW2NkQAKrVq36zwjjgzhhYWGMYAEYB8RmROaABADeOQ8CXl/xfgAAAABJRU5ErkJggg==')]" />
        
        {/* Fill Bar */}
        <div 
          className={`h-full ${colorClass} transition-all duration-700 ease-out relative shadow-[0_0_10px_rgba(0,0,0,0.3)] ${animate ? 'animate-[pulse_2s_infinite]' : ''}`}
          style={bgStyle}
        >
          {/* Glowing Tip */}
          <div className="absolute top-0 right-0 w-0.5 h-full bg-white/80 shadow-[0_0_8px_white] z-10" />
          
          {/* Shine Effect */}
          <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent opacity-50" />
        </div>
      </div>
    </div>
  );
};
