
import React, { ReactNode } from 'react';
import { Info } from 'lucide-react';

interface Props extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  icon?: ReactNode;
  label: ReactNode;
  subLabel?: string;
  fullWidth?: boolean;
  onInspect?: (e: React.MouseEvent) => void;
}

export const Button: React.FC<Props> = ({ 
  variant = 'primary', 
  size = 'md', 
  icon, 
  label, 
  subLabel, 
  fullWidth = false,
  className = '',
  disabled,
  onInspect,
  ...props 
}) => {
  // Sci-fi corner cut using clip-path
  const clipPath = "polygon(10px 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%, 0 10px)";
  
  const baseStyles = `
    relative font-bold flex items-center justify-center gap-2 
    transition-all duration-200 
    disabled:opacity-40 disabled:cursor-not-allowed disabled:grayscale 
    group overflow-hidden transform hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98]
  `;
  
  const variants = {
    primary: `
      bg-green-900/30 border border-green-600/50 text-green-400 
      hover:bg-green-800/50 hover:border-green-400 hover:text-green-100 
      hover:shadow-[0_0_15px_rgba(34,197,94,0.3)]
      backdrop-blur-sm
    `,
    secondary: `
      bg-blue-900/30 border border-blue-600/50 text-blue-400 
      hover:bg-blue-800/50 hover:border-blue-400 hover:text-blue-100 
      hover:shadow-[0_0_15px_rgba(59,130,246,0.3)]
      backdrop-blur-sm
    `,
    danger: `
      bg-red-900/30 border border-red-600/50 text-red-400 
      hover:bg-red-800/50 hover:border-red-400 hover:text-red-100 
      hover:shadow-[0_0_15px_rgba(239,68,68,0.3)]
      backdrop-blur-sm
    `,
    outline: `
      bg-transparent border border-gray-700 text-gray-400 
      hover:border-gray-500 hover:text-gray-100 hover:bg-gray-800/50
    `,
    ghost: `
      bg-transparent border border-transparent text-gray-500 
      hover:text-gray-300 hover:bg-gray-900/30
    `,
  };

  const sizes = {
    sm: "fs-xxs py-1.5 px-2 min-h-[34px]",
    md: "fs-xs py-2.5 px-3 min-h-[44px]",
    lg: "fs-sm py-3.5 px-4 min-h-[56px]"
  };

  const widthClass = fullWidth ? 'w-full' : '';
  const alignClass = subLabel ? 'items-start text-left' : 'items-center';
  const inspectPadding = onInspect ? 'pr-8' : '';

  return (
    <button 
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${widthClass} ${alignClass} ${inspectPadding} ${className}`}
      disabled={disabled}
      style={variant !== 'ghost' ? { clipPath } : {}}
      {...props}
    >
      {/* Animated Glitch Bar */}
      <div className="absolute top-0 left-0 w-1 h-full bg-current opacity-0 group-hover:opacity-100 transition-opacity duration-200 shadow-[0_0_10px_currentColor]" />

      {icon && <span className={`shrink-0 z-10 ${subLabel ? 'mt-0.5' : ''} group-hover:scale-110 transition-transform duration-200`}>{icon}</span>}
      
      <div className="flex flex-col overflow-hidden z-10 w-full">
        <span className="truncate leading-tight w-full group-hover:text-shadow-glow transition-all">{label}</span>
        {subLabel && (
          <span className="fs-xxs font-normal opacity-60 truncate font-mono mt-0.5 w-full group-hover:opacity-90 transition-opacity">
            {subLabel}
          </span>
        )}
      </div>

      {/* Background Texture */}
      <div className="absolute inset-0 bg-scanlines opacity-10 pointer-events-none" />
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent opacity-0 group-hover:opacity-100 transform -skew-x-12 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 ease-in-out pointer-events-none" />

      {/* Inspect Button */}
      {onInspect && (
        <div 
          onClick={(e) => {
            e.stopPropagation();
            onInspect(e);
          }}
          className="absolute right-0 top-0 bottom-0 w-8 flex items-center justify-center bg-black/20 hover:bg-white/20 border-l border-white/10 z-20 transition-colors cursor-pointer"
          title="詳細を確認"
        >
          <Info size={14} className="opacity-50 group-hover:opacity-100 transition-opacity" />
        </div>
      )}
    </button>
  );
};
