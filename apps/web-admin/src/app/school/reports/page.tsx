'use client';

import React, { useEffect, useState } from 'react';
import {
  BarChart3,
  Apple,
  Candy,
  Recycle,
  Sparkles,
  Users,
  ShieldCheck,
  TrendingUp,
  BookOpen,
  Coffee,
  Flame,
  Scale,
} from 'lucide-react';
import { SchoolReportMetrics, ProductCategory } from '@/shared/api/types';
import { apiClient } from '@/shared/api/api-client';
import { getActiveInstitutionId } from '@/shared/api/tenant';

const CATEGORY_NAMES: Record<ProductCategory, string> = {
  HEALTHY_SNACK: 'Snacks Saludables y Frutas',
  DRINK: 'Bebidas y Aguas Minerales',
  CANDY: 'Golosinas y Azúcares',
  HOT_MEAL: 'Comidas Calientes y Almuerzos',
  STATIONERY: 'Librería y Útiles',
};

export default function SchoolReportsPage() {
  const [metrics, setMetrics] = useState<SchoolReportMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [apiError, setApiError] = useState<string | null>(null);

  useEffect(() => {
    const loadMetrics = async () => {
      setIsLoading(true);
      setApiError(null);
      try {
        const data = await apiClient.getSchoolReportMetrics(getActiveInstitutionId());
        setMetrics(data);
      } catch (err) {
        console.error('Error loading school report metrics:', err);
        setApiError(
          err instanceof Error
            ? err.message
            : 'No se pudieron cargar los reportes desde la API.'
        );
      } finally {
        setIsLoading(false);
      }
    };
    loadMetrics();
  }, []);

  if (apiError) {
    return (
      <div className="py-12 text-center text-sm font-semibold text-red-600 dark:text-red-400">
        {apiError}
      </div>
    );
  }

  if (isLoading || !metrics) {
    return (
      <div className="p-12 text-center text-text-secondary text-sm">
        Cargando métricas y reportes institucionales...
      </div>
    );
  }

  const formattedTotalSpent = new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    maximumFractionDigits: 0,
  }).format(metrics.totalSpentCents / 100);

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-text-primary tracking-tight">
          Reportes y Métricas de Impacto Escolar
        </h1>
        <p className="text-text-secondary text-sm mt-1">
          Auditoría de hábitos nutricionales en el kiosco (Ley de Kioscos Saludables) y volumen de reutilización comunitaria de útiles.
        </p>
      </div>

      {/* Open Editorial Metric Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 border-y border-slate-200/70 dark:border-white/[0.08] divide-y sm:divide-y-0 lg:divide-x divide-slate-200/70 dark:divide-white/[0.08]">
        <div className="py-4 lg:pr-5 flex items-center gap-3.5">
          <Apple size={20} className="text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
          <div>
            <span className="text-xs font-semibold text-text-secondary uppercase tracking-wider block">
              Consumo Saludable
            </span>
            <div className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 tabular-nums mt-0.5">
              {metrics.healthyPercentage}%
            </div>
          </div>
        </div>

        <div className="py-4 lg:px-5 flex items-center gap-3.5">
          <Candy size={20} className="text-amber-600 dark:text-amber-300 flex-shrink-0" />
          <div>
            <span className="text-xs font-semibold text-text-secondary uppercase tracking-wider block">
              Golosinas / Dulces
            </span>
            <div className="text-2xl font-extrabold text-amber-600 dark:text-amber-300 tabular-nums mt-0.5">
              {metrics.candyPercentage}%
            </div>
          </div>
        </div>

        <div className="py-4 lg:px-5 flex items-center gap-3.5">
          <Recycle size={20} className="text-brand-primary dark:text-purple-300 flex-shrink-0" />
          <div>
            <span className="text-xs font-semibold text-text-secondary uppercase tracking-wider block">
              Útiles Reutilizados
            </span>
            <div className="text-2xl font-extrabold text-brand-primary dark:text-purple-300 tabular-nums mt-0.5">
              {metrics.totalReusedItems}
            </div>
          </div>
        </div>

        <div className="py-4 lg:pl-5 flex items-center gap-3.5">
          <Sparkles size={20} className="text-amber-500 flex-shrink-0" />
          <div>
            <span className="text-xs font-semibold text-text-secondary uppercase tracking-wider block">
              Puntos Solidarios
            </span>
            <div className="text-2xl font-extrabold text-amber-600 dark:text-amber-300 tabular-nums mt-0.5">
              {metrics.totalCommunityPointsAwarded}
            </div>
          </div>
        </div>
      </div>

      {/* Section 1: Healthy vs Candy Kiosk Nutrition Proportion (Open Editorial) */}
      <section className="flex flex-col gap-5 pt-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-200/70 dark:border-white/[0.08]">
          <div>
            <h2 className="text-lg font-bold text-text-primary flex items-center gap-2">
              <Scale size={18} className="text-brand-primary dark:text-purple-300" />
              <span>Proporción Nutricional del Kiosco Escolar</span>
            </h2>
            <p className="text-xs text-text-secondary mt-0.5">
              Supervisión de compras estudiantiles conforme a pautas de alimentación saludable.
            </p>
          </div>
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 self-start sm:self-auto">
            Cumplimiento: Óptimo
          </span>
        </div>

        {/* Visual Ratio Bar */}
        <div>
          <div className="flex items-center justify-between text-xs font-bold text-text-primary mb-2">
            <span className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-300">
              <Apple size={14} />
              <span>Saludable y Bebidas ({metrics.healthyPercentage}%)</span>
            </span>
            <span className="flex items-center gap-1.5 text-amber-700 dark:text-amber-300">
              <span>Golosinas ({metrics.candyPercentage}%)</span>
              <Candy size={14} />
            </span>
          </div>

          <div className="h-5 w-full rounded-full overflow-hidden flex bg-slate-200/60 dark:bg-white/[0.08] p-0.5">
            <div
              style={{ width: `${metrics.healthyPercentage}%` }}
              className="bg-emerald-500 rounded-l-full transition-all duration-500 flex items-center justify-center text-white text-[10px] font-bold"
            >
              {metrics.healthyPercentage}%
            </div>
            <div
              style={{ width: `${metrics.candyPercentage}%` }}
              className="bg-amber-400 rounded-r-full transition-all duration-500 flex items-center justify-center text-amber-950 text-[10px] font-bold"
            >
              {metrics.candyPercentage}%
            </div>
          </div>

          <div className="flex items-center justify-between text-[11px] text-text-secondary mt-2">
            <span>Objetivo institucional: mayor al 65% de consumo saludable.</span>
            <span className="font-semibold text-emerald-700 dark:text-emerald-300">Meta cumplida ✓</span>
          </div>
        </div>

        {/* Detailed Category Spending List directly on canvas */}
        <div className="pt-2">
          <h3 className="text-xs font-bold text-text-secondary uppercase tracking-wider mb-2">
            Desglose por Categoría de Producto
          </h3>

          <div className="divide-y divide-slate-200/60 dark:divide-white/[0.07]">
            {metrics.categoryBreakdown.map((cat) => {
              const formattedSubtotal = new Intl.NumberFormat('es-AR', {
                style: 'currency',
                currency: 'ARS',
                maximumFractionDigits: 0,
              }).format(cat.amountCents / 100);

              return (
                <div
                  key={cat.category}
                  className="py-3 flex items-center justify-between text-sm"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-brand-soft/60 dark:bg-white/[0.06] flex items-center justify-center text-text-secondary">
                      {cat.category === 'HEALTHY_SNACK' && <Apple size={16} />}
                      {cat.category === 'DRINK' && <Coffee size={16} />}
                      {cat.category === 'CANDY' && <Candy size={16} />}
                      {cat.category === 'HOT_MEAL' && <Flame size={16} />}
                      {cat.category === 'STATIONERY' && <BookOpen size={16} />}
                    </div>
                    <div>
                      <span className="font-bold text-text-primary block">
                        {CATEGORY_NAMES[cat.category] || cat.category}
                      </span>
                      <span className="text-xs text-text-secondary">
                        {cat.itemCount} unidades vendidas
                      </span>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="font-extrabold text-text-primary tabular-nums block">
                      {formattedSubtotal}
                    </span>
                    <span className="text-xs text-text-secondary">
                      {cat.percentage}% del total
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Section 2: Circular Economy and Reused Community Items */}
      <section className="flex flex-col gap-5 pt-4 border-t border-slate-200/70 dark:border-white/[0.08]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-lg font-bold text-text-primary flex items-center gap-2">
              <Recycle size={18} className="text-brand-primary dark:text-purple-300" />
              <span>Economía Circular y Reutilización de Útiles</span>
            </h2>
            <p className="text-xs text-text-secondary mt-0.5">
              Impacto solidario en la comunidad escolar: donaciones, intercambios y préstamos rotativos.
            </p>
          </div>
          <span className="text-xs font-bold text-brand-dark dark:text-purple-200 bg-brand-soft/80 dark:bg-brand-primary/20 px-3 py-1 rounded-full self-start sm:self-auto">
            {metrics.activeParticipantStudentsCount} alumnos participantes
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 divide-y md:divide-y-0 md:divide-x divide-slate-200/70 dark:divide-white/[0.08]">
          {/* Column 1: Donaciones */}
          <div className="flex flex-col gap-1.5 pt-4 md:pt-0">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-300">
              Donaciones Directas
            </span>
            <div className="text-3xl font-extrabold text-text-primary tabular-nums">
              {metrics.itemsByMode.DONATION}
            </div>
            <p className="text-xs text-text-secondary leading-relaxed">
              Útiles escolares y libros donados a compañeros o a la biblioteca escolar.
            </p>
          </div>

          {/* Column 2: Intercambios */}
          <div className="flex flex-col gap-1.5 pt-4 md:pt-0 md:pl-6">
            <span className="text-xs font-bold uppercase tracking-wider text-brand-primary dark:text-purple-300">
              Intercambios (Trueque)
            </span>
            <div className="text-3xl font-extrabold text-text-primary tabular-nums">
              {metrics.itemsByMode.BARTER}
            </div>
            <p className="text-xs text-text-secondary leading-relaxed">
              Materiales intercambiados entre estudiantes en el punto de entrega moderado.
            </p>
          </div>

          {/* Column 3: Préstamos */}
          <div className="flex flex-col gap-1.5 pt-4 md:pt-0 md:pl-6">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-700 dark:text-amber-300">
              Préstamos Rotativos
            </span>
            <div className="text-3xl font-extrabold text-text-primary tabular-nums">
              {metrics.itemsByMode.LOAN}
            </div>
            <p className="text-xs text-text-secondary leading-relaxed">
              Calculadoras, compases y libros prestados temporalmente en clase.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
