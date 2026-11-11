'use client';

import React from 'react';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from '../theme/ThemeProvider';

interface ThemeToggleProps {
  compact?: boolean;
  className?: string;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({
  compact = false,
  className = '',
}) => {
  const { theme, toggleTheme, mounted } = useTheme();
  const isDark = mounted && theme === 'dark';

  return (
    <button
      type="button"
      onClick={toggleTheme}
      role="switch"
      aria-checked={isDark}
      aria-label={isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
      title={isDark ? 'Modo Claro' : 'Modo Oscuro'}
      className={`group relative inline-flex items-center gap-1.5 rounded-full p-1 backdrop-blur-xl backdrop-saturate-150 bg-white/65 dark:bg-white/[0.08] border border-white/80 dark:border-white/[0.14] shadow-sm transition-all duration-300 hover:bg-white/90 dark:hover:bg-white/[0.14] active:scale-[0.97] ${className}`}
    >
      <span
        className={`flex h-7 w-7 items-center justify-center rounded-full transition-all duration-300 ${
          !isDark
            ? 'bg-gradient-to-br from-amber-300 to-amber-400 text-amber-950 shadow-[0_2px_10px_rgba(250,204,21,0.45)]'
            : 'text-text-muted opacity-65 group-hover:opacity-90'
        }`}
      >
        <Sun size={14} strokeWidth={2.3} />
      </span>

      <span
        className={`flex h-7 w-7 items-center justify-center rounded-full transition-all duration-300 ${
          isDark
            ? 'bg-gradient-to-br from-brand-primary to-indigo-500 text-white shadow-[0_2px_12px_rgba(108,60,233,0.55)]'
            : 'text-text-muted opacity-65 group-hover:opacity-90'
        }`}
      >
        <Moon size={14} strokeWidth={2.3} />
      </span>

      {!compact && (
        <span className="hidden lg:inline-block pr-2.5 pl-0.5 text-xs font-semibold text-text-secondary">
          {isDark ? 'Oscuro' : 'Claro'}
        </span>
      )}
    </button>
  );
};

