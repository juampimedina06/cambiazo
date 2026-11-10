import React from 'react';

interface LogoPencilCProps {
  size?: number;
  className?: string;
  showText?: boolean;
}

/**
 * Official Cambiazo Isologo (<LogoPencilC />)
 * Uses the high-resolution 3D Curved Pencil "C" asset (/logo-pencil-c.jpg).
 */
export const LogoPencilC: React.FC<LogoPencilCProps> = ({
  size = 40,
  className = '',
  showText = false,
}) => {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div
        style={{ width: size, height: size }}
        className="rounded-xl bg-white shadow-sm border border-slate-200/80 overflow-hidden flex items-center justify-center shrink-0 p-0.5"
      >
        <img
          src="/logo-pencil-c.jpg"
          alt="CAMBIAZO Isologo"
          width={size}
          height={size}
          className="w-full h-full object-contain"
        />
      </div>
      {showText && (
        <span className="font-extrabold text-xl tracking-tight text-text-primary">
          CAMBIA<span className="text-amber-500">Z</span>O
        </span>
      )}
    </div>
  );
};
