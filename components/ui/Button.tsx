
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
  const baseStyles = "transition-all duration-200 font-bold flex items-center justify-center gap-2 relative group disabled:opacity-50 disabled:cursor-not-allowed";
  
  const variants = {
    primary: "bg-green-900/20 border border-green-700 text-green-400 hover:bg-green-700 hover:text-black hover:shadow-[0_0_10px_rgba(34,197,94,0.5)]",
    secondary: "bg-blue-900/20 border border-blue-700 text-blue-400 hover:bg-blue-700 hover:text-black hover:shadow-[0_0_10px_rgba(59,130,246,0.5)]",
    danger: "bg-red-900/20 border border-red-700 text-red-400 hover:bg-red-700 hover:text-white hover:shadow-[0_0_10px_rgba(220,38,38,0.5)]",
    ghost: "bg-transparent border border-transparent text-gray-500 hover:text-gray-300 hover:bg-gray-900",
    outline: "bg-transparent border border-gray-700 text-gray-400 hover:border-gray-500 hover:text-gray-200"
  };

  const sizes = {
    sm: "text-[10px] py-1 px-2",
    md: "text-xs py-2 px-3",
    lg: "text-sm py-3 px-4"
  };

  const widthClass = fullWidth ? 'w-full' : '';
  const alignClass = subLabel ? 'items-start text-left' : 'items-center';

  return (
    <button 
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${widthClass} ${alignClass} ${className}`}
      disabled={disabled}
      {...props}
    >
      {icon && <span className="shrink-0">{icon}</span>}
      <div className="flex flex-col overflow-hidden">
        <span className="truncate">{label}</span>
        {subLabel && <span className="text-[9px] font-normal opacity-70 truncate">{subLabel}</span>}
      </div>
    </button>
  );
};
