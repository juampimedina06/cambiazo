import React from 'react';
import { ProductCategory } from '@/shared/api/types';
import { Apple, Coffee, Candy, Flame, BookOpen, ShieldAlert } from 'lucide-react';

export const CATEGORY_LABELS: Record<ProductCategory, string> = {
  HEALTHY_SNACK: 'Snack Saludable',
  DRINK: 'Bebida',
  CANDY: 'Golosina',
  HOT_MEAL: 'Comida Caliente',
  STATIONERY: 'Librería / Útiles',
};

export const isParentBlockable = (category: ProductCategory): boolean => {
  return category === 'CANDY';
};

interface CategoryBadgeProps {
  category: ProductCategory;
  showBlockableIndicator?: boolean;
  className?: string;
}

export const CategoryBadge: React.FC<CategoryBadgeProps> = ({
  category,
  showBlockableIndicator = true,
  className = '',
}) => {
  const label = CATEGORY_LABELS[category] || category;
  const blockable = isParentBlockable(category);

  const config = {
    HEALTHY_SNACK: {
      bg: 'bg-emerald-50 text-emerald-800 border-emerald-200',
      icon: <Apple size={13} />,
    },
    DRINK: {
      bg: 'bg-blue-50 text-blue-800 border-blue-200',
      icon: <Coffee size={13} />,
    },
    CANDY: {
      bg: 'bg-amber-50 text-amber-900 border-amber-200',
      icon: <Candy size={13} />,
    },
    HOT_MEAL: {
      bg: 'bg-orange-50 text-orange-800 border-orange-200',
      icon: <Flame size={13} />,
    },
    STATIONERY: {
      bg: 'bg-brand-soft text-brand-dark border-purple-200',
      icon: <BookOpen size={13} />,
    },
  }[category];

  return (
    <div className={`inline-flex items-center gap-1.5 flex-wrap ${className}`}>
      <span
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${config.bg}`}
      >
        {config.icon}
        <span>{label}</span>
      </span>

      {showBlockableIndicator && blockable && (
        <span
          title="Esta categoría es bloqueable por familias en el control parental"
          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-900 border border-amber-300 animate-pulse"
        >
          <ShieldAlert size={12} className="text-amber-700" />
          <span>Bloqueable por padres</span>
        </span>
      )}
    </div>
  );
};
