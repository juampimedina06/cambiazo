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
    active: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    suspended: 'bg-rose-50 text-rose-700 border-rose-200',
    pending: 'bg-amber-50 text-amber-700 border-amber-200',
    granted: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    revoked: 'bg-rose-50 text-rose-700 border-rose-200',
    points: 'bg-amber-100 text-amber-800 border-amber-300 font-bold',
    money: 'bg-emerald-100 text-emerald-800 border-emerald-300 font-bold',
    plan: 'bg-brand-soft text-brand-dark border-purple-200 font-semibold',
    neutral: 'bg-slate-100 text-text-secondary border-slate-200',
  }[variant];

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${variantStyles} ${className}`}
    >
      {icon && <span className="flex-shrink-0">{icon}</span>}
      <span>{label}</span>
    </span>
  );
};
