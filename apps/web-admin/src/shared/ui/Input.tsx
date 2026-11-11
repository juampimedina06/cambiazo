import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  helperText?: string;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  helperText,
  id,
  className = '',
  ...props
}) => {
  const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  return (
    <div className="w-full flex flex-col gap-1.5">
      <label htmlFor={inputId} className="text-sm font-semibold text-text-primary">
        {label}
      </label>
      <input
        id={inputId}
        className={`w-full px-4 py-3 backdrop-blur-md bg-white/75 dark:bg-white/[0.06] border rounded-2xl text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-brand-primary/60 focus:border-brand-primary transition-all ${
          error ? 'border-red-500 focus:ring-red-400' : 'border-white/80 dark:border-white/[0.12] shadow-sm'
        } ${className}`}
        {...props}
      />
      {error && <p className="text-xs text-red-600 font-medium">{error}</p>}
      {helperText && !error && (
        <p className="text-xs text-text-secondary">{helperText}</p>
      )}
    </div>
  );
};
