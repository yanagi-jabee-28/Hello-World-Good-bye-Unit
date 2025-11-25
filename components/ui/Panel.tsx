
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
      border: 'border-green-800',
      shadow: 'shadow-[0_0_15px_rgba(34,197,94,0.1)]',
      header: 'bg-green-900/20 text-green-400 border-green-900'
    },
    danger: {
      border: 'border-red-800',
      shadow: 'shadow-[0_0_15px_rgba(220,38,38,0.15)]',
      header: 'bg-red-900/20 text-red-400 border-red-900'
    },
    warning: {
      border: 'border-yellow-800',
      shadow: 'shadow-[0_0_15px_rgba(234,179,8,0.15)]',
      header: 'bg-yellow-900/20 text-yellow-400 border-yellow-900'
    },
    system: {
      border: 'border-gray-700',
      shadow: 'shadow-[0_0_15px_rgba(255,255,255,0.05)]',
      header: 'bg-gray-800 text-gray-300 border-gray-700'
    }
  };

  const style = styles[variant];

  return (
    <div className={`border-2 bg-black flex flex-col overflow-hidden transition-all duration-300 ${style.border} ${style.shadow} ${className}`}>
      {title && (
        <div className={`flex-none px-3 py-2 text-xs font-bold flex justify-between items-center border-b ${style.header}`}>
          <div className="flex items-center gap-2 uppercase tracking-wider">
            {variant === 'default' && <div className="w-2 h-2 bg-green-500 animate-pulse" />}
            {variant === 'danger' && <div className="w-2 h-2 bg-red-500 animate-ping" />}
            {title}
          </div>
          {rightAction && <div>{rightAction}</div>}
        </div>
      )}
      <div className={`flex-1 min-h-0 overflow-y-auto custom-scrollbar ${noPadding ? '' : 'p-4'}`}>
        {children}
      </div>
    </div>
  );
};
