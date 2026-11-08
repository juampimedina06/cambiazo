import React from 'react';

interface SurfaceProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
}

/**
 * Surface component compliant with AGENTS.md rules:
 * - 60% base canvas (#F8F7FF) and clean pure surface (#FFFFFF).
 * - Rounded-2xl (16px) with soft border/shadow.
 * - RULE: PROHIBIDO ANIDAR TARJETAS (No Card-inside-Card).
 *   Subsections or rows inside Surface must be flat with subtle dividers (#F1F5F9).
 */
export const Surface: React.FC<SurfaceProps> = ({
  children,
  className = '',
  ...props
}) => {
  return (
    <div
      className={`bg-surface rounded-2xl border border-slate-100 shadow-sm overflow-hidden ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};
