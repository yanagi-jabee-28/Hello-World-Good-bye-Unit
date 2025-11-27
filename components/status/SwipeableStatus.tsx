
import React, { useState } from 'react';
import { GameState } from '../../types';
import { ChevronLeft, ChevronRight, Activity, BookOpen, Package } from 'lucide-react';
import { BioMonitor } from './BioMonitor';
import { AcademicMonitor } from './AcademicMonitor';
import { InventoryList } from './InventoryList';

interface Props {
  state: GameState;
}

export const SwipeableStatus: React.FC<Props> = ({ state }) => {
  const [currentPage, setCurrentPage] = useState(0);

  const pages = [
    {
      title: 'VITAL_MONITOR',
      icon: <Activity size={16}/>,
      content: <BioMonitor state={state} />
    },
    {
      title: 'ACADEMIC_STATUS',
      icon: <BookOpen size={16}/>,
      content: <AcademicMonitor state={state} />
    },
    {
      title: 'INVENTORY_DATA',
      icon: <Package size={16}/>,
      content: <InventoryList state={state} />
    }
  ];

  return (
    <div className="flex flex-col h-full bg-black/50">
      {/* Header / Nav */}
      <div className="flex items-center justify-between p-2 bg-gray-900/50 border-b border-gray-800">
        <button
          onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
          disabled={currentPage === 0}
          className="p-2 text-green-500 disabled:text-gray-700 disabled:opacity-30 hover:bg-gray-800 rounded transition-colors"
        >
          <ChevronLeft size={24} />
        </button>
        
        <div className="flex flex-col items-center">
          <div className="text-green-400 font-bold text-sm flex items-center gap-2">
            {pages[currentPage].icon}
            {pages[currentPage].title}
          </div>
          <div className="flex gap-1.5 mt-1.5">
            {pages.map((_, i) => (
              <div 
                key={i} 
                className={`w-1.5 h-1.5 rounded-full transition-all ${i === currentPage ? 'bg-green-500 w-3' : 'bg-gray-700'}`} 
              />
            ))}
          </div>
        </div>

        <button
          onClick={() => setCurrentPage(Math.min(pages.length - 1, currentPage + 1))}
          disabled={currentPage === pages.length - 1}
          className="p-2 text-green-500 disabled:text-gray-700 disabled:opacity-30 hover:bg-gray-800 rounded transition-colors"
        >
          <ChevronRight size={24} />
        </button>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
        <div className="animate-[fadeIn_0.3s_ease-out]">
          {pages[currentPage].content}
        </div>
      </div>
    </div>
  );
};
