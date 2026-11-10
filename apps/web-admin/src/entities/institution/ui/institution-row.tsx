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
    <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 sm:p-5 border-b border-slate-100 hover:bg-slate-50/50 transition-colors gap-4">
      {/* 1. School Identity (Icon + Name + CUIT) */}
      <div className="flex items-center gap-4 min-w-[260px]">
        <div className="w-12 h-12 rounded-2xl bg-brand-soft text-brand-dark flex items-center justify-center flex-shrink-0">
          <School size={22} />
        </div>
        <div>
          <h3 className="font-bold text-text-primary text-base leading-tight">
            {item?.name || 'Institución Educativa'}
          </h3>
          <p className="text-xs text-text-secondary mt-0.5">
            CUIT {item?.cuit || '-'} • {item?.address || '-'}
          </p>
        </div>
      </div>

      {/* 2. Status & Plan Badges */}
      <div className="flex items-center gap-2 flex-wrap">
        <Pill
          variant={item?.status === 'ACTIVE' ? 'active' : 'suspended'}
          icon={
            item?.status === 'ACTIVE' ? (
              <CheckCircle2 size={13} />
            ) : (
              <AlertCircle size={13} />
            )
          }
          label={item?.status === 'ACTIVE' ? 'Activo' : 'Suspendido'}
        />
        <Pill
          variant="plan"
          label={
            isMonthlyFixed
              ? 'Abono Mensual Fijo'
              : 'Por Alumno Activo'
          }
        />
      </div>

      {/* 3. Metric & Financial Stats + Action */}
      <div className="flex items-center justify-between sm:justify-end gap-6">
        <div className="text-right">
          <div className="font-extrabold text-text-primary text-base tabular-nums">
            {activeStudentsCount}{' '}
            <span className="text-xs font-normal text-text-secondary">
              alumnos activos
            </span>
          </div>
          <div className="text-xs text-emerald-600 font-semibold tabular-nums mt-0.5">
            Est. {estimatedBilling}
            <span className="text-slate-400 font-normal"> / mes</span>
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
