
import React from 'react';

interface Props {
  value: number;
  max: number;
  colorClass: string;
  label: string;
  subLabel?: string;
  effectClass?: string;
}

export const ProgressBar: React.FC<Props> = ({ value, max, colorClass, label, subLabel, effectClass }) => {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100));
  
  // Create a striped gradient background for the bar
  const bgStyle = {
    width: `${percentage}%`,
    backgroundImage: 'linear-gradient(45deg,rgba(255,255,255,.15) 25%,transparent 25%,transparent 50%,rgba(255,255,255,.15) 50%,rgba(255,255,255,.15) 75%,transparent 75%,transparent)',
    backgroundSize: '1rem 1rem',
  };

  return (
    <div className={`mb-3 group ${effectClass || ''}`}>
      <div className="flex justify-between fs-xxs mb-1 font-bold uppercase tracking-wider text-gray-400 group-hover:text-white transition-colors">
        <span className="flex items-center gap-1">
          <span className="w-1 h-2 bg-current inline-block opacity-50" />
          {label}
        </span>
        <span className="font-mono">{subLabel || `${Math.floor(value)}/${max}`}</span>
      </div>
      
      <div className="h-3 w-full bg-gray-900 border border-gray-800 relative overflow-hidden skew-x-[-10deg]">
        {/* Background Grid in empty space */}
        <div className="absolute inset-0 opacity-20 bg-[url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAQAAAAECAYAAACp8Z5+AAAAIklEQVQIW2NkQAKrVq36zwjjgzhhYWGMYAEYB8RmROaABADeOQ8CXl/xfgAAAABJRU5ErkJggg==')]" />
        
        {/* Fill Bar */}
        <div 
          className={`h-full ${colorClass} transition-all duration-500 relative`} 
          style={bgStyle}
        >
          {/* Glowing tip */}
          <div className="absolute top-0 right-0 w-px h-full bg-white/50 shadow-[0_0_10px_white]" />
        </div>
      </div>
    </div>
  );
};