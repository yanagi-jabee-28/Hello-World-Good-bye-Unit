
import React from 'react';
import { GameState, ItemId, UiScale, GameStatus, DebugFlags } from '../types';
import { ITEMS } from '../data/items';
import { ShopModal } from './ShopModal';
import { SaveLoadModal } from './SaveLoadModal';
import { EventDialog } from './EventDialog';
import { ItemDetailModal } from './ItemDetailModal';
import { DeathSequence } from './DeathSequence';
import { EndingScreen } from './EndingScreen';
import { DebugPanel } from './DebugPanel';

interface OverlayLayerProps {
  state: GameState;
  ui: {
    isShopOpen: boolean;
    isMenuOpen: boolean;
    uiScale: UiScale;
  };
  actions: {
    closeShop: () => void;
    buyItem: (id: ItemId) => void;
    closeMenu: () => void;
    loadState: (state: GameState) => void;
    fullReset: () => void;
    softReset: () => void;
    hardRestart: () => void;
    setUiScale: (scale: UiScale) => void;
    resolveEvent: (optionId: string) => void;
    useItem: (id: ItemId) => void;
    restart: () => void;
    toggleDebugFlag: (flag: keyof DebugFlags) => void;
  };
  inspectedItem: { id: ItemId; mode: 'inventory' | 'shop' } | null;
  onCloseInspect: () => void;
  onInspect: (itemId: ItemId, mode: 'inventory' | 'shop') => void;
  showDeathSequence: boolean;
  onSequenceComplete: () => void;
  showEndingScreen: boolean;
  onRestartEnding: () => void;
}

export const OverlayLayer: React.FC<OverlayLayerProps> = ({
  state,
  ui,
  actions,
  inspectedItem,
  onCloseInspect,
  onInspect,
  showDeathSequence,
  onSequenceComplete,
  showEndingScreen,
  onRestartEnding
}) => {
  return (
    <>
      {ui.isShopOpen && (
        <ShopModal 
          money={state.money} 
          onClose={actions.closeShop} 
          onBuy={actions.buyItem} 
          onInspect={onInspect}
        />
      )}
      {ui.isMenuOpen && (
        <SaveLoadModal
          currentState={state}
          onClose={actions.closeMenu}
          onLoad={actions.loadState}
          onReset={actions.fullReset}
          onSoftReset={actions.softReset}
          onHardReset={actions.hardRestart}
          uiScale={ui.uiScale}
          onSetUiScale={actions.setUiScale}
        />
      )}
      {/* Event Dialog: Don't show if game over sequence is active */}
      {state.pendingEvent && !showDeathSequence && !showEndingScreen && (
        <EventDialog 
          event={state.pendingEvent} 
          state={state}
          onResolve={actions.resolveEvent} 
        />
      )}
      
      {/* Item Detail Modal */}
      {inspectedItem && (
        <ItemDetailModal
          item={ITEMS[inspectedItem.id]}
          mode={inspectedItem.mode}
          onClose={onCloseInspect}
          onBuy={(id) => { actions.buyItem(id); onCloseInspect(); }}
          onUse={(id) => { actions.useItem(id); onCloseInspect(); }}
          canBuy={state.money >= ITEMS[inspectedItem.id].price}
          canUse={(state.inventory[inspectedItem.id] || 0) > 0}
        />
      )}

      {/* Death Sequence Overlay */}
      {showDeathSequence && (
        <DeathSequence 
          type={state.status === GameStatus.GAME_OVER_HP ? 'hp' : 'sanity'} 
          cause={state.logs[state.logs.length - 1]?.text || "UNKNOWN ERROR"}
          onComplete={onSequenceComplete} 
        />
      )}

      {/* Ending Screen */}
      {showEndingScreen && (
        <EndingScreen state={state} onRestart={onRestartEnding} />
      )}
      
      <DebugPanel state={state} onToggleFlag={actions.toggleDebugFlag} />
    </>
  );
};
