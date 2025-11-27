
import React from 'react';
import { ItemId } from '../types';
import { ITEMS } from '../data/items';
import { getShortEffectString } from '../utils/logFormatter';
import { ShoppingCart, X, DollarSign, Info } from 'lucide-react';
import { Sound } from '../utils/sound';

interface Props {
  money: number;
  onClose: () => void;
  onBuy: (itemId: ItemId) => void;
  onInspect?: (itemId: ItemId, mode: 'inventory' | 'shop') => void;
}

export const ShopModal: React.FC<Props> = ({ money, onClose, onBuy, onInspect }) => {
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
           <span className="text-gray-400 fs-xs mr-2">CURRENT BALANCE:</span>
           <span className="text-xl font-mono font-bold text-yellow-400">¥{money.toLocaleString()}</span>
        </div>

        {/* Item Grid */}
        <div className="flex-1 overflow-y-auto min-h-0 p-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
          {shopItems.map((item) => {
            const canAfford = money >= item.price;
            const effectText = getShortEffectString(item);

            return (
              <div key={item.id} className={`border border-gray-800 p-3 flex flex-col justify-between transition-all relative group ${canAfford ? 'hover:border-cyan-700 hover:bg-cyan-900/10' : 'opacity-50 grayscale'}`}>
                
                {/* Inspect Button (Top Right) */}
                {onInspect && (
                  <button 
                    onClick={() => onInspect(item.id, 'shop')}
                    className="absolute top-2 right-2 text-gray-500 hover:text-cyan-300 p-1 rounded hover:bg-gray-800 transition-colors z-10"
                    title="詳細を確認"
                  >
                    <Info size={16} />
                  </button>
                )}

                <div>
                  <div className="flex justify-between items-start mb-1 pr-6">
                    <h3 className="font-bold text-cyan-300 fs-sm">{item.name}</h3>
                  </div>
                  <div className="font-mono text-yellow-500 fs-xs mb-2">¥{item.price}</div>
                  
                  {/* 簡易説明と効果 */}
                  <p className="fs-xxs text-gray-400 mb-2 line-clamp-2">{item.description}</p>
                  
                  {/* Effect Preview */}
                  {effectText && (
                    <div className="fs-xxs text-cyan-600 border-l-2 border-cyan-900 pl-2 mb-3 font-mono truncate">
                      {effectText}
                    </div>
                  )}
                </div>

                <button
                  onClick={() => onBuy(item.id)}
                  disabled={!canAfford}
                  className={`w-full py-1.5 fs-xs font-bold flex items-center justify-center gap-2 mt-auto ${
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
        
        <div className="flex-none p-2 text-center fs-xxs text-gray-600 border-t border-cyan-900">
          SECURE CONNECTION ESTABLISHED | NO REFUNDS
        </div>
      </div>
    </div>
  );
};
