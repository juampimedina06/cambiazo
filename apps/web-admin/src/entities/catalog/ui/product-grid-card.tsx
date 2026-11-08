'use client';

import React from 'react';
import { CatalogProduct } from '@/shared/api/types';
import { CategoryBadge } from './category-badge';
import { Button } from '@/shared/ui/Button';
import { Package, Edit2 } from 'lucide-react';

interface ProductGridCardProps {
  product: CatalogProduct;
  onEdit?: (product: CatalogProduct) => void;
}

export const ProductGridCard: React.FC<ProductGridCardProps> = ({
  product,
  onEdit,
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
      className={`bg-surface rounded-2xl border border-slate-100 p-5 flex flex-col justify-between hover:shadow-sm transition-all ${
        !product.isActive ? 'opacity-60 bg-slate-50/50' : ''
      }`}
    >
      <div>
        <div className="flex items-center justify-between mb-3">
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center ${
              product.isActive
                ? 'bg-brand-soft text-brand-dark'
                : 'bg-slate-200 text-slate-500'
            }`}
          >
            <Package size={20} />
          </div>
          <CategoryBadge category={product.category} />
        </div>

        <h3 className="font-bold text-text-primary text-base leading-tight mb-1">
          {product.name}
        </h3>

        <div className="text-xs text-text-secondary">
          {isOutOfStock ? (
            <span className="text-red-600 font-bold">Sin stock</span>
          ) : isLowStock ? (
            <span className="text-amber-600 font-semibold">
              Stock bajo: {product.stock} un.
            </span>
          ) : (
            <span>Stock: {product.stock} un.</span>
          )}
        </div>
      </div>

      <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between">
        <div>
          <div className="text-lg font-extrabold text-brand-primary tabular-nums">
            {priceFormatted}
          </div>
          <div className="text-[10px] text-text-secondary">Pesos reales 1 a 1</div>
        </div>

        {onEdit && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => onEdit(product)}
            aria-label={`Editar ${product.name}`}
          >
            <Edit2 size={13} className="mr-1" />
            <span>Editar</span>
          </Button>
        )}
      </div>
    </div>
  );
};
