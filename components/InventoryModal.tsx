
import React, { useState, useMemo, useEffect } from 'react';
import { ItemId, GameState } from '../types';
import { ITEMS } from '../data/items';
import { getShortEffectString } from '../utils/logFormatter';
import { sortItems, SortKey, SORT_LABELS } from '../utils/itemSorting';
import { Package, X, Zap, Info, ArrowDownWideNarrow, Skull, LayoutGrid, List } from 'lucide-react';
import { predictItemRisk } from '../logic/riskSystem';
import { Sound } from '../utils/sound';

interface Props {
  state: GameState;
  onClose: () => void;
  onUse: (itemId: ItemId) => void;
  onInspect?: (itemId: ItemId, mode: 'inventory' | 'shop') => void;
}

export const InventoryModal: React.FC<Props> = ({ state, onClose, onUse, onInspect }) => {
  const [sortKey, setSortKey] = useState<SortKey>('DEFAULT');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Owned items
  const inventoryItems = useMemo(() => {
    const ids = Object.entries(state.inventory)
      .filter(([_, count]) => ((count as number) || 0) > 0)
      .map(([id]) => id as ItemId);
    
    return sortItems(ids, sortKey).map(id => ITEMS[id]);
  }, [state.inventory, sortKey]);

  const handleClose = () => {
    Sound.play('button_click');
    onClose();
  }

  // Handle ESC key
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') handleClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm animate-[fadeIn_0.2s_ease-out] p-4">
      <div className="max-w-3xl w-full border-2 border-green-800 bg-black shadow-[0_0_30px_rgba(34,197,94,0.3)] flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex-none flex justify-between items-center bg-green-900/20 border-b border-green-800 p-4">
          <h2 className="text-xl font-bold text-green-400 flex items-center gap-2">
            <Package /> STORAGE_UNIT (所持品)
          </h2>
          <button onClick={handleClose} className="text-green-600 hover:text-green-300">
            <X size={24} />
          </button>
        </div>

        {/* Controls */}
        <div className="flex-none p-3 bg-gray-900 border-b border-green-900 flex flex-wrap justify-between items-center gap-3">
           
           <div className="flex items-center gap-3">
             {/* View Toggle */}
             <div className="flex bg-black border border-green-800 rounded p-0.5">
                <button 
                  onClick={() => setViewMode('grid')}
                  className={`p-1.5 rounded ${viewMode === 'grid' ? 'bg-green-800 text-white' : 'text-green-600 hover:text-green-400'}`}
                  title="Grid View"
                >
                  <LayoutGrid size={16} />
                </button>
                <button 
                  onClick={() => setViewMode('list')}
                  className={`p-1.5 rounded ${viewMode === 'list' ? 'bg-green-800 text-white' : 'text-green-600 hover:text-green-400'}`}
                  title="List View"
                >
                  <List size={16} />
                </button>
             </div>

             {/* Sorting Control */}
             <div className="flex items-center gap-2">
               <ArrowDownWideNarrow size={16} className="text-green-600" />
               <select 
                 value={sortKey}
                 onChange={(e) => setSortKey(e.target.value as SortKey)}
                 className="bg-black border border-green-800 text-green-400 fs-xs py-1.5 px-2 rounded focus:outline-none focus:border-green-500"
               >
                 {Object.entries(SORT_LABELS).map(([key, label]) => (
                   <option key={key} value={key}>{label}</option>
                 ))}
               </select>
             </div>
           </div>

           <div className="flex items-center">
             <span className="text-gray-400 fs-xs mr-2">TOTAL ITEMS:</span>
             <span className="text-xl font-mono font-bold text-white">{inventoryItems.length}</span>
           </div>
        </div>

        {/* Item Grid/List */}
        <div className="flex-1 overflow-y-auto min-h-0 p-4 custom-scrollbar">
          {inventoryItems.length === 0 ? (
             <div className="h-full flex items-center justify-center text-gray-500 font-mono text-sm">
                NO ITEMS IN STORAGE
             </div>
          ) : (
            <div className={viewMode === 'grid' ? "grid grid-cols-1 sm:grid-cols-2 gap-4" : "space-y-3"}>
              {inventoryItems.map((item) => {
                const count = state.inventory[item.id] || 0;
                const effectText = getShortEffectString(item);
                const isLethal = state.debugFlags.showDeathHints && predictItemRisk(state, item.id);

                return (
                  <div key={item.id} className={`border border-gray-800 bg-gray-900/40 p-3 flex ${viewMode === 'list' ? 'flex-row items-center gap-4' : 'flex-col justify-between'} transition-all relative group hover:border-green-700 hover:bg-green-900/10 ${isLethal ? 'border-red-900 bg-red-950/20' : ''}`}>
                    
                    {/* Inspect Button */}
                    {onInspect && (
                      <button 
                        onClick={() => onInspect(item.id, 'inventory')}
                        className={`absolute top-2 right-2 text-gray-500 hover:text-green-300 p-1 rounded hover:bg-gray-800 transition-colors z-10 ${viewMode === 'list' ? 'relative top-0 right-0 order-last' : ''}`}
                        title="詳細を確認"
                      >
                        <Info size={16} />
                      </button>
                    )}

                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start mb-1 pr-6">
                        <h3 className={`font-bold fs-sm truncate ${isLethal ? 'text-red-400' : 'text-green-300'}`}>{item.name}</h3>
                      </div>
                      
                      {viewMode === 'grid' && (
                        <div className="font-mono text-white fs-xs mb-2">
                          x{count}
                        </div>
                      )}
                      
                      {/* Description / Effect */}
                      {viewMode === 'grid' ? (
                        <>
                          <p className="fs-xxs text-gray-400 mb-2 line-clamp-2 min-h-[2.5em]">{item.description}</p>
                          {effectText && (
                            <div className="fs-xxs text-green-600 border-l-2 border-green-900 pl-2 mb-3 font-mono truncate">
                              {effectText}
                            </div>
                          )}
                        </>
                      ) : (
                        <div className="flex items-center gap-4 fs-xxs">
                           <span className="font-mono text-white font-bold bg-green-900/30 px-2 py-0.5 rounded border border-green-800">x{count}</span>
                           <span className="text-gray-400 truncate flex-1">{item.description}</span>
                           {effectText && <span className="text-green-600 font-mono hidden sm:inline">{effectText}</span>}
                        </div>
                      )}
                    </div>

                    <button
                      onClick={() => onUse(item.id)}
                      className={`
                        fs-xs font-bold flex items-center justify-center gap-2 transition-colors
                        ${viewMode === 'grid' ? 'w-full py-2 mt-auto' : 'px-4 py-2 shrink-0'}
                        ${isLethal
                          ? 'bg-red-900/30 text-red-500 border border-red-800 hover:bg-red-800/50'
                          : 'bg-green-900/20 text-green-400 border border-green-800 hover:bg-green-800/40'
                        }
                      `}
                    >
                      {isLethal ? <Skull size={14}/> : <Zap size={14}/>}
                      {viewMode === 'grid' ? 'USE ITEM' : 'USE'}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
        
        <div className="flex-none p-2 text-center fs-xxs text-gray-600 border-t border-green-900">
          AUTHORIZED PERSONNEL ONLY | ASSET MANAGEMENT
        </div>
      </div>
    </div>
  );
};
