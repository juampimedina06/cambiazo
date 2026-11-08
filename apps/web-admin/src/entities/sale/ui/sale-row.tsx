'use client';

import React from 'react';
import { KioskSale } from '@/shared/api/types';
import { ShoppingBag, CheckCircle2, ShieldCheck } from 'lucide-react';

interface SaleRowProps {
  sale: KioskSale;
}

/**
 * SaleRow component adhering to AGENTS.md:
 * 1. Flat row layout — NO card-inside-card.
 * 2. Maximum 3 key data points:
 *    - Col 1: Icon + Timestamp + Student or Code identifier
 *    - Col 2: Item summary + 0% platform fee badge
 *    - Col 3: Highlighted ARS amount ($4.300) + Status
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
    <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 sm:p-5 border-b border-slate-100 hover:bg-slate-50/50 transition-colors gap-3">
      {/* 1. Time & Identifier */}
      <div className="flex items-center gap-3.5 min-w-[200px]">
        <div className="w-11 h-11 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center flex-shrink-0">
          <ShoppingBag size={20} />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-sm text-text-primary tabular-nums">
              {formattedTime} hs
            </span>
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-text-secondary">
              #{sale.paymentCode}
            </span>
          </div>
          <p className="text-xs text-text-secondary mt-0.5 truncate max-w-[180px]">
            {sale.studentName || `Código ${sale.paymentCode}`}
          </p>
        </div>
      </div>

      {/* 2. Items & 0% Platform Fee Indicator */}
      <div className="flex flex-col sm:items-center gap-1">
        <span className="text-xs font-semibold text-text-primary">
          {itemSummary}
        </span>
        <div className="flex items-center gap-1.5">
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <ShieldCheck size={11} />
            <span>0% Comisión de plataforma</span>
          </span>
        </div>
      </div>

      {/* 3. Highlighted Net Amount in Pesos */}
      <div className="flex items-center justify-between sm:justify-end gap-4">
        <div className="text-right">
          <div className="text-base sm:text-lg font-extrabold text-emerald-700 tabular-nums">
            {totalFormatted}
          </div>
          <div className="text-[10px] text-text-secondary">
            100% neto al kiosco
          </div>
        </div>

        <div className="flex items-center text-emerald-600 font-bold text-xs gap-1">
          <CheckCircle2 size={16} />
        </div>
      </div>
    </div>
  );
};
