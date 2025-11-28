
import React, { useMemo } from 'react';
import { ProgressButtonProps, ProgressTheme } from '../../types/ui';
import { PROGRESS_THEMES, PROGRESS_BREAKPOINTS, ANIMATION_DURATIONS, CLIP_PATH_CYBER } from '../../config/uiTokens';

export const ProgressButton = React.memo<ProgressButtonProps>(({
  label,
  subLabel,
  icon,
  progress,
  maxValue = 100,
  onClick,
  disabled = false,
  className = '',
  ariaLabel,
  variant = 'default',
}) => {
  const percentage = Math.min(100, Math.max(0, (progress / maxValue) * 100));

  const themeType = useMemo((): ProgressTheme => {
    // Specific social variants override the progress-based logic
    if (variant === 'professor') return 'PROFESSOR';
    if (variant === 'senior') return 'SENIOR';
    if (variant === 'friend') return 'FRIEND';

    // Default: Academic logic (Pass/Fail threshold)
    if (percentage < PROGRESS_BREAKPOINTS.PASSING) return 'FAILING';
    if (percentage >= PROGRESS_BREAKPOINTS.ELITE) return 'ELITE';
    return 'PASSING';
  }, [percentage, variant]);

  const theme = PROGRESS_THEMES[themeType];
  const buttonAriaLabel = ariaLabel || `${label}, ${subLabel}, Progress ${Math.round(percentage)}%`;

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      aria-label={buttonAriaLabel}
      className={`
        relative w-full p-2.5 sm:p-3 border-2 font-bold text-left
        transition-all duration-${ANIMATION_DURATIONS.SCALE} overflow-hidden group
        ${theme.border} ${theme.glow}
        ${disabled
          ? 'opacity-40 cursor-not-allowed grayscale'
          : 'hover:scale-[1.01] active:scale-[0.99] cursor-pointer'
        }
        ${className}
      `}
      style={{ clipPath: CLIP_PATH_CYBER }}
    >
      {/* Background Gradient - fills from left */}
      <div
        className={`absolute inset-0 bg-gradient-to-r ${theme.bg} to-transparent transition-all duration-${ANIMATION_DURATIONS.GRADIENT_FILL} ease-out`}
        style={{ width: `${percentage}%` }}
      />

      {/* Scanlines Effect */}
      <div className="absolute inset-0 bg-scanlines opacity-10 pointer-events-none" />

      {/* Hover Shine Effect */}
      <div
        className={`
          absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent
          opacity-0 group-hover:opacity-100
          transform -skew-x-12 translate-x-[-100%] group-hover:translate-x-[100%]
          transition-transform duration-${ANIMATION_DURATIONS.HOVER_SHINE}
          pointer-events-none
        `}
      />

      {/* Content Layer */}
      <div className="relative z-10 flex items-center gap-3">
        <div className={`shrink-0 ${theme.text} transition-colors duration-300`}>
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-center mb-0.5">
             <span className="font-bold text-white text-sm tracking-wide truncate text-shadow-glow">
                {label}
             </span>
             <span className={`text-xs font-mono font-bold ${theme.text} opacity-90`}>
                {progress}/{maxValue}
             </span>
          </div>
          <div className="text-[10px] sm:text-xs text-gray-400 font-mono truncate opacity-70 group-hover:opacity-100 transition-opacity">
            {subLabel}
          </div>
        </div>
      </div>

      {/* Bottom Progress Bar Line */}
      <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-gray-900/50">
        <div
          className={`h-full ${theme.barColor} transition-all duration-${ANIMATION_DURATIONS.PROGRESS_BAR}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </button>
  );
});

ProgressButton.displayName = 'ProgressButton';
