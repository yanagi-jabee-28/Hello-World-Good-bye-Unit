
import { useEffect, useRef } from 'react';
import { useGameStore } from '../logic/store';
import { Sound } from '../utils/sound';

export const useGameSound = () => {
  const lastDayRef = useRef(1);

  useEffect(() => {
    // Subscribe to state changes without causing re-renders in the component using this hook
    const unsubscribe = useGameStore.subscribe((state, prevState) => {
      
      // 1. Log based sounds
      if (state.logs.length > prevState.logs.length) {
        const latestLog = state.logs[state.logs.length - 1];
        // Don't play on init (length 1)
        if (state.logs.length > 1) {
          if (latestLog.type === 'success') Sound.play('success');
          else if (latestLog.type === 'danger') Sound.play('failure');
          else if (latestLog.type === 'warning') Sound.play('alert');
          else if (latestLog.text.includes('回復')) Sound.play('hp_recovery');
          else if (latestLog.text.includes('入手')) Sound.play('item_use');
        }
      }

      // 2. Turn/Day based sounds
      if (state.day > lastDayRef.current) {
        Sound.play('turn_end');
        lastDayRef.current = state.day;
      } else if (state.day < lastDayRef.current) {
        // Reset detected (e.g. restart)
        lastDayRef.current = state.day;
      }
    });

    return () => unsubscribe();
  }, []);
};
