import React from 'react';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'accent';
export type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  children: React.ReactNode;
  icon?: React.ReactNode;
  isLoading?: boolean;
}

/**
 * Button component compliant with AGENTS.md:
 * - High-contrast, friendly rounded-xl or rounded-2xl.
 * - Primary actions have minimum height for ergonomic interaction.
 */
export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  children,
  icon,
  isLoading = false,
  className = '',
  disabled,
  ...props
}) => {
  const baseStyles =
    'inline-flex items-center justify-center font-bold transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed select-none cursor-pointer';

  const sizeStyles = {
    sm: 'text-sm px-3 py-2 rounded-xl h-10 gap-1.5',
    md: 'text-base px-5 py-3 rounded-2xl min-h-[48px] gap-2',
    lg: 'text-base px-6 py-3.5 rounded-2xl min-h-[54px] gap-2.5',
  }[size];

  const variantStyles = {
    primary:
      'bg-brand-primary text-white hover:bg-[#5B2DD6] focus:ring-brand-primary shadow-[0_6px_20px_-4px_rgba(108,60,233,0.45)] active:scale-[0.98]',
    secondary:
      'bg-brand-soft/80 dark:bg-brand-primary/20 text-brand-dark dark:text-purple-200 border border-brand-primary/15 dark:border-brand-primary/30 hover:bg-brand-soft dark:hover:bg-brand-primary/30 focus:ring-brand-primary active:scale-[0.98]',
    outline:
      'backdrop-blur-md bg-white/70 dark:bg-white/[0.06] border border-slate-200/80 dark:border-white/[0.14] text-text-primary hover:border-brand-primary/60 hover:text-brand-primary dark:hover:bg-white/[0.1] focus:ring-brand-primary active:scale-[0.98]',
    ghost:
      'bg-transparent text-text-secondary hover:text-text-primary hover:bg-black/[0.04] dark:hover:bg-white/[0.08] focus:ring-slate-300',
    danger:
      'bg-rose-500/10 dark:bg-rose-500/15 text-rose-600 dark:text-rose-300 hover:bg-rose-500/20 border border-rose-200/80 dark:border-rose-400/25 focus:ring-rose-400',
    accent:
      'bg-emerald-600 text-white hover:bg-emerald-500 focus:ring-emerald-500 shadow-[0_6px_20px_-4px_rgba(16,185,129,0.4)] active:scale-[0.98]',
  }[variant];

  return (
    <button
      className={`${baseStyles} ${sizeStyles} ${variantStyles} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <span className="inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
      ) : (
        icon && <span className="flex-shrink-0">{icon}</span>
      )}
      <span>{children}</span>
    </button>
  );
};
