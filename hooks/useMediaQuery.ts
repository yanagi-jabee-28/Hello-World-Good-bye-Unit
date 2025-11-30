import { useState, useEffect } from 'react';

/**
 * CSSメディアクエリの状態をJavaScript側で監視するフック
 * レイアウトの物理的な切り替え（条件付きレンダリング）に使用し、
 * CSS読み込み不良によるレイアウト崩れ（FOUC/Layout Shift）を防ぐ。
 * 
 * @param query メディアクエリ文字列 (例: '(min-width: 1024px)')
 * @returns マッチしているかどうかのboolean
 */
export const useMediaQuery = (query: string): boolean => {
  // Initialize with actual value if possible to prevent layout shift on mount
  const [matches, setMatches] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.matchMedia(query).matches;
    }
    return false;
  });

  useEffect(() => {
    const media = window.matchMedia(query);
    // Ensure state sync on mount
    if (media.matches !== matches) {
      setMatches(media.matches);
    }

    const listener = () => setMatches(media.matches);
    media.addEventListener('change', listener);
    
    return () => media.removeEventListener('change', listener);
  }, [matches, query]);

  return matches;
};