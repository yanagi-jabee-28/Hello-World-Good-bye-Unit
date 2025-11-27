
import React, { ReactNode } from 'react';

interface Props {
  children: ReactNode;
  title?: ReactNode;
  className?: string;
  variant?: 'default' | 'danger' | 'warning' | 'system';
  rightAction?: ReactNode;
  noPadding?: boolean;
}

export const Panel: React.FC<Props> = ({ 
  children, 
  title, 
  className = "", 
  variant = 'default', 
  rightAction,
  noPadding = false
}) => {
  const styles = {
    default: {
      border: 'border-green-800/60',
      bg: 'bg-black/80',
      text: 'text-green-400',
      decoration: 'bg-green-500',
      shadow: 'shadow-[0_0_20px_rgba(34,197,94,0.05)]'
    },
    danger: {
      border: 'border-red-800/60',
      bg: 'bg-black/80',
      text: 'text-red-400',
      decoration: 'bg-red-500',
      shadow: 'shadow-[0_0_20px_rgba(220,38,38,0.1)]'
    },
    warning: {
      border: 'border-yellow-800/60',
      bg: 'bg-black/80',
      text: 'text-yellow-400',
      decoration: 'bg-yellow-500',
      shadow: 'shadow-[0_0_20px_rgba(234,179,8,0.1)]'
    },
    system: {
      border: 'border-gray-700/60',
      bg: 'bg-gray-900/90',
      text: 'text-gray-300',
      decoration: 'bg-gray-500',
      shadow: 'shadow-none'
    }
  };

  const style = styles[variant];

  return (
    <div className={`relative flex flex-col overflow-hidden transition-all duration-300 backdrop-blur-sm border ${style.border} ${style.bg} ${style.shadow} ${className}`}>
      
      {/* Tech Decorations (Corner Brackets) */}
      <div className={`absolute top-0 left-0 w-2 h-2 border-t-2 border-l-2 ${style.border} opacity-80 pointer-events-none`} />
      <div className={`absolute top-0 right-0 w-2 h-2 border-t-2 border-r-2 ${style.border} opacity-80 pointer-events-none`} />
      <div className={`absolute bottom-0 left-0 w-2 h-2 border-b-2 border-l-2 ${style.border} opacity-80 pointer-events-none`} />
      <div className={`absolute bottom-0 right-0 w-2 h-2 border-b-2 border-r-2 ${style.border} opacity-80 pointer-events-none`} />

      {title && (
        <div className={`flex-none px-3 py-2 fs-xs font-bold flex justify-between items-center border-b ${style.border} bg-scanlines relative`}>
          {/* Header Decoration */}
          <div className="absolute left-0 top-0 bottom-0 w-1 opacity-50 bg-current" />
          
          <div className={`flex items-center gap-2 uppercase tracking-widest ${style.text} text-shadow-glow`}>
            <div className={`w-1.5 h-1.5 ${style.decoration} animate-pulse shadow-[0_0_5px_currentColor]`} />
            {title}
          </div>
          {rightAction && <div className="z-10">{rightAction}</div>}
        </div>
      )}
      
      <div className={`flex-1 min-h-0 overflow-y-auto custom-scrollbar bg-tech-grid ${noPadding ? '' : 'p-4'}`}>
        {children}
      </div>
    </div>
  );
};