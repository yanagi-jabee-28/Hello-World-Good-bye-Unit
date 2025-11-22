
import { GameState } from '../types';

const AUTO_SAVE_KEY = 'rsa_adventure_save_v1'; // Legacy & Auto
const SAVE_PREFIX = 'rsa_save_slot_';

// リセット操作中のオートセーブ（データ復活）を防ぐためのフラグ
let isResetting = false;

export type SaveSlotId = 'auto' | '1' | '2' | '3' | '4' | '5';

export interface SaveMetadata {
  id: SaveSlotId;
  timestamp: number;
  summary: string;
  day: number;
  money: number;
}

/**
 * 内部使用: 実際の保存処理
 */
const persist = (key: string, state: GameState) => {
  if (isResetting) return; // リセット中は保存をブロック

  try {
    const wrapper = {
      state,
      timestamp: Date.now(),
    };
    localStorage.setItem(key, JSON.stringify(wrapper));
  } catch (e) {
    console.error('Failed to save game:', e);
    // QuotaExceededError などのハンドリングは簡易的にコンソール出力のみ
  }
};

/**
 * オートセーブ (既存互換)
 */
export const saveGame = (state: GameState): void => {
  persist(AUTO_SAVE_KEY, state);
};

/**
 * スロットへの手動セーブ
 */
export const saveToSlot = (state: GameState, slotId: SaveSlotId): void => {
  const key = slotId === 'auto' ? AUTO_SAVE_KEY : `${SAVE_PREFIX}${slotId}`;
  persist(key, state);
};

/**
 * ロード処理
 */
export const loadGame = (slotId: SaveSlotId = 'auto'): GameState | null => {
  try {
    const key = slotId === 'auto' ? AUTO_SAVE_KEY : `${SAVE_PREFIX}${slotId}`;
    const serialized = localStorage.getItem(key);
    if (!serialized) return null;
    
    const parsed = JSON.parse(serialized);
    // 後方互換性: 以前のフォーマットは直接GameStateが入っていた
    // 新フォーマットは { state: GameState, timestamp: number }
    if (parsed.state && parsed.timestamp) {
      return parsed.state as GameState;
    } else {
      return parsed as GameState; // Legacy format
    }
  } catch (e) {
    console.error('Failed to load game:', e);
    return null;
  }
};

/**
 * セーブデータのメタデータ一覧を取得
 */
export const getSaveList = (): SaveMetadata[] => {
  const slots: SaveSlotId[] = ['auto', '1', '2', '3', '4', '5'];
  
  return slots.map(id => {
    try {
      const key = id === 'auto' ? AUTO_SAVE_KEY : `${SAVE_PREFIX}${id}`;
      const serialized = localStorage.getItem(key);
      if (!serialized) return { id, timestamp: 0, summary: 'NO DATA', day: 0, money: 0 };

      const parsed = JSON.parse(serialized);
      let state: GameState;
      let timestamp = 0;

      if (parsed.state && parsed.timestamp) {
        state = parsed.state;
        timestamp = parsed.timestamp;
      } else {
        state = parsed as GameState;
        timestamp = 0; // Legacy
      }
      
      return {
        id,
        timestamp,
        summary: `DAY ${state.day} ${state.timeSlot} - HP:${state.hp} SAN:${state.sanity}`,
        day: state.day,
        money: state.money
      };
    } catch (e) {
      return { id, timestamp: 0, summary: 'CORRUPTED', day: 0, money: 0 };
    }
  });
};

/**
 * セーブデータの削除
 */
export const deleteSave = (slotId: SaveSlotId): void => {
  const key = slotId === 'auto' ? AUTO_SAVE_KEY : `${SAVE_PREFIX}${slotId}`;
  localStorage.removeItem(key);
};

/**
 * 全データ消去 (Factory Reset)
 */
export const clearAllData = (): void => {
  isResetting = true; // 以降の保存処理をブロック
  
  try {
    localStorage.removeItem(AUTO_SAVE_KEY);
    ['1', '2', '3', '4', '5'].forEach(id => {
      localStorage.removeItem(`${SAVE_PREFIX}${id}`);
    });
  } catch (e) {
    console.error("Clear data failed", e);
  }
};

/**
 * エクスポート用JSON生成
 */
export const exportSaveData = (state: GameState): string => {
  const data = {
    version: '1.0.0',
    timestamp: Date.now(),
    state: state
  };
  return JSON.stringify(data, null, 2);
};

/**
 * インポート処理
 */
export const importSaveData = async (file: File): Promise<GameState> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const json = JSON.parse(text);
        
        // 簡易バリデーション
        if (!json.state || !json.state.day || !json.state.hp) {
          throw new Error("Invalid Save Data Format");
        }
        
        resolve(json.state as GameState);
      } catch (err) {
        reject(err);
      }
    };
    reader.readAsText(file);
  });
};

// Legacy function for backward compatibility in Layout/Engine
export const clearSave = (): void => {
  deleteSave('auto');
};
