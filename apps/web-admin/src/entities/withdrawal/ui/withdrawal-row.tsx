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
    <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 sm:p-5 border-b border-slate-100 hover:bg-slate-50/50 transition-colors gap-3">
      {/* 1. Icon & Timestamp */}
      <div className="flex items-center gap-3.5 min-w-[220px]">
        <div className="w-11 h-11 rounded-2xl bg-brand-soft text-brand-dark flex items-center justify-center flex-shrink-0">
          <ArrowUpRight size={20} />
        </div>
        <div>
          <span className="font-extrabold text-sm text-text-primary tabular-nums block">
            {formattedDate} hs
          </span>
          <span className="text-[11px] text-text-secondary font-mono" title={withdrawal.idempotencyKey}>
            Idempotencia: {withdrawal.idempotencyKey.substring(0, 14)}...
          </span>
        </div>
      </div>

      {/* 2. Mercado Pago CVU/Alias & Status */}
      <div className="flex flex-col sm:items-center gap-1">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-text-primary">
            Destino MP:
          </span>
          <span className="text-xs font-mono bg-slate-100 px-2 py-0.5 rounded-lg text-text-primary">
            {withdrawal.mercadoPagoAliasOrCvu}
          </span>
        </div>
        <Pill
          variant={statusConfig.variant}
          icon={statusConfig.icon}
          label={statusConfig.label}
        />
      </div>

      {/* 3. Amount in ARS */}
      <div className="flex items-center justify-between sm:justify-end gap-4">
        <div className="text-right">
          <div className="text-base sm:text-lg font-extrabold text-emerald-700 tabular-nums">
            {amountFormatted}
          </div>
          <div className="text-[10px] text-text-secondary">
            100% neto a cuenta MP
          </div>
        </div>
      </div>
    </div>
  );
};
