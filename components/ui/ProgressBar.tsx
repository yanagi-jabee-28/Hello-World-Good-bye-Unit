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
  
  return (
    <div className={`mb-3 ${effectClass || ''}`}>
      <div className="flex justify-between text-xs mb-1 font-bold">
        <span>{label}</span>
        <span>{subLabel || `${value}/${max}`}</span>
      </div>
      <div className="h-3 w-full bg-gray-900 border border-gray-800 relative overflow-hidden">
        <div 
          className={`h-full ${colorClass} transition-all duration-500`} 
          style={{ width: `${percentage}%` }}
        />
        <div className="absolute top-0 left-0 w-full h-full bg-[linear-gradient(90deg,transparent_0%,rgba(0,0,0,0.5)_50%,transparent_100%)] opacity-20" />
      </div>
    </div>
  );
};