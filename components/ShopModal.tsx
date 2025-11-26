
import React from 'react';
import { ItemId } from '../types';
import { ITEMS } from '../data/items';
import { getItemEffectDescription } from '../utils/logFormatter';
import { ShoppingCart, X, DollarSign } from 'lucide-react';
import { Sound } from '../utils/sound';

interface Props {
  money: number;
  onClose: () => void;
  onBuy: (itemId: ItemId) => void;
}

export const ShopModal: React.FC<Props> = ({ money, onClose, onBuy }) => {
  // Sellable items (exclude USB which is special)
  const shopItems = Object.values(ITEMS).filter(item => item.price > 0 && item.price < 90000);

  const handleClose = () => {
    Sound.play('button_click');
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm animate-[fadeIn_0.2s_ease-out] p-4">
      <div className="max-w-2xl w-full border-2 border-cyan-800 bg-black shadow-[0_0_30px_rgba(6,182,212,0.3)] flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex-none flex justify-between items-center bg-cyan-900/20 border-b border-cyan-800 p-4">
          <h2 className="text-xl font-bold text-cyan-400 flex items-center gap-2">
            <ShoppingCart /> CO-OP_NET (生協オンライン)
          </h2>
          <button onClick={handleClose} className="text-cyan-600 hover:text-cyan-300">
            <X size={24} />
          </button>
        </div>

        {/* Balance */}
        <div className="flex-none p-4 bg-gray-900 border-b border-cyan-900 flex justify-end items-center">
           <span className="text-gray-400 text-xs mr-2">CURRENT BALANCE:</span>
           <span className="text-xl font-mono font-bold text-yellow-400">¥{money.toLocaleString()}</span>
        </div>

        {/* Item Grid */}
        <div className="flex-1 overflow-y-auto min-h-0 p-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
          {shopItems.map((item) => {
            const canAfford = money >= item.price;
            return (
              <div key={item.id} className={`border border-gray-800 p-3 flex flex-col justify-between transition-all ${canAfford ? 'hover:border-cyan-700 hover:bg-cyan-900/10' : 'opacity-50 grayscale'}`}>
                <div>
                  <div className="flex justify-between items-start mb-1">
                    <h3 className="font-bold text-cyan-300 text-sm">{item.name}</h3>
                    <span className="font-mono text-yellow-500 text-sm">¥{item.price}</span>
                  </div>
                  <p className="text-[10px] text-gray-400 mb-2 min-h-[2.5em]">{item.description}</p>
                  <div className="text-[10px] text-cyan-700 border-l-2 border-cyan-800 pl-2 mb-3">
                    {getItemEffectDescription(item)}
                  </div>
                </div>
                <button
                  onClick={() => onBuy(item.id)}
                  disabled={!canAfford}
                  className={`w-full py-1.5 text-xs font-bold flex items-center justify-center gap-2 ${
                    canAfford 
                      ? 'bg-cyan-900 text-cyan-100 hover:bg-cyan-700' 
                      : 'bg-gray-800 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  {canAfford ? (
                     <>PURCHASE <DollarSign size={12}/></>
                  ) : (
                     <>INSUFFICIENT FUNDS</>
                  )}
                </button>
              </div>
            );
          })}
        </div>
        
        <div className="flex-none p-2 text-center text-[10px] text-gray-600 border-t border-cyan-900">
          SECURE CONNECTION ESTABLISHED | NO REFUNDS
        </div>
      </div>
    </div>
  );
};
