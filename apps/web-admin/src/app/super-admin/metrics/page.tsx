'use client';

import React, { useEffect, useState } from 'react';
import {
  DollarSign,
  Users,
  Store,
  Building2,
  Download,
} from 'lucide-react';
import { SuperAdminGlobalMetrics } from '@/shared/api/types';
import { apiClient } from '@/shared/api/api-client';
import { Button } from '@/shared/ui/Button';
import { Pill } from '@/shared/ui/Pill';

export default function SuperAdminMetricsPage() {
  const [metrics, setMetrics] = useState<SuperAdminGlobalMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [apiError, setApiError] = useState<string | null>(null);
  const [planFilter, setPlanFilter] = useState<'ALL' | 'FIXED_MONTHLY' | 'PER_ACTIVE_STUDENT'>('ALL');

  const loadMetrics = async () => {
    setIsLoading(true);
    setApiError(null);
    try {
      const data = await apiClient.getSuperAdminMetrics();
      setMetrics(data);
    } catch (err) {
      console.error('Error loading super admin metrics:', err);
      setApiError(
        err instanceof Error
          ? err.message
          : 'No se pudieron cargar las métricas desde la API.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadMetrics();
  }, []);

  if (apiError) {
    return (
      <div className="py-12 text-center flex flex-col items-center gap-3">
        <p className="text-sm font-semibold text-red-600 dark:text-red-400">
          {apiError}
        </p>
        <Button size="sm" variant="outline" onClick={loadMetrics}>
          Reintentar
        </Button>
      </div>
    );
  }

  if (isLoading || !metrics) {
    return (
      <div className="py-12 text-center text-text-secondary text-sm">
        Cargando tablero global de métricas y liquidación...
      </div>
    );
  }

  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      maximumFractionDigits: 0,
    }).format(cents / 100);
  };

  const filteredBilling = metrics.institutionsBilling.filter((row) => {
    if (planFilter === 'ALL') return true;
    return row.billingPlanType === planFilter;
  });

  const handleExportCsv = () => {
    const header = [
      'Institucion',
      'CUIT',
      'Estado',
      'Plan',
      'Tarifa_ARS',
      'Alumnos_Activos',
      'Volumen_Kiosco_ARS',
      'Abono_Liquidado_ARS',
    ];
    const rows = filteredBilling.map((row) => [
      `"${row.institutionName.replace(/"/g, '""')}"`,
      row.cuit,
      row.status,
      row.billingPlanType,
      Math.round(row.monthlyRateCents / 100),
      row.activeStudentsCount,
      Math.round(row.kioskVolumeCents / 100),
      row.status === 'ACTIVE' ? Math.round(row.calculatedMonthlyFeeCents / 100) : 0,
    ]);
    const csv = [header.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'liquidacion-cambiazo.csv';
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Page Title & Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-text-primary tracking-tight">
            Métricas Globales y Liquidación de Abonos
          </h1>
          <p className="text-text-secondary text-sm mt-1">
            Supervisión cross-tenant del volumen transaccionado en kioscos y cálculo automatizado del abono mensual por institución según plan contratado.
          </p>
        </div>

        <Button
          size="md"
          variant="secondary"
          onClick={handleExportCsv}
          icon={<Download size={16} />}
        >
          Exportar Liquidación (CSV)
        </Button>
      </div>

      {/* Cross-Tenant KPIs (Open Editorial Strip) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 border-y border-slate-200/70 dark:border-white/[0.08] divide-y sm:divide-y-0 lg:divide-x divide-slate-200/70 dark:divide-white/[0.08]">
        <div className="py-4 lg:pr-5 flex items-center gap-3.5">
          <DollarSign size={20} className="text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
          <div>
            <span className="text-xs font-semibold text-text-secondary uppercase tracking-wider block">
              Facturación Mensual
            </span>
            <div className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 tabular-nums mt-0.5">
              {formatCurrency(metrics.totalMonthlyBillingCents)}
            </div>
          </div>
        </div>

        <div className="py-4 lg:px-5 flex items-center gap-3.5">
          <Store size={20} className="text-brand-primary dark:text-purple-300 flex-shrink-0" />
          <div>
            <span className="text-xs font-semibold text-text-secondary uppercase tracking-wider block">
              Volumen Kioscos
            </span>
            <div className="text-2xl font-extrabold text-brand-primary dark:text-purple-300 tabular-nums mt-0.5">
              {formatCurrency(metrics.totalKioskVolumeCents)}
            </div>
          </div>
        </div>

        <div className="py-4 lg:px-5 flex items-center gap-3.5">
          <Users size={20} className="text-amber-600 dark:text-amber-300 flex-shrink-0" />
          <div>
            <span className="text-xs font-semibold text-text-secondary uppercase tracking-wider block">
              Alumnos Activos
            </span>
            <div className="text-2xl font-extrabold text-text-primary tabular-nums mt-0.5">
              {metrics.totalActiveStudents.toLocaleString('es-AR')}
            </div>
          </div>
        </div>

        <div className="py-4 lg:pl-5 flex items-center gap-3.5">
          <Building2 size={20} className="text-brand-primary dark:text-purple-300 flex-shrink-0" />
          <div>
            <span className="text-xs font-semibold text-text-secondary uppercase tracking-wider block">
              Colegios Activos
            </span>
            <div className="text-2xl font-extrabold text-text-primary tabular-nums mt-0.5">
              {metrics.activeSchoolsCount}{' '}
              <span className="text-xs text-text-secondary font-normal">
                de {metrics.totalSchoolsCount}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Plan Filter Row */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-1 liquid-glass-subtle p-1 rounded-full">
          {(['ALL', 'FIXED_MONTHLY', 'PER_ACTIVE_STUDENT'] as const).map((plan) => (
            <button
              key={plan}
              onClick={() => setPlanFilter(plan)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all ${
                planFilter === plan
                  ? 'bg-brand-primary text-white shadow-sm'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              {plan === 'ALL'
                ? 'Todos los Planes'
                : plan === 'FIXED_MONTHLY'
                ? 'Abono Fijo Mensual'
                : 'Por Alumno Activo'}
            </button>
          ))}
        </div>

        <span className="text-xs text-text-secondary font-medium">
          Plan Fijo = Cuota fija · Plan Alumno = Tarifa × Alumnos Activos
        </span>
      </div>

      {/* Open Billing List directly on canvas */}
      <section className="border-t border-slate-200/70 dark:border-white/[0.08]">
        <div className="py-3.5 border-b border-slate-200/60 dark:border-white/[0.07] flex justify-between items-center">
          <span className="text-xs font-bold text-text-secondary uppercase tracking-wider">
            Liquidación Mensual ({filteredBilling.length})
          </span>
          <span className="text-xs text-text-muted font-medium">
            Pesos Argentinos (ARS)
          </span>
        </div>

        <div className="divide-y divide-slate-200/60 dark:divide-white/[0.07]">
          {filteredBilling.map((row) => (
            <div
              key={row.institutionId}
              className="py-4 px-2 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-white/40 dark:hover:bg-white/[0.03] transition-colors"
            >
              {/* 1. School Identity */}
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-brand-soft/80 dark:bg-brand-primary/20 text-brand-dark dark:text-purple-200 flex items-center justify-center flex-shrink-0">
                  <Building2 size={18} />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-bold text-sm sm:text-base text-text-primary leading-tight truncate">
                      {row.institutionName}
                    </h3>
                    {row.status === 'ACTIVE' ? (
                      <Pill label="Activo" variant="active" />
                    ) : (
                      <Pill label="Suspendido" variant="suspended" />
                    )}
                  </div>
                  <span className="text-xs text-text-secondary mt-0.5 block">
                    CUIT {row.cuit}
                  </span>
                </div>
              </div>

              {/* 2. Plan Summary */}
              <div className="flex items-center gap-2.5 flex-wrap">
                {row.billingPlanType === 'FIXED_MONTHLY' ? (
                  <Pill label="Abono Fijo" variant="plan" />
                ) : (
                  <Pill label="Por Alumno" variant="points" />
                )}
                <span className="text-xs text-text-secondary tabular-nums">
                  {row.billingPlanType === 'FIXED_MONTHLY'
                    ? formatCurrency(row.monthlyRateCents)
                    : `${formatCurrency(row.monthlyRateCents)} × ${row.activeStudentsCount} al.`}
                </span>
              </div>

              {/* 3. Monthly Invoice Amount */}
              <div className="sm:text-right flex-shrink-0">
                <div className="text-lg font-extrabold text-emerald-600 dark:text-emerald-400 tabular-nums">
                  {row.status === 'ACTIVE'
                    ? formatCurrency(row.calculatedMonthlyFeeCents)
                    : '$ 0'}
                </div>
                <span className="text-[11px] text-text-muted">
                  Kiosco: {formatCurrency(row.kioskVolumeCents)}
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
