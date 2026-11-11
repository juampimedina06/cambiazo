'use client';

import React from 'react';
import { CatalogProduct } from '@/shared/api/types';
import { CategoryBadge } from './category-badge';
import { Button } from '@/shared/ui/Button';
import { Edit2, Power, Trash2, Package } from 'lucide-react';

interface ProductRowProps {
  product: CatalogProduct;
  onEdit?: (product: CatalogProduct) => void;
  onToggleStatus?: (product: CatalogProduct) => void;
  onDelete?: (product: CatalogProduct) => void;
  isUpdating?: boolean;
}

/**
 * ProductRow component strictly adhering to AGENTS.md:
 * 1. Flat row layout — NO card-inside-card.
 * 2. Maximum 3 key data points visible at a glance:
 *    - Col 1: Icon + Product Name + Stock status
 *    - Col 2: Category Badge + Parent-blockable warning indicator
 *    - Col 3: Highlighted price in ARS ($1.200) + Actions (Editar, Pausar/Activar, Eliminar)
 */
export const ProductRow: React.FC<ProductRowProps> = ({
  product,
  onEdit,
  onToggleStatus,
  onDelete,
  isUpdating = false,
}) => {
  const priceFormatted = new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    maximumFractionDigits: 0,
  }).format(product.priceCents / 100);

  const isLowStock = product.stock <= 5 && product.stock > 0;
  const isOutOfStock = product.stock === 0;

  return (
    <div
      className={`flex flex-col sm:flex-row sm:items-center justify-between px-5 py-4 border-b border-slate-200/60 dark:border-white/[0.07] last:border-b-0 hover:bg-white/60 dark:hover:bg-white/[0.04] transition-colors gap-4 ${
        !product.isActive ? 'opacity-55' : ''
      }`}
    >
      {/* 1. Product Identity & Stock */}
      <div className="flex items-center gap-3.5 min-w-[240px]">
        <div
          className={`w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0 ${
            product.isActive
              ? 'bg-brand-soft/80 dark:bg-brand-primary/20 text-brand-dark dark:text-purple-200'
              : 'bg-slate-200/70 dark:bg-white/[0.08] text-text-muted'
          }`}
        >
          <Package size={20} />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-text-primary text-sm sm:text-base leading-tight">
              {product.name}
            </h3>
            {!product.isActive && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-200/80 dark:bg-white/[0.1] text-text-secondary">
                Pausado
              </span>
            )}
          </div>
          <p className="text-xs text-text-secondary mt-0.5">
            {isOutOfStock ? (
              <span className="text-rose-600 dark:text-rose-400 font-bold">Sin stock</span>
            ) : isLowStock ? (
              <span className="text-amber-600 dark:text-amber-300 font-semibold">
                Quedan {product.stock} u.
              </span>
            ) : (
              <span>Stock: {product.stock} u.</span>
            )}
          </p>
        </div>
      </div>

      {/* 2. Category Badge */}
      <div className="flex items-center gap-2">
        <CategoryBadge category={product.category} />
      </div>

      {/* 3. Price & Actions */}
      <div className="flex items-center justify-between sm:justify-end gap-4">
        <div className="text-lg sm:text-xl font-extrabold text-brand-primary dark:text-purple-300 tabular-nums">
          {priceFormatted}
        </div>

        <div className="flex items-center gap-1.5">
          {onEdit && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => onEdit(product)}
              disabled={isUpdating}
              title="Editar producto"
              aria-label={`Editar ${product.name}`}
            >
              <Edit2 size={14} />
            </Button>
          )}

          {onToggleStatus && (
            <Button
              size="sm"
              variant={product.isActive ? 'ghost' : 'secondary'}
              onClick={() => onToggleStatus(product)}
              disabled={isUpdating}
              title={product.isActive ? 'Pausar producto' : 'Activar producto'}
              aria-label={product.isActive ? `Pausar ${product.name}` : `Activar ${product.name}`}
            >
              <Power size={14} className={product.isActive ? 'text-slate-400' : 'text-emerald-600'} />
            </Button>
          )}

          {onDelete && (
            <Button
              size="sm"
              variant="danger"
              onClick={() => onDelete(product)}
              disabled={isUpdating}
              title="Eliminar producto"
              aria-label={`Eliminar ${product.name}`}
            >
              <Trash2 size={14} />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};
