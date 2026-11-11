'use client';

import React from 'react';
import { School, CheckCircle2, AlertCircle } from 'lucide-react';
import { Institution } from '@/shared/api/types';
import { Pill } from '@/shared/ui/Pill';
import { Button } from '@/shared/ui/Button';

interface InstitutionRowProps {
  institution: Institution;
  onToggleStatus?: (id: string, currentStatus: Institution['status']) => void;
  isUpdating?: boolean;
}

/**
 * Institution row component strictly adhering to AGENTS.md:
 * 1. Flat row layout — NO card-inside-card.
 * 2. Maximum 3 key data points visible at a glance:
 *    - Col 1: Icon + School Name + CUIT
 *    - Col 2: Billing Plan + Status Badge
 *    - Col 3: Highlighted metric (Active Students + Monthly Fee)
 */
export const InstitutionRow: React.FC<InstitutionRowProps> = ({
  institution,
  onToggleStatus,
  isUpdating = false,
}) => {
  const item = (institution as any)?.institution || institution;
  const isMonthlyFixed = item?.billingPlanType === 'FIXED_MONTHLY';
  const monthlyFeeCents = item?.monthlyFeeCents || 0;
  const activeStudentsCount = item?.activeStudentsCount || 0;

  const feeFormatted = new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    maximumFractionDigits: 0,
  }).format(monthlyFeeCents / 100);

  const estimatedBilling = isMonthlyFixed
    ? feeFormatted
    : new Intl.NumberFormat('es-AR', {
        style: 'currency',
        currency: 'ARS',
        maximumFractionDigits: 0,
      }).format((monthlyFeeCents * activeStudentsCount) / 100);

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between px-5 py-4 border-b border-slate-200/60 dark:border-white/[0.07] last:border-b-0 hover:bg-white/60 dark:hover:bg-white/[0.04] transition-colors gap-4">
      {/* 1. School Identity */}
      <div className="flex items-center gap-3.5 min-w-[260px]">
        <div className="w-11 h-11 rounded-2xl bg-brand-soft/80 dark:bg-brand-primary/20 text-brand-dark dark:text-purple-200 flex items-center justify-center flex-shrink-0">
          <School size={20} />
        </div>
        <div className="min-w-0">
          <h3 className="font-bold text-text-primary text-sm sm:text-base leading-tight truncate">
            {item?.name || 'Institución Educativa'}
          </h3>
          <p className="text-xs text-text-secondary mt-0.5 truncate" title={`CUIT ${item?.cuit || '-'}`}>
            {item?.address || `CUIT ${item?.cuit || '-'}`}
          </p>
        </div>
      </div>

      {/* 2. Status & Plan */}
      <div className="flex items-center gap-2 flex-wrap">
        <Pill
          variant={item?.status === 'ACTIVE' ? 'active' : 'suspended'}
          icon={
            item?.status === 'ACTIVE' ? (
              <CheckCircle2 size={12} />
            ) : (
              <AlertCircle size={12} />
            )
          }
          label={item?.status === 'ACTIVE' ? 'Activo' : 'Suspendido'}
        />
        <Pill
          variant="plan"
          label={isMonthlyFixed ? 'Mensual Fijo' : 'Por Alumno'}
        />
      </div>

      {/* 3. Metric & Action */}
      <div className="flex items-center justify-between sm:justify-end gap-5">
        <div className="text-right tabular-nums">
          <div className="font-extrabold text-text-primary text-sm sm:text-base">
            {activeStudentsCount}{' '}
            <span className="text-xs font-normal text-text-secondary">
              alumnos
            </span>
          </div>
          <div className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold mt-0.5">
            {estimatedBilling}/mes
          </div>
        </div>

        {onToggleStatus && (
          <Button
            size="sm"
            variant={item?.status === 'ACTIVE' ? 'danger' : 'outline'}
            onClick={() => onToggleStatus(item?.id, item?.status)}
            isLoading={isUpdating}
          >
            {item?.status === 'ACTIVE' ? 'Suspender' : 'Reactivar'}
          </Button>
        )}
      </div>
    </div>
  );
};
