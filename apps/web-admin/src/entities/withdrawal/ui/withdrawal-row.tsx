'use client';

import React from 'react';
import { KioskWithdrawal } from '@/shared/api/types';
import { ArrowUpRight, CheckCircle2, Clock, AlertCircle } from 'lucide-react';
import { Pill } from '@/shared/ui/Pill';

interface WithdrawalRowProps {
  withdrawal: KioskWithdrawal;
}

/**
 * WithdrawalRow component strictly adhering to AGENTS.md:
 * 1. Flat row layout — NO card-inside-card.
 * 2. Maximum 3 key data points:
 *    - Col 1: Icon + Date & Time of payout request
 *    - Col 2: Mercado Pago Destination (Alias/CVU) + Status Badge
 *    - Col 3: Highlighted ARS amount ($15.000) + Settlement status
 */
export const WithdrawalRow: React.FC<WithdrawalRowProps> = ({ withdrawal }) => {
  const formattedDate = new Date(withdrawal.createdAt).toLocaleDateString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const amountFormatted = new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    maximumFractionDigits: 0,
  }).format(withdrawal.amountCents / 100);

  const statusConfig = {
    PROCESSED: {
      label: 'Transferido',
      variant: 'granted' as const,
      icon: <CheckCircle2 size={13} />,
    },
    PENDING: {
      label: 'En Proceso',
      variant: 'pending' as const,
      icon: <Clock size={13} />,
    },
    FAILED: {
      label: 'Rechazado',
      variant: 'revoked' as const,
      icon: <AlertCircle size={13} />,
    },
  }[withdrawal.status];

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between px-5 py-4 border-b border-slate-200/60 dark:border-white/[0.07] last:border-b-0 hover:bg-white/60 dark:hover:bg-white/[0.04] transition-colors gap-3">
      {/* 1. Icon & Timestamp */}
      <div className="flex items-center gap-3.5 min-w-[200px]">
        <div className="w-10 h-10 rounded-2xl bg-brand-soft/80 dark:bg-brand-primary/20 text-brand-dark dark:text-purple-200 flex items-center justify-center flex-shrink-0">
          <ArrowUpRight size={18} />
        </div>
        <div title={`Ref: ${withdrawal.idempotencyKey}`}>
          <span className="font-bold text-sm text-text-primary tabular-nums block">
            {formattedDate} hs
          </span>
          <span className="text-xs text-text-secondary">
            Retiro Mercado Pago
          </span>
        </div>
      </div>

      {/* 2. Mercado Pago Destination & Status */}
      <div className="flex items-center gap-2.5 flex-wrap">
        <span className="text-xs font-mono bg-white/80 dark:bg-white/[0.08] border border-slate-200/70 dark:border-white/[0.1] px-2.5 py-1 rounded-lg text-text-primary">
          {withdrawal.mercadoPagoAliasOrCvu}
        </span>
        <Pill
          variant={statusConfig.variant}
          icon={statusConfig.icon}
          label={statusConfig.label}
        />
      </div>

      {/* 3. Amount in ARS */}
      <div className="text-base sm:text-lg font-extrabold text-emerald-600 dark:text-emerald-400 tabular-nums text-right">
        {amountFormatted}
      </div>
    </div>
  );
};
