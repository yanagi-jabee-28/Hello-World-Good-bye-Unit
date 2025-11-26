
import React, { ReactNode } from 'react';

interface Props extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  icon?: ReactNode;
  label: ReactNode;
  subLabel?: string;
  fullWidth?: boolean;
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
  ...props 
}) => {
  // Using clip-path for the sci-fi "cut corner" look
  const clipPath = "polygon(10px 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%, 0 10px)";
  
  const baseStyles = "relative font-bold flex items-center justify-center gap-2 transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed disabled:grayscale group overflow-hidden";
  
  const variants = {
    primary: "bg-green-950 border border-green-600 text-green-400 hover:bg-green-900 hover:text-green-200 hover:border-green-400 hover:shadow-[0_0_15px_rgba(34,197,94,0.4)]",
    secondary: "bg-blue-950 border border-blue-600 text-blue-400 hover:bg-blue-900 hover:text-blue-200 hover:border-blue-400 hover:shadow-[0_0_15px_rgba(59,130,246,0.4)]",
    danger: "bg-red-950 border border-red-600 text-red-400 hover:bg-red-900 hover:text-red-200 hover:border-red-400 hover:shadow-[0_0_15px_rgba(220,38,38,0.4)]",
    ghost: "bg-transparent border border-transparent text-gray-500 hover:text-gray-300 hover:bg-gray-900",
    outline: "bg-transparent border border-gray-700 text-gray-400 hover:border-gray-500 hover:text-gray-200 hover:bg-gray-900"
  };

  const sizes = {
    sm: "text-[10px] py-1 px-2 min-h-[32px]",
    md: "text-xs py-2 px-3 min-h-[42px]",
    lg: "text-sm py-3 px-4 min-h-[52px]"
  };

  const widthClass = fullWidth ? 'w-full' : '';
  const alignClass = subLabel ? 'items-start text-left' : 'items-center';

  return (
    <button 
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${widthClass} ${alignClass} ${className}`}
      disabled={disabled}
      style={variant !== 'ghost' ? { clipPath } : {}}
      {...props}
    >
      {/* Hover Glitch Effect Bar */}
      <div className="absolute top-0 left-0 w-1 h-full bg-current opacity-0 group-hover:opacity-100 transition-opacity duration-200" />

      {icon && <span className={`shrink-0 z-10 ${subLabel ? 'mt-0.5' : ''}`}>{icon}</span>}
      
      <div className="flex flex-col overflow-hidden z-10">
        <span className="truncate leading-tight">{label}</span>
        {subLabel && <span className="text-[9px] font-normal opacity-60 truncate font-mono mt-0.5">{subLabel}</span>}
      </div>

      {/* Background Scanline for texture */}
      <div className="absolute inset-0 bg-scanlines opacity-10 pointer-events-none" />
    </button>
  );
};
