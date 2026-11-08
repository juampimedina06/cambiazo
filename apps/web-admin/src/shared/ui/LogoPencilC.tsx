import React from 'react';

interface LogoPencilCProps {
  size?: number;
  className?: string;
  showText?: boolean;
}

/**
 * Official Cambiazo Isologo (<LogoPencilC />)
 * A flexible curved pencil forming the letter "C" in vibrant yellow (#FACC15),
 * with graphite tip and purple details (#6C3CE9).
 */
export const LogoPencilC: React.FC<LogoPencilCProps> = ({
  size = 40,
  className = '',
  showText = false,
}) => {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-label="CAMBIAZO Logo"
      >
        {/* Purple eraser base / metal band */}
        <path
          d="M68 20 C64 16 56 16 52 20 L58 26 C62 22 66 22 68 20 Z"
          fill="#4C1D95"
        />
        <rect
          x="58"
          y="18"
          width="12"
          height="7"
          rx="3.5"
          transform="rotate(35 58 18)"
          fill="#6C3CE9"
        />

        {/* Flexible Curved Pencil Body forming 'C' */}
        <path
          d="M 64 24
             C 42 12, 18 26, 18 50
             C 18 74, 42 88, 64 76"
          stroke="#FACC15"
          strokeWidth="15"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Inner wood section before tip */}
        <path
          d="M64 76 L72 71 L70 82 Z"
          fill="#FDE68A"
        />

        {/* Graphite tip */}
        <path
          d="M72 71 L76 74 L70 82 Z"
          fill="#1E1B4B"
        />

        {/* Decorative dynamic pencil line / shine */}
        <path
          d="M 58 28
             C 40 20, 26 34, 26 50
             C 26 66, 40 78, 58 72"
          stroke="#FEF08A"
          strokeWidth="3"
          strokeLinecap="round"
          fill="none"
          opacity="0.8"
        />
      </svg>
      {showText && (
        <span className="font-extrabold text-xl tracking-tight text-text-primary">
          CAMBIAZO
        </span>
      )}
    </div>
  );
};
