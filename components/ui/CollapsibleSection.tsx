
import React, { useState, ReactNode } from 'react';
import { ChevronDown } from 'lucide-react';

interface Props {
  title: string;
  children: ReactNode;
  defaultOpen?: boolean;
}

export const CollapsibleSection: React.FC<Props> = ({ 
  title, 
  children, 
  defaultOpen = false 
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="border border-gray-800 bg-black/40 mb-2 rounded-sm overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-3 text-left hover:bg-gray-900/50 transition-colors active:bg-gray-800 min-h-[44px]"
      >
        <span className="text-sm font-bold text-green-400 tracking-wider flex items-center gap-2">
          {isOpen ? '▼' : '▶'} {title}
        </span>
        <ChevronDown 
          size={18} 
          className={`transition-transform duration-200 text-gray-500 ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>
      
      {isOpen && (
        <div className="p-2 pt-0 animate-[slideDown_0.2s_ease-out] border-t border-gray-800/50">
          {children}
        </div>
      )}
    </div>
  );
};
