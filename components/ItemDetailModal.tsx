
import React, { useEffect } from 'react';
import { Item, ItemId } from '../types';
import { getItemEffectDescription } from '../utils/logFormatter';
import { X, ShoppingCart, Zap, Info } from 'lucide-react';
import { Panel } from './ui/Panel';
import { Sound } from '../utils/sound';

interface Props {
  item: Item;
  onClose: () => void;
  onBuy?: (id: ItemId) => void;
  onUse?: (id: ItemId) => void;
  canBuy?: boolean;
  canUse?: boolean;
  mode: 'shop' | 'inventory';
}

export const ItemDetailModal: React.FC<Props> = ({ 
  item, 
  onClose, 
  onBuy, 
  onUse, 
  canBuy = false, 
  canUse = false,
  mode
}) => {
  const handleClose = () => {
    Sound.play('button_click');
    onClose();
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') handleClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const effectDesc = getItemEffectDescription(item);

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-[fadeIn_0.2s]">
      <div className="absolute inset-0" onClick={handleClose} />
      
      <div className="relative w-full max-w-md pointer-events-auto">
        <Panel title={`ITEM_DATA: ${item.name}`} variant="system" className="border-2 border-green-500 shadow-[0_0_30px_rgba(34,197,94,0.2)]">
          <div className="space-y-6 p-2">
            
            {/* Header Info */}
            <div className="flex justify-between items-start border-b border-gray-700 pb-4">
              <div>
                <h3 className="text-xl font-bold text-white mb-1">{item.name}</h3>
                <p className="fs-xs text-gray-400 font-mono uppercase tracking-widest">ID: {item.id}</p>
              </div>
              <div className="text-right">
                <div className="text-xl font-mono font-bold text-yellow-400">¥{item.price.toLocaleString()}</div>
                <div className="fs-xxs text-gray-500">UNIT PRICE</div>
              </div>
            </div>

            {/* Description */}
            <div className="bg-gray-900/50 p-3 rounded border border-gray-800">
              <p className="fs-sm text-gray-300 leading-relaxed">
                {item.description}
              </p>
            </div>

            {/* Effects Analysis */}
            <div className="space-y-2">
              <div className="fs-xs font-bold text-green-500 flex items-center gap-2">
                <Zap size={14} /> EFFECT_ANALYSIS
              </div>
              <div className="bg-green-900/10 border border-green-900 p-3 rounded space-y-2">
                {effectDesc ? (
                  <div className="fs-sm font-mono text-green-300">
                    {effectDesc}
                  </div>
                ) : (
                  <div className="fs-xs text-gray-500 italic">効果なし / フレーバーアイテム</div>
                )}
                
                {item.effects?.buffs && item.effects.buffs.length > 0 && (
                  <div className="mt-3 pt-2 border-t border-green-900/50">
                    <div className="fs-xxs text-green-600 mb-1">ACTIVE_BUFFS:</div>
                    <ul className="space-y-1">
                      {item.effects.buffs.map((buff, i) => (
                        <li key={i} className="fs-xs text-yellow-400 flex items-center gap-2">
                          <span className="w-1 h-1 bg-yellow-500 rounded-full"/>
                          <span>{buff.name}</span>
                          <span className="text-gray-500 fs-xxs">({buff.duration} turns)</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              {mode === 'shop' && onBuy && (
                <button
                  onClick={() => onBuy(item.id)}
                  disabled={!canBuy}
                  className={`flex-1 py-3 font-bold flex items-center justify-center gap-2 transition-all ${
                    canBuy 
                      ? 'bg-cyan-900 text-cyan-100 hover:bg-cyan-700 border border-cyan-600 hover:shadow-[0_0_15px_rgba(6,182,212,0.4)]' 
                      : 'bg-gray-800 text-gray-500 border border-gray-700 cursor-not-allowed'
                  }`}
                >
                  <ShoppingCart size={16} />
                  {canBuy ? 'PURCHASE' : 'INSUFFICIENT FUNDS'}
                </button>
              )}

              {mode === 'inventory' && onUse && (
                <button
                  onClick={() => onUse(item.id)}
                  disabled={!canUse}
                  className={`flex-1 py-3 font-bold flex items-center justify-center gap-2 transition-all ${
                    canUse 
                      ? 'bg-green-900 text-green-100 hover:bg-green-700 border border-green-600 hover:shadow-[0_0_15px_rgba(34,197,94,0.4)]' 
                      : 'bg-gray-800 text-gray-500 border border-gray-700 cursor-not-allowed'
                  }`}
                >
                  <Zap size={16} />
                  USE ITEM
                </button>
              )}

              <button 
                onClick={handleClose}
                className="px-4 border border-gray-700 hover:bg-gray-800 text-gray-400 hover:text-white transition-colors"
              >
                <X size={20} />
              </button>
            </div>

          </div>
        </Panel>
      </div>
    </div>
  );
};
