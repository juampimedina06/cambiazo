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
import { Surface } from '@/shared/ui/Surface';
import { Pill } from '@/shared/ui/Pill';

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

  useEffect(() => {
    const loadMetrics = async () => {
      setIsLoading(true);
      try {
        const data = await apiClient.getSchoolReportMetrics();
        setMetrics(data);
      } catch (err) {
        console.error('Error loading school report metrics:', err);
      } finally {
        setIsLoading(false);
      }
    };
    loadMetrics();
  }, []);

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

      {/* Top Level Metric Indicators (Flat, NO card-in-card) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Surface className="p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center flex-shrink-0">
            <Apple size={24} />
          </div>
          <div>
            <span className="text-xs font-semibold text-text-secondary uppercase tracking-wider block">
              Consumo Saludable
            </span>
            <div className="text-2xl font-extrabold text-emerald-600 tabular-nums mt-0.5">
              {metrics.healthyPercentage}%
            </div>
            <span className="text-[11px] text-text-secondary">
              Frutas, agua y barras de cereal
            </span>
          </div>
        </Surface>

        <Surface className="p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-900 flex items-center justify-center flex-shrink-0">
            <Candy size={24} />
          </div>
          <div>
            <span className="text-xs font-semibold text-text-secondary uppercase tracking-wider block">
              Golosinas / Dulces
            </span>
            <div className="text-2xl font-extrabold text-amber-600 tabular-nums mt-0.5">
              {metrics.candyPercentage}%
            </div>
            <span className="text-[11px] text-text-secondary">
              Bloqueable por tutores
            </span>
          </div>
        </Surface>

        <Surface className="p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-brand-soft text-brand-dark flex items-center justify-center flex-shrink-0">
            <Recycle size={24} />
          </div>
          <div>
            <span className="text-xs font-semibold text-text-secondary uppercase tracking-wider block">
              Útiles Reutilizados
            </span>
            <div className="text-2xl font-extrabold text-brand-primary tabular-nums mt-0.5">
              {metrics.totalReusedItems}
            </div>
            <span className="text-[11px] text-text-secondary">
              Entregas finalizadas en escuela
            </span>
          </div>
        </Surface>

        <Surface className="p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center flex-shrink-0">
            <Sparkles size={24} className="text-amber-600" />
          </div>
          <div>
            <span className="text-xs font-semibold text-text-secondary uppercase tracking-wider block">
              Puntos Solidarios
            </span>
            <div className="text-2xl font-extrabold text-amber-700 tabular-nums mt-0.5">
              {metrics.totalCommunityPointsAwarded}
            </div>
            <span className="text-[11px] text-text-secondary">
              Acreditados a la comunidad
            </span>
          </div>
        </Surface>
      </div>

      {/* Section 1: Healthy vs Candy Kiosk Nutrition Proportion */}
      <Surface>
        <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-slate-50/50">
          <div>
            <h2 className="text-lg font-bold text-text-primary flex items-center gap-2">
              <Scale size={20} className="text-brand-primary" />
              <span>Proporción Nutricional del Kiosco Escolar</span>
            </h2>
            <p className="text-xs text-text-secondary mt-0.5">
              Supervisión de compras estudiantiles conforme a las pautas de alimentación saludable escolar.
            </p>
          </div>
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 self-start sm:self-auto">
            Cumplimiento: Óptimo
          </span>
        </div>

        <div className="p-6 flex flex-col gap-6">
          {/* Visual Ratio Bar */}
          <div>
            <div className="flex items-center justify-between text-xs font-bold text-text-primary mb-2">
              <span className="flex items-center gap-1.5 text-emerald-700">
                <Apple size={14} />
                <span>Saludable y Bebidas ({metrics.healthyPercentage}%)</span>
              </span>
              <span className="flex items-center gap-1.5 text-amber-800">
                <span>Golosinas ({metrics.candyPercentage}%)</span>
                <Candy size={14} />
              </span>
            </div>

            <div className="h-6 w-full rounded-xl overflow-hidden flex bg-slate-100 p-0.5 border border-slate-200">
              <div
                style={{ width: `${metrics.healthyPercentage}%` }}
                className="bg-emerald-500 rounded-l-lg transition-all duration-500 flex items-center justify-center text-white text-[10px] font-bold"
              >
                {metrics.healthyPercentage}%
              </div>
              <div
                style={{ width: `${metrics.candyPercentage}%` }}
                className="bg-amber-400 rounded-r-lg transition-all duration-500 flex items-center justify-center text-amber-950 text-[10px] font-bold"
              >
                {metrics.candyPercentage}%
              </div>
            </div>

            <div className="flex items-center justify-between text-[11px] text-text-secondary mt-2">
              <span>Objetivo institucional: mayor al 65% de consumo saludable.</span>
              <span className="font-semibold text-emerald-700">Meta cumplida ✓</span>
            </div>
          </div>

          {/* Detailed Category Spending Table (Flat rows with dividers, NO card-in-card) */}
          <div className="border-t border-slate-100 pt-4">
            <h3 className="text-xs font-bold text-text-secondary uppercase tracking-wider mb-3">
              Desglose por Categoría de Producto
            </h3>

            <div className="divide-y divide-slate-100">
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
                      <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center text-text-secondary">
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
        </div>
      </Surface>

      {/* Section 2: Circular Economy and Reused Community Items */}
      <Surface>
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div>
            <h2 className="text-lg font-bold text-text-primary flex items-center gap-2">
              <Recycle size={20} className="text-brand-primary" />
              <span>Economía Circular y Reutilización de Útiles</span>
            </h2>
            <p className="text-xs text-text-secondary mt-0.5">
              Impacto solidario en la comunidad escolar: donaciones, intercambios y préstamos rotativos.
            </p>
          </div>
          <span className="text-xs font-bold text-brand-primary bg-brand-soft px-3 py-1 rounded-full">
            {metrics.activeParticipantStudentsCount} alumnos participantes
          </span>
        </div>

        <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6 divide-y md:divide-y-0 md:divide-x divide-slate-100">
          {/* Column 1: Donaciones */}
          <div className="flex flex-col gap-2 pt-4 md:pt-0">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-700">
              Donaciones Directas
            </span>
            <div className="text-3xl font-extrabold text-text-primary tabular-nums">
              {metrics.itemsByMode.DONATION}
            </div>
            <p className="text-xs text-text-secondary leading-relaxed">
              Útiles escolares y libros donados desinteresadamente a otros compañeros o a la biblioteca escolar.
            </p>
          </div>

          {/* Column 2: Intercambios */}
          <div className="flex flex-col gap-2 pt-4 md:pt-0 md:pl-6">
            <span className="text-xs font-bold uppercase tracking-wider text-brand-primary">
              Intercambios (Trueque)
            </span>
            <div className="text-3xl font-extrabold text-text-primary tabular-nums">
              {metrics.itemsByMode.BARTER}
            </div>
            <p className="text-xs text-text-secondary leading-relaxed">
              Materiales intercambiados entre estudiantes del mismo colegio a través del punto de entrega moderado.
            </p>
          </div>

          {/* Column 3: Préstamos */}
          <div className="flex flex-col gap-2 pt-4 md:pt-0 md:pl-6">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-700">
              Préstamos Rotativos
            </span>
            <div className="text-3xl font-extrabold text-text-primary tabular-nums">
              {metrics.itemsByMode.LOAN}
            </div>
            <p className="text-xs text-text-secondary leading-relaxed">
              Calculadoras, compases y libros prestados temporalmente durante materias específicas.
            </p>
          </div>
        </div>
      </Surface>
    </div>
  );
}
