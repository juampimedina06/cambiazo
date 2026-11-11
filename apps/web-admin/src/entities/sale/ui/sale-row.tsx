'use client';

import React from 'react';
import { KioskSale } from '@/shared/api/types';
import { ShoppingBag } from 'lucide-react';

interface SaleRowProps {
  sale: KioskSale;
}

/**
 * SaleRow component adhering to AGENTS.md:
 * 1. Flat row layout — NO card-inside-card.
 * 2. Maximum 3 key data points:
 *    - Col 1: Icon + Student/Code + Timestamp
 *    - Col 2: Item summary
 *    - Col 3: Highlighted ARS amount
 */
export const SaleRow: React.FC<SaleRowProps> = ({ sale }) => {
  const formattedTime = new Date(sale.createdAt).toLocaleTimeString('es-AR', {
    hour: '2-digit',
    minute: '2-digit',
  });

  const totalFormatted = new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    maximumFractionDigits: 0,
  }).format(sale.totalAmountCents / 100);

  const itemSummary =
    sale.items.length === 1
      ? `${sale.items[0]?.quantity}x ${sale.items[0]?.productName}`
      : `${sale.items[0]?.quantity}x ${sale.items[0]?.productName} + ${sale.items.length - 1} más`;

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between px-5 py-4 border-b border-slate-200/60 dark:border-white/[0.07] last:border-b-0 hover:bg-white/60 dark:hover:bg-white/[0.04] transition-colors gap-3">
      {/* 1. Student & Time */}
      <div className="flex items-center gap-3.5 min-w-[200px]">
        <div className="w-10 h-10 rounded-2xl bg-emerald-500/15 dark:bg-emerald-400/15 text-emerald-700 dark:text-emerald-300 flex items-center justify-center flex-shrink-0">
          <ShoppingBag size={18} />
        </div>
        <div className="min-w-0">
          <p className="font-bold text-sm text-text-primary truncate max-w-[200px]">
            {sale.studentName || `Código #${sale.paymentCode}`}
          </p>
          <span className="text-xs text-text-secondary tabular-nums">
            {formattedTime} hs
          </span>
        </div>
      </div>

      {/* 2. Items Summary */}
      <div className="text-xs sm:text-sm font-medium text-text-secondary sm:text-center">
        {itemSummary}
      </div>

      {/* 3. Net Amount */}
      <div className="text-base sm:text-lg font-extrabold text-emerald-600 dark:text-emerald-400 tabular-nums text-right">
        {totalFormatted}
      </div>
    </div>
  );
};
