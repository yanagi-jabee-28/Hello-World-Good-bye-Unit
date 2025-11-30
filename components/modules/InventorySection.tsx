
import React, { useState, useMemo } from 'react';
import { GameState, ItemId } from '../../types';
import { ITEMS } from '../../data/items';
import { predictItemRisk } from '../../logic/riskSystem';
import { sortItems, SortKey, SORT_LABELS } from '../../utils/itemSorting';
import { getShortEffectString } from '../../utils/logFormatter';
import { Button } from '../ui/Button';
import { ArrowDownWideNarrow, LayoutGrid, List, Info, Zap, Skull } from 'lucide-react';

interface Props {
  state: GameState;
  onUse: (id: ItemId) => void;
  onInspect?: (id: ItemId, mode: 'inventory') => void;
  isMobile: boolean;
}

export const InventorySection: React.FC<Props> = React.memo(({ state, onUse, onInspect, isMobile }) => {
  const { inventory } = state;
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortKey, setSortKey] = useState<SortKey>('DEFAULT');

  const ownedItems = useMemo(() => {
    const ids = Object.entries(inventory)
      .filter(([_, count]) => ((count as number) || 0) > 0)
      .map(([id]) => id as ItemId);
    
    return sortItems(ids, sortKey);
  }, [inventory, sortKey]);

  return (
    <div className="space-y-1.5 flex flex-col h-full">
      {/* Header Controls (Only show if items exist) */}
      {ownedItems.length > 0 && (
        <div className="flex justify-between items-center px-1 pb-1 border-b border-gray-800 mb-1">
           <div className="flex items-center gap-1">
             {viewMode === 'list' && (
                <div className="flex items-center gap-1 bg-gray-900 rounded px-1">
                   <ArrowDownWideNarrow size={12} className="text-gray-500"/>
                   <select 
                      value={sortKey} 
                      onChange={(e) => setSortKey(e.target.value as SortKey)}
                      className="bg-transparent border-none text-gray-400 text-[10px] focus:outline-none py-0.5"
                   >
                      {Object.entries(SORT_LABELS).map(([k, l]) => (
                         <option key={k} value={k}>{l}</option>
                      ))}
                   </select>
                </div>
             )}
           </div>
           
           <div className="flex bg-gray-900 rounded p-0.5 border border-gray-700">
              <button 
                onClick={() => setViewMode('grid')}
                className={`p-1 rounded ${viewMode === 'grid' ? 'bg-gray-700 text-white' : 'text-gray-500 hover:text-gray-300'}`}
                title="簡易表示"
              >
                <LayoutGrid size={12} />
              </button>
              <button 
                onClick={() => setViewMode('list')}
                className={`p-1 rounded ${viewMode === 'list' ? 'bg-gray-700 text-white' : 'text-gray-500 hover:text-gray-300'}`}
                title="詳細表示"
              >
                <List size={12} />
              </button>
           </div>
        </div>
      )}

      {ownedItems.length === 0 ? (
         <div className="fs-xxs text-gray-600 p-4 border border-gray-800 border-dashed text-center rounded h-full flex items-center justify-center bg-black/30">
           NO DATA
         </div>
      ) : (
        <div className={`
           overflow-y-auto custom-scrollbar pr-1 
           ${isMobile 
              ? (viewMode === 'grid' ? 'grid grid-cols-1 gap-1.5' : 'space-y-2 max-h-[400px]') 
              : (viewMode === 'grid' ? 'grid grid-cols-2 gap-1.5 md:flex md:flex-col max-h-[180px]' : 'space-y-2 max-h-[180px]')
           }
        `}>
          {ownedItems.map((itemId) => {
            const item = ITEMS[itemId];
            const isLethal = state.debugFlags.showDeathHints && predictItemRisk(state, itemId);
            const shortEffect = getShortEffectString(item);

            if (viewMode === 'grid') {
              return (
                <Button
                  key={itemId}
                  onClick={() => onUse(itemId)}
                  label={`${item.name}`}
                  subLabel={`x${inventory[itemId]} | ${shortEffect}`}
                  icon={<Zap size={12} />}
                  variant="outline"
                  className="border-gray-700 text-gray-300 hover:border-gray-500 bg-gray-900/50"
                  fullWidth
                  size={isMobile ? "lg" : "sm"}
                  onInspect={onInspect ? () => onInspect(itemId, 'inventory') : undefined}
                  isLethal={isLethal}
                />
              );
            }

            return (
              <div key={itemId} className={`border border-gray-800 bg-gray-900/40 p-2 rounded flex flex-col gap-2 relative group ${isLethal ? 'border-red-900 bg-red-950/20' : 'hover:border-gray-600'}`}>
                 <div className="flex justify-between items-start pr-6">
                    <div>
                       <div className={`font-bold fs-xs ${isLethal ? 'text-red-400' : 'text-gray-200'}`}>
                          {item.name}
                       </div>
                       <div className="text-[10px] text-gray-500 font-mono">
                          所持数: <span className="text-white font-bold">{inventory[itemId]}</span>
                       </div>
                    </div>
                    {onInspect && (
                      <button 
                        onClick={(e) => { e.stopPropagation(); onInspect(itemId, 'inventory'); }}
                        className="absolute top-2 right-2 text-gray-600 hover:text-cyan-400"
                      >
                        <Info size={14} />
                      </button>
                    )}
                 </div>
                 
                 {shortEffect && (
                    <div className="fs-xxs font-mono text-cyan-600/80 border-l-2 border-cyan-900 pl-1.5 truncate">
                       {shortEffect}
                    </div>
                 )}

                 <button
                    onClick={() => onUse(itemId)}
                    className={`w-full py-1 fs-xxs font-bold rounded flex items-center justify-center gap-1 transition-colors ${
                       isLethal 
                         ? 'bg-red-900/30 text-red-500 border border-red-800 hover:bg-red-800/50' 
                         : 'bg-green-900/20 text-green-400 border border-green-800 hover:bg-green-800/40'
                    }`}
                 >
                    {isLethal ? <Skull size={10}/> : <Zap size={10}/>}
                    USE ITEM
                 </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
});
