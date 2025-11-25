import { useEffect, useRef } from 'react';
import { GameState } from '../types';
import { Sound } from '../utils/sound';

export const useGameSound = (state: GameState) => {
  const lastLogIdRef = useRef<string | null>(null);
  const lastDayRef = useRef(state.day);

  // Watch logs for feedback
  useEffect(() => {
    const latestLog = state.logs[state.logs.length - 1];
    if (latestLog && latestLog.id !== lastLogIdRef.current) {
       lastLogIdRef.current = latestLog.id;
       
       // Don't play sound on init
       if (state.logs.length > 1) {
          if (latestLog.type === 'success') Sound.play('success');
          else if (latestLog.type === 'danger') Sound.play('failure');
          else if (latestLog.type === 'warning') Sound.play('alert');
          else if (latestLog.text.includes('回復')) Sound.play('hp_recovery');
          else if (latestLog.text.includes('入手')) Sound.play('item_use');
       }
    }
  }, [state.logs]);

  // Watch day change for turn_end sound
  useEffect(() => {
    if (state.day > lastDayRef.current) {
      Sound.play('turn_end');
      lastDayRef.current = state.day;
    }
  }, [state.day]);
};