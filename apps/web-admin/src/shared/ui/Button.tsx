import React from 'react';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
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
      'bg-brand-primary text-white hover:bg-brand-dark focus:ring-brand-primary shadow-sm active:scale-[0.98]',
    secondary:
      'bg-brand-soft text-brand-dark hover:bg-purple-200 focus:ring-brand-primary active:scale-[0.98]',
    outline:
      'bg-white border-2 border-slate-200 text-text-primary hover:border-brand-primary hover:text-brand-primary focus:ring-brand-primary active:scale-[0.98]',
    ghost:
      'bg-transparent text-text-secondary hover:text-text-primary hover:bg-slate-100 focus:ring-slate-300',
    danger:
      'bg-red-50 text-red-600 hover:bg-red-100 border border-red-200 focus:ring-red-400',
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
