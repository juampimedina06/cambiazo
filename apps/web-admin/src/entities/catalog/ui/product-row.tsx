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
      className={`flex flex-col sm:flex-row sm:items-center justify-between p-4 sm:p-5 border-b border-slate-100 hover:bg-slate-50/50 transition-colors gap-4 ${
        !product.isActive ? 'opacity-60 bg-slate-50/30' : ''
      }`}
    >
      {/* 1. Product Identity & Stock */}
      <div className="flex items-center gap-4 min-w-[260px]">
        <div
          className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 ${
            product.isActive
              ? 'bg-brand-soft text-brand-dark'
              : 'bg-slate-200 text-slate-500'
          }`}
        >
          <Package size={22} />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-text-primary text-base leading-tight">
              {product.name}
            </h3>
            {!product.isActive && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-200 text-slate-600">
                Pausado
              </span>
            )}
          </div>
          <p className="text-xs text-text-secondary mt-0.5">
            {isOutOfStock ? (
              <span className="text-red-600 font-bold">Sin stock disponible</span>
            ) : isLowStock ? (
              <span className="text-amber-600 font-semibold">
                ¡Poco stock! {product.stock} disponibles
              </span>
            ) : (
              <span>Stock: {product.stock} unidades</span>
            )}
          </p>
        </div>
      </div>

      {/* 2. Category & Parent-Blockable Badges */}
      <div className="flex items-center gap-2">
        <CategoryBadge category={product.category} />
      </div>

      {/* 3. Price in Pesos (1 a 1) & Actions */}
      <div className="flex items-center justify-between sm:justify-end gap-5">
        <div className="text-right">
          <div className="text-lg sm:text-xl font-extrabold text-brand-primary tabular-nums">
            {priceFormatted}
          </div>
          <div className="text-[11px] text-text-secondary font-medium">
            Pesos reales 1 a 1
          </div>
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
