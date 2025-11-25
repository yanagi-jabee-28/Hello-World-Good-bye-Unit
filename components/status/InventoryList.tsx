import React from 'react';
import { GameState, ItemId } from '../../types';
import { ITEMS } from '../../data/items';
import { Package } from 'lucide-react';

interface Props {
  state: GameState;
}

export const InventoryList: React.FC<Props> = ({ state }) => {
  const ownedItems = Object.entries(state.inventory)
    .filter(([_, count]) => ((count as number) || 0) > 0)
    .map(([id, count]) => ({ id: id as ItemId, count: count as number }));

  return (
    <div className="mt-6">
        <h3 className="text-sm font-bold text-green-700 mb-2 border-b border-green-900 pb-1 flex items-center gap-2">
          <Package size={14} /> INVENTORY (所持品)
        </h3>
        {ownedItems.length === 0 ? (
          <div className="text-xs text-gray-600 italic">アイテムを持っていません</div>
        ) : (
          <div className="space-y-2">
            {ownedItems.map((item) => (
              <div key={item.id} className="flex justify-between items-center text-xs border border-gray-800 p-1.5">
                <span className="text-green-400">{ITEMS[item.id].name}</span>
                <span className="text-gray-400">x{item.count}</span>
              </div>
            ))}
          </div>
        )}
    </div>
  );
};