
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
      headerBg: 'bg-green-950/30',
      text: 'text-green-400',
      decoration: 'bg-green-500',
      shadow: 'shadow-[0_0_30px_-5px_rgba(34,197,94,0.15)]',
      corner: 'border-green-500'
    },
    danger: {
      border: 'border-red-800/60',
      bg: 'bg-black/80',
      headerBg: 'bg-red-950/30',
      text: 'text-red-400',
      decoration: 'bg-red-500',
      shadow: 'shadow-[0_0_30px_-5px_rgba(239,68,68,0.15)]',
      corner: 'border-red-500'
    },
    warning: {
      border: 'border-yellow-800/60',
      bg: 'bg-black/80',
      headerBg: 'bg-yellow-950/30',
      text: 'text-yellow-400',
      decoration: 'bg-yellow-500',
      shadow: 'shadow-[0_0_30px_-5px_rgba(234,179,8,0.15)]',
      corner: 'border-yellow-500'
    },
    system: {
      border: 'border-gray-700/60',
      bg: 'bg-gray-900/90',
      headerBg: 'bg-gray-800/50',
      text: 'text-gray-300',
      decoration: 'bg-gray-500',
      shadow: 'shadow-none',
      corner: 'border-gray-500'
    }
  };

  const style = styles[variant];

  return (
    <div className={`relative flex flex-col overflow-hidden transition-all duration-300 backdrop-blur-md border ${style.border} ${style.bg} ${style.shadow} ${className}`}>
      
      {/* Tech Decorations (Corner Brackets) */}
      <div className={`absolute top-0 left-0 w-2 h-2 border-t-2 border-l-2 ${style.corner} opacity-80 pointer-events-none`} />
      <div className={`absolute top-0 right-0 w-2 h-2 border-t-2 border-r-2 ${style.corner} opacity-80 pointer-events-none`} />
      <div className={`absolute bottom-0 left-0 w-2 h-2 border-b-2 border-l-2 ${style.corner} opacity-80 pointer-events-none`} />
      <div className={`absolute bottom-0 right-0 w-2 h-2 border-b-2 border-r-2 ${style.corner} opacity-80 pointer-events-none`} />

      {title && (
        <div className={`flex-none px-3 py-2 fs-xs font-bold flex justify-between items-center border-b ${style.border} ${style.headerBg} relative`}>
          {/* Animated Header Stripe */}
          <div className={`absolute left-0 top-0 bottom-0 w-1 ${style.decoration} shadow-[0_0_8px_currentColor]`} />
          
          <div className={`flex items-center gap-2 uppercase tracking-widest ${style.text} text-shadow-glow pl-2`}>
            {title}
          </div>
          {rightAction && <div className="z-10 flex items-center">{rightAction}</div>}
          
          {/* Scanline overlay on header only */}
          <div className="absolute inset-0 bg-scanlines opacity-20 pointer-events-none" />
        </div>
      )}
      
      <div className={`flex-1 min-h-0 overflow-y-auto custom-scrollbar relative ${noPadding ? '' : 'p-4'}`}>
        {/* Subtle grid background inside content area */}
        <div className="absolute inset-0 bg-tech-pattern pointer-events-none" />
        <div className="relative z-10 h-full">
          {children}
        </div>
      </div>
    </div>
  );
};
