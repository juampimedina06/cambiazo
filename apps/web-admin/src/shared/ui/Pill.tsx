import React from 'react';

export type PillVariant =
  | 'active'
  | 'suspended'
  | 'pending'
  | 'granted'
  | 'revoked'
  | 'points'
  | 'money'
  | 'neutral'
  | 'plan';

interface PillProps {
  label: string;
  variant?: PillVariant;
  icon?: React.ReactNode;
  className?: string;
}

export const Pill: React.FC<PillProps> = ({
  label,
  variant = 'neutral',
  icon,
  className = '',
}) => {
  const variantStyles = {
    active: 'bg-emerald-500/12 dark:bg-emerald-400/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/25 dark:border-emerald-400/25',
    suspended: 'bg-rose-500/12 dark:bg-rose-400/15 text-rose-700 dark:text-rose-300 border-rose-500/25 dark:border-rose-400/25',
    pending: 'bg-amber-500/12 dark:bg-amber-400/15 text-amber-700 dark:text-amber-300 border-amber-500/25 dark:border-amber-400/25',
    granted: 'bg-emerald-500/12 dark:bg-emerald-400/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/25 dark:border-emerald-400/25',
    revoked: 'bg-rose-500/12 dark:bg-rose-400/15 text-rose-700 dark:text-rose-300 border-rose-500/25 dark:border-rose-400/25',
    points: 'bg-amber-400/20 dark:bg-amber-400/15 text-amber-800 dark:text-amber-200 border-amber-400/35 font-bold',
    money: 'bg-emerald-500/15 dark:bg-emerald-400/15 text-emerald-800 dark:text-emerald-200 border-emerald-500/30 font-bold',
    plan: 'bg-brand-soft/80 dark:bg-brand-primary/20 text-brand-dark dark:text-purple-200 border-brand-primary/20 font-semibold',
    neutral: 'bg-slate-500/10 dark:bg-white/[0.08] text-text-secondary border-slate-500/15 dark:border-white/[0.12]',
  }[variant];

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold backdrop-blur-sm border ${variantStyles} ${className}`}
    >
      {icon && <span className="flex-shrink-0">{icon}</span>}
      <span>{label}</span>
    </span>
  );
};
