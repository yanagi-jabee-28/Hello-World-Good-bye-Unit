
import React from 'react';

export interface ProgressButtonProps {
  label: string;
  subLabel: string;
  icon: React.ReactNode;
  progress: number;
  maxValue?: number;
  onClick: () => void;
  disabled?: boolean;
  className?: string;
  ariaLabel?: string;
  /** Use 'default' for progress-based colors (Gray->Yellow->Green), or specific social variants */
  variant?: 'default' | 'professor' | 'senior' | 'friend';
  /** Optional: Pass-through for inspect handler if needed in future */
  onInspect?: (e: React.MouseEvent) => void;
}

export type ProgressTheme = 'LOW' | 'MEDIUM' | 'HIGH' | 'PROFESSOR' | 'SENIOR' | 'FRIEND';
