'use client';

import React from 'react';
import { KioskLedgerBalance } from '@/shared/api/types';
import { Surface } from '@/shared/ui/Surface';
import { Button } from '@/shared/ui/Button';
import { Wallet, ArrowUpRight, ShieldCheck, CheckCircle2 } from 'lucide-react';

interface LedgerBalanceCardProps {
  balance: KioskLedgerBalance;
  onRequestWithdrawal: () => void;
  isLoading?: boolean;
}

/**
 * LedgerBalanceCard adhering to AGENTS.md:
 * - 60-30-10 palette with Giant $ in Mint Green (#10B981) for real pesos.
 * - Flat surface directly on canvas (NO nested cards inside).
 */
export const LedgerBalanceCard: React.FC<LedgerBalanceCardProps> = ({
  balance,
  onRequestWithdrawal,
  isLoading = false,
}) => {
  const availableFormatted = new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    maximumFractionDigits: 0,
  }).format(balance.availableBalanceCents / 100);

  const totalSalesFormatted = new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    maximumFractionDigits: 0,
  }).format(balance.totalSalesCents / 100);

  const totalWithdrawnFormatted = new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    maximumFractionDigits: 0,
  }).format(balance.totalWithdrawnCents / 100);

  const canWithdraw = balance.availableBalanceCents > 0;

  return (
    <Surface className="p-6 sm:p-8 bg-gradient-to-br from-white via-white to-purple-50/40 border-2 border-purple-100">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        {/* Left: Giant Balance Display */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xs">
              <Wallet size={16} />
            </span>
            <span className="text-xs font-bold text-text-secondary uppercase tracking-wider">
              Saldo Disponible en Libro Mayor
            </span>
            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
              <ShieldCheck size={12} />
              <span>0% Comisión</span>
            </span>
          </div>

          <div className="flex items-baseline gap-2">
            <span className="text-4xl sm:text-5xl font-extrabold text-emerald-600 tracking-tight tabular-nums">
              {availableFormatted}
            </span>
            <span className="text-xs font-semibold text-text-secondary uppercase">
              ARS (Pesos Reales 1 a 1)
            </span>
          </div>

          <p className="text-xs text-text-secondary mt-2">
            Calculado de forma inmutable desde los asientos contables de la institución educativa.
          </p>
        </div>

        {/* Right: Sub-metrics and Withdrawal Action */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
          <div className="flex items-center gap-6 divide-x divide-slate-200">
            <div>
              <span className="text-[11px] font-semibold text-text-secondary block">
                Total Recaudado en Ventas
              </span>
              <span className="text-base font-extrabold text-text-primary tabular-nums">
                {totalSalesFormatted}
              </span>
            </div>

            <div className="pl-6">
              <span className="text-[11px] font-semibold text-text-secondary block">
                Total Retirado a Mercado Pago
              </span>
              <span className="text-base font-extrabold text-text-primary tabular-nums">
                {totalWithdrawnFormatted}
              </span>
            </div>
          </div>

          <Button
            size="lg"
            variant="primary"
            onClick={onRequestWithdrawal}
            disabled={!canWithdraw || isLoading}
            icon={<ArrowUpRight size={18} />}
            className="w-full sm:w-auto shadow-md"
          >
            Solicitar Retiro a Mercado Pago
          </Button>
        </div>
      </div>
    </Surface>
  );
};
