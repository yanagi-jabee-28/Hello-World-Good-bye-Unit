
import React, { ReactNode } from 'react';

interface Props {
  children: ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'outline' | 'info';
  className?: string;
}

export const Badge: React.FC<Props> = ({ children, variant = 'default', className = '' }) => {
  const variants = {
    default: "bg-gray-800 text-gray-300 border-gray-600",
    success: "bg-green-900/30 text-green-400 border-green-700/60 shadow-[0_0_10px_rgba(34,197,94,0.2)]",
    warning: "bg-yellow-900/30 text-yellow-400 border-yellow-700/60 shadow-[0_0_10px_rgba(234,179,8,0.2)]",
    danger: "bg-red-900/30 text-red-400 border-red-700/60 shadow-[0_0_10px_rgba(239,68,68,0.2)]",
    info: "bg-cyan-900/30 text-cyan-400 border-cyan-700/60 shadow-[0_0_10px_rgba(6,182,212,0.2)]",
    outline: "bg-transparent border-gray-600 text-gray-400"
  };

  return (
    <span className={`inline-flex items-center justify-center px-1.5 py-0.5 fs-xxs font-mono font-bold border rounded-sm backdrop-blur-md ${variants[variant]} ${className}`}>
      {children}
    </span>
  );
};
