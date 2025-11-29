
import React, { useMemo } from 'react';
import { ProgressButtonProps, ProgressTheme } from '../../types/ui';
import { PROGRESS_THEMES, PROGRESS_BREAKPOINTS, ANIMATION_DURATIONS, CLIP_PATH_CYBER } from '../../config/uiTokens';
import { Skull } from 'lucide-react';

interface ExtendedProps extends ProgressButtonProps {
  isLethal?: boolean;
}

export const ProgressButton = React.memo<ExtendedProps>(({
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
  isLethal = false,
}) => {
  const percentage = Math.min(100, Math.max(0, (progress / maxValue) * 100));

  const themeType = useMemo((): ProgressTheme => {
    if (variant === 'professor') return 'PROFESSOR';
    if (variant === 'senior') return 'SENIOR';
    if (variant === 'friend') return 'FRIEND';

    if (percentage < PROGRESS_BREAKPOINTS.PASSING) return 'FAILING';
    if (percentage >= PROGRESS_BREAKPOINTS.ELITE) return 'ELITE';
    return 'PASSING';
  }, [percentage, variant]);

  const theme = PROGRESS_THEMES[themeType];
  const buttonAriaLabel = ariaLabel || `${label}, ${subLabel}, Progress ${Math.round(percentage)}%`;

  // Lethal Styles
  const containerClass = isLethal 
    ? "border-red-500 shadow-[0_0_15px_rgba(220,38,38,0.5)] animate-pulse" 
    : `${theme.border} ${theme.glow}`;
  
  const textClass = isLethal ? "text-red-500" : theme.text;
  const barClass = isLethal ? "bg-red-600" : theme.barColor;
  const bgGradient = isLethal 
    ? "from-red-950/80 via-red-900/60" 
    : theme.bg;

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      aria-label={buttonAriaLabel}
      className={`
        relative w-full p-2.5 sm:p-3 border-2 font-bold text-left
        transition-all duration-${ANIMATION_DURATIONS.SCALE} overflow-hidden group
        ${containerClass}
        ${disabled
          ? 'opacity-40 cursor-not-allowed grayscale'
          : 'hover:scale-[1.01] active:scale-[0.99] cursor-pointer'
        }
        ${className}
      `}
      style={{ clipPath: CLIP_PATH_CYBER }}
    >
      {/* Background Gradient */}
      <div
        className={`absolute inset-0 bg-gradient-to-r ${bgGradient} to-transparent transition-all duration-${ANIMATION_DURATIONS.GRADIENT_FILL} ease-out`}
        style={{ width: isLethal ? '100%' : `${percentage}%` }}
      />

      {/* Scanlines Effect */}
      <div className="absolute inset-0 bg-scanlines opacity-10 pointer-events-none" />

      {/* Content Layer */}
      <div className="relative z-10 flex items-center gap-3">
        <div className={`shrink-0 ${textClass} transition-colors duration-300`}>
          {isLethal ? <Skull size={16} className="animate-bounce" /> : icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-center mb-0.5">
             <span className={`font-bold text-sm tracking-wide truncate text-shadow-glow ${isLethal ? 'text-red-400' : 'text-white'}`}>
                {label}
             </span>
             <span className={`text-xs font-mono font-bold ${textClass} opacity-90`}>
                {progress}/{maxValue}
             </span>
          </div>
          <div className={`text-[10px] sm:text-xs font-mono truncate opacity-70 group-hover:opacity-100 transition-opacity ${isLethal ? 'text-red-300 font-bold' : 'text-gray-400'}`}>
            {isLethal ? "⚠ FATAL RISK: RESOURCE DEPLETION" : subLabel}
          </div>
        </div>
      </div>

      {/* Bottom Progress Bar Line */}
      <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-gray-900/50">
        <div
          className={`h-full ${barClass} transition-all duration-${ANIMATION_DURATIONS.PROGRESS_BAR}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </button>
  );
});

ProgressButton.displayName = 'ProgressButton';
