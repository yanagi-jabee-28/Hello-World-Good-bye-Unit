
import { useState, useEffect } from 'react';
import { useGameStore } from '../logic/store';
import { useGameSound } from './useGameSound';
import { Sound } from '../utils/sound';
import { hasApiKey } from '../utils/apiKey';

export const useGameController = () => {
  // Select state and actions separately to avoid unnecessary re-renders in this hook
  // (though this hook is mostly used by App which needs everything)
  const state = useGameStore((s) => s);
  const actions = useGameStore((s) => s.actions);
  
  // Initialize sound system subscription
  useGameSound(); 

  // UI State (Local)
  const [isShopOpen, setIsShopOpen] = useState(false);
  const [isInventoryOpen, setIsInventoryOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showApiKeyModal, setShowApiKeyModal] = useState(false);
  const [mobileTab, setMobileTab] = useState<'terminal' | 'status'>('terminal');

  // Check API Key on mount
  useEffect(() => {
    if (!hasApiKey()) {
      setShowApiKeyModal(true);
    }
  }, []);

  const playClick = () => Sound.play('button_click');

  // Wrap actions with sound
  const wrappedActions = {
    ...actions,
    openShop: () => { playClick(); setIsShopOpen(true); },
    closeShop: () => { playClick(); setIsShopOpen(false); },
    openInventory: () => { playClick(); setIsInventoryOpen(true); },
    closeInventory: () => { playClick(); setIsInventoryOpen(false); },
    openMenu: () => { playClick(); setIsMenuOpen(true); },
    closeMenu: () => { setIsMenuOpen(false); },
    closeApiKeyModal: () => { setShowApiKeyModal(false); },
    setMobileTab: (tab: 'terminal' | 'status') => {
      playClick();
      setMobileTab(tab);
    },
    // Wrap generic actions to play click sound
    study: (id) => { playClick(); actions.study(id); },
    studyAll: () => { playClick(); actions.studyAll(); },
    rest: () => { playClick(); actions.rest(); },
    work: () => { playClick(); actions.work(); },
    escapism: () => { playClick(); actions.escapism(); },
    askProfessor: () => { playClick(); actions.askProfessor(); },
    askSenior: () => { playClick(); actions.askSenior(); },
    relyFriend: () => { playClick(); actions.relyFriend(); },
    useItem: (id) => { playClick(); actions.useItem(id); },
    buyItem: (id) => { playClick(); actions.buyItem(id); },
    resolveEvent: (id) => { playClick(); actions.resolveEvent(id); },
    loadState: (s) => { Sound.play('event_trigger'); actions.loadState(s); },
    restart: () => { playClick(); actions.restart(); },
    fullReset: () => { Sound.play('game_over'); actions.fullReset(); },
    softReset: () => { Sound.play('event_trigger'); actions.softReset(); },
    hardRestart: () => { Sound.play('event_trigger'); actions.hardRestart(); },
    setUiScale: (s) => { playClick(); actions.setUiScale(s); },
    toggleDebugFlag: (f) => { playClick(); actions.toggleDebugFlag(f); },
  };

  return {
    state,
    ui: { isShopOpen, isInventoryOpen, isMenuOpen, mobileTab, uiScale: state.uiScale, showApiKeyModal },
    actions: wrappedActions
  };
};
