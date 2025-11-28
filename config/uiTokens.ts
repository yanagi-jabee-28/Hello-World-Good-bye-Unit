
export const PROGRESS_THEMES = {
  // Legacy Progress-based Themes (Fallback)
  LOW: {
    bg: 'from-gray-900/80 via-gray-800/60',
    border: 'border-gray-700',
    text: 'text-gray-400',
    glow: 'shadow-[0_0_10px_rgba(107,114,128,0.1)]',
    barColor: 'bg-gray-600',
  },
  MEDIUM: {
    bg: 'from-yellow-900/60 via-yellow-800/40',
    border: 'border-yellow-700/60',
    text: 'text-yellow-400',
    glow: 'shadow-[0_0_15px_rgba(234,179,8,0.15)]',
    barColor: 'bg-yellow-500',
  },
  HIGH: {
    bg: 'from-green-900/60 via-green-800/40',
    border: 'border-green-700',
    text: 'text-green-400',
    glow: 'shadow-[0_0_20px_rgba(34,197,94,0.2)]',
    barColor: 'bg-green-500',
  },
  // Social Character Themes
  PROFESSOR: {
    bg: 'from-indigo-900/60 via-indigo-800/40',
    border: 'border-indigo-700',
    text: 'text-indigo-400',
    glow: 'shadow-[0_0_15px_rgba(99,102,241,0.2)]',
    barColor: 'bg-indigo-500',
  },
  SENIOR: {
    bg: 'from-purple-900/60 via-purple-800/40',
    border: 'border-purple-700',
    text: 'text-purple-400',
    glow: 'shadow-[0_0_15px_rgba(168,85,247,0.2)]',
    barColor: 'bg-purple-500',
  },
  FRIEND: {
    bg: 'from-pink-900/60 via-pink-800/40',
    border: 'border-pink-700',
    text: 'text-pink-400',
    glow: 'shadow-[0_0_15px_rgba(236,72,153,0.2)]',
    barColor: 'bg-pink-500',
  },
  // New Academic Threshold Themes
  FAILING: {
    bg: 'from-red-900/80 via-orange-800/60',
    border: 'border-red-700/60',
    text: 'text-orange-400',
    glow: 'shadow-[0_0_10px_rgba(239,68,68,0.2)]',
    barColor: 'bg-red-600',
  },
  PASSING: {
    bg: 'from-green-900/60 via-emerald-800/40',
    border: 'border-green-600',
    text: 'text-green-400',
    glow: 'shadow-[0_0_15px_rgba(34,197,94,0.3)]',
    barColor: 'bg-green-500',
  },
  ELITE: {
    bg: 'from-blue-900/60 via-cyan-800/40',
    border: 'border-cyan-500',
    text: 'text-cyan-300',
    glow: 'shadow-[0_0_15px_rgba(6,182,212,0.4)]',
    barColor: 'bg-cyan-500',
  }
} as const;

export const PROGRESS_BREAKPOINTS = {
  LOW_MAX: 30,
  MEDIUM_MAX: 70,
  PASSING: 60,
  ELITE: 85,
} as const;

export const ANIMATION_DURATIONS = {
  GRADIENT_FILL: 700,
  PROGRESS_BAR: 500,
  HOVER_SHINE: 700,
  SCALE: 300,
} as const;

export const CLIP_PATH_CYBER = "polygon(10px 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%, 0 10px)";
