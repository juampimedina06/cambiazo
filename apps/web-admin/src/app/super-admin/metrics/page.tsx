'use client';

import React, { useEffect, useState } from 'react';
import {
  DollarSign,
  Users,
  Store,
  Building2,
  Receipt,
  Download,
  Calendar,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import { SuperAdminGlobalMetrics, InstitutionBillingRow } from '@/shared/api/types';
import { apiClient } from '@/shared/api/api-client';
import { Surface } from '@/shared/ui/Surface';
import { Button } from '@/shared/ui/Button';
import { Pill } from '@/shared/ui/Pill';

export default function SuperAdminMetricsPage() {
  const [metrics, setMetrics] = useState<SuperAdminGlobalMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [planFilter, setPlanFilter] = useState<'ALL' | 'FIXED_MONTHLY' | 'PER_ACTIVE_STUDENT'>('ALL');

  useEffect(() => {
    const loadMetrics = async () => {
      setIsLoading(true);
      try {
        const data = await apiClient.getSuperAdminMetrics();
        setMetrics(data);
      } catch (err) {
        console.error('Error loading super admin metrics:', err);
      } finally {
        setIsLoading(false);
      }
    };
    loadMetrics();
  }, []);

  if (isLoading || !metrics) {
    return (
      <div className="p-12 text-center text-text-secondary text-sm">
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
          onClick={() => alert('Simulación de exportación contable generada para facturación AFIP.')}
          icon={<Download size={16} />}
        >
          Exportar Liquidación (CSV)
        </Button>
      </div>

      {/* Cross-Tenant KPIs (Flat on canvas, NO card-in-card) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Surface className="p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center flex-shrink-0">
            <DollarSign size={24} />
          </div>
          <div>
            <span className="text-xs font-semibold text-text-secondary uppercase tracking-wider block">
              Facturación Mensual
            </span>
            <div className="text-2xl font-extrabold text-emerald-600 tabular-nums mt-0.5">
              {formatCurrency(metrics.totalMonthlyBillingCents)}
            </div>
            <span className="text-[11px] text-text-secondary">
              Abonos a cobrar este mes
            </span>
          </div>
        </Surface>

        <Surface className="p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-brand-soft text-brand-dark flex items-center justify-center flex-shrink-0">
            <Store size={24} />
          </div>
          <div>
            <span className="text-xs font-semibold text-text-secondary uppercase tracking-wider block">
              Volumen Kioscos
            </span>
            <div className="text-2xl font-extrabold text-brand-primary tabular-nums mt-0.5">
              {formatCurrency(metrics.totalKioskVolumeCents)}
            </div>
            <span className="text-[11px] text-text-secondary">
              0% comisión retenida al kiosco
            </span>
          </div>
        </Surface>

        <Surface className="p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center flex-shrink-0">
            <Users size={24} />
          </div>
          <div>
            <span className="text-xs font-semibold text-text-secondary uppercase tracking-wider block">
              Alumnos Activos
            </span>
            <div className="text-2xl font-extrabold text-text-primary tabular-nums mt-0.5">
              {metrics.totalActiveStudents.toLocaleString('es-AR')}
            </div>
            <span className="text-[11px] text-text-secondary">
              Entre todos los colegios
            </span>
          </div>
        </Surface>

        <Surface className="p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-purple-100 text-brand-primary flex items-center justify-center font-bold text-sm flex-shrink-0">
            <Building2 size={24} />
          </div>
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
            <span className="text-[11px] text-text-secondary">
              Tenants adheridos a la red
            </span>
          </div>
        </Surface>
      </div>

      {/* Plan Filter Row */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2">
          {(['ALL', 'FIXED_MONTHLY', 'PER_ACTIVE_STUDENT'] as const).map((plan) => (
            <button
              key={plan}
              onClick={() => setPlanFilter(plan)}
              className={`px-3 py-2 rounded-xl text-xs font-bold transition-colors ${
                planFilter === plan
                  ? 'bg-brand-primary text-white shadow-sm'
                  : 'bg-surface text-text-secondary hover:bg-slate-100 border border-slate-200'
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
          Cálculo dinámico: Plan Fijo = Cuota fija | Plan Alumno = Tarifa × Alumnos Activos
        </span>
      </div>

      {/* Institutions Billing Table (Surface, NO card-in-card) */}
      <Surface>
        <div className="px-5 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <span className="text-xs font-bold text-text-secondary uppercase tracking-wider">
            Liquidación Mensual por Institución Educativa ({filteredBilling.length})
          </span>
          <span className="text-xs text-text-secondary font-medium">
            Facturación en Pesos Argentinos (ARS)
          </span>
        </div>

        <div className="divide-y divide-slate-100 overflow-x-auto">
          {filteredBilling.map((row) => (
            <div
              key={row.institutionId}
              className="p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 hover:bg-slate-50/60 transition-colors"
            >
              {/* 1. School Identity & CUIT */}
              <div className="flex items-start gap-4 max-w-sm">
                <div className="w-12 h-12 rounded-2xl bg-brand-soft text-brand-dark flex items-center justify-center font-bold text-sm flex-shrink-0">
                  <Building2 size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-base text-text-primary leading-tight">
                    {row.institutionName}
                  </h3>
                  <span className="text-xs text-text-secondary mt-0.5 block">
                    CUIT: {row.cuit}
                  </span>
                  <div className="mt-1">
                    {row.status === 'ACTIVE' ? (
                      <Pill label="Activo" variant="active" />
                    ) : (
                      <Pill label="Suspendido" variant="suspended" />
                    )}
                  </div>
                </div>
              </div>

              {/* 2. Billing Plan & Rate Calculation details */}
              <div className="flex flex-col gap-1 min-w-[200px]">
                <div className="flex items-center gap-2">
                  {row.billingPlanType === 'FIXED_MONTHLY' ? (
                    <Pill label="Abono Fijo Mensual" variant="plan" />
                  ) : (
                    <Pill label="Por Alumno Activo" variant="points" />
                  )}
                </div>

                <div className="text-xs text-text-secondary mt-1">
                  {row.billingPlanType === 'FIXED_MONTHLY' ? (
                    <span>Tarifa fija acordada: <strong>{formatCurrency(row.monthlyRateCents)}</strong></span>
                  ) : (
                    <span>
                      {formatCurrency(row.monthlyRateCents)} × {row.activeStudentsCount} alumnos
                    </span>
                  )}
                </div>

                <span className="text-[11px] text-text-secondary">
                  Volumen Kiosco acumulado: <strong>{formatCurrency(row.kioskVolumeCents)}</strong>
                </span>
              </div>

              {/* 3. Monthly Invoice Amount */}
              <div className="text-right w-full md:w-auto">
                <span className="text-xs font-semibold text-text-secondary uppercase tracking-wider block">
                  Abono Liquidado
                </span>
                <div className="text-xl font-extrabold text-emerald-600 tabular-nums">
                  {row.status === 'ACTIVE' ? formatCurrency(row.calculatedMonthlyFeeCents) : '$ 0 (Suspendido)'}
                </div>
                <span className="text-[11px] text-text-secondary">
                  {row.status === 'ACTIVE' ? 'A facturar este período' : 'Sin cargo por suspensión'}
                </span>
              </div>
            </div>
          ))}
        </div>
      </Surface>
    </div>
  );
}
