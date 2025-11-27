
import React, { ReactNode } from 'react';

interface Props {
  children: ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'outline';
  className?: string;
}

export const Badge: React.FC<Props> = ({ children, variant = 'default', className = '' }) => {
  const variants = {
    default: "bg-gray-800 text-gray-300 border-gray-600",
    success: "bg-green-900/50 text-green-300 border-green-700",
    warning: "bg-yellow-900/50 text-yellow-300 border-yellow-700",
    danger: "bg-red-900/50 text-red-300 border-red-700",
    outline: "bg-transparent border-gray-600 text-gray-400"
  };

  return (
    <span className={`inline-flex items-center justify-center px-1.5 py-0.5 fs-xxs font-mono font-bold border rounded ${variants[variant]} ${className}`}>
      {children}
    </span>
  );
};