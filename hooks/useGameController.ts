
import { useState } from 'react';
import { useGameEngine } from './useGameEngine';
import { useGameSound } from './useGameSound';
import { ActionType, ItemId, GameState, SubjectId, UiScale, DebugFlags } from '../types';
import { Sound } from '../utils/sound';

export const useGameController = () => {
  const { state, dispatch } = useGameEngine();
  useGameSound(state); // Initialize sound system

  // UI State
  const [isShopOpen, setIsShopOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [mobileTab, setMobileTab] = useState<'terminal' | 'status'>('terminal');

  // Helpers
  const playClick = () => Sound.play('button_click');

  // Action Handlers
  const actions = {
    // Core Actions
    study: (subjectId: SubjectId) => {
      playClick();
      dispatch({ type: ActionType.STUDY, payload: subjectId });
    },
    studyAll: () => {
      playClick();
      dispatch({ type: ActionType.STUDY_ALL });
    },
    rest: () => {
      playClick();
      dispatch({ type: ActionType.REST });
    },
    work: () => {
      playClick();
      dispatch({ type: ActionType.WORK });
    },
    escapism: () => {
      playClick();
      dispatch({ type: ActionType.ESCAPISM });
    },
    
    // Social Actions
    askProfessor: () => {
      playClick();
      dispatch({ type: ActionType.ASK_PROFESSOR });
    },
    askSenior: () => {
      playClick();
      dispatch({ type: ActionType.ASK_SENIOR });
    },
    relyFriend: () => {
      playClick();
      dispatch({ type: ActionType.RELY_FRIEND });
    },

    // Item Actions
    useItem: (itemId: ItemId) => {
      playClick();
      dispatch({ type: ActionType.USE_ITEM, payload: itemId });
    },
    buyItem: (itemId: ItemId) => {
      playClick();
      dispatch({ type: ActionType.BUY_ITEM, payload: itemId });
    },

    // System/Event Actions
    resolveEvent: (optionId: string) => {
      playClick();
      dispatch({ type: ActionType.RESOLVE_EVENT, payload: { optionId } });
    },
    loadState: (loadedState: GameState) => {
      Sound.play('event_trigger');
      dispatch({ type: ActionType.LOAD_STATE, payload: loadedState });
    },
    
    // Reset Actions
    restart: () => {
      playClick();
      dispatch({ type: ActionType.RESTART });
    },
    fullReset: () => {
      Sound.play('game_over');
      dispatch({ type: ActionType.FULL_RESET });
    },
    softReset: () => {
      Sound.play('event_trigger');
      dispatch({ type: ActionType.SOFT_RESET });
    },
    hardRestart: () => {
      Sound.play('event_trigger');
      dispatch({ type: ActionType.HARD_RESTART });
    },

    // UI Controls
    openShop: () => { playClick(); setIsShopOpen(true); },
    closeShop: () => { playClick(); setIsShopOpen(false); },
    openMenu: () => { playClick(); setIsMenuOpen(true); },
    closeMenu: () => { setIsMenuOpen(false); },
    setMobileTab: (tab: 'terminal' | 'status') => {
      playClick();
      setMobileTab(tab);
    },
    setUiScale: (scale: UiScale) => {
      playClick();
      dispatch({ type: ActionType.SET_UI_SCALE, payload: scale });
    },
    toggleDebugFlag: (flag: keyof DebugFlags) => {
      playClick();
      dispatch({ type: ActionType.TOGGLE_DEBUG_FLAG, payload: flag });
    }
  };

  return {
    state,
    ui: { isShopOpen, isMenuOpen, mobileTab, uiScale: state.uiScale },
    actions
  };
};
