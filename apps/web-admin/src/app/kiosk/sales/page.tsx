'use client';

import React, { useEffect, useState } from 'react';
import {
  ShoppingBag,
  DollarSign,
  TrendingUp,
  ShieldCheck,
  RefreshCw,
  Clock,
} from 'lucide-react';
import { KioskSale, CatalogProduct } from '@/shared/api/types';
import { apiClient } from '@/shared/api/api-client';
import { getActiveInstitutionId } from '@/shared/api/tenant';
import { Button } from '@/shared/ui/Button';
import { SaleRow } from '@/entities/sale';
import { PosCheckoutTerminal } from '@/features/pos-terminal';

export default function KioskSalesPage() {
  const [sales, setSales] = useState<KioskSale[]>([]);
  const [products, setProducts] = useState<CatalogProduct[]>([]);
  const [institutionId, setInstitutionId] = useState<string>(() => getActiveInstitutionId());
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const loadData = async (targetId: string = institutionId) => {
    setIsRefreshing(true);
    setApiError(null);
    try {
      const [salesData, productsData] = await Promise.all([
        apiClient.getKioskSales(targetId),
        apiClient.getCatalogProducts(targetId),
      ]);
      setSales(salesData);
      setProducts(productsData);
    } catch (err) {
      console.error('Error loading kiosk sales and catalog:', err);
      setApiError(
        err instanceof Error
          ? err.message
          : 'No se pudo cargar el monitor de ventas.'
      );
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    const activeId = getActiveInstitutionId();
    setInstitutionId(activeId);
    loadData(activeId);
  }, []);

  const handleSaleCompleted = (newSale: KioskSale) => {
    setSales((prev) => [newSale, ...prev]);
    // Refresh products to reflect deducted stock
    apiClient
      .getCatalogProducts(institutionId)
      .then(setProducts)
      .catch(console.error);
  };

  // Metrics
  const totalSalesCount = sales.length;
  const totalAmountCents = sales.reduce((sum, s) => sum + s.totalAmountCents, 0);
  const totalPlatformFeesCents = sales.reduce((sum, s) => sum + s.platformFeeCents, 0); // Always 0!
  const averageTicketCents =
    totalSalesCount > 0 ? Math.round(totalAmountCents / totalSalesCount) : 0;

  const totalFormatted = new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    maximumFractionDigits: 0,
  }).format(totalAmountCents / 100);

  const avgFormatted = new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    maximumFractionDigits: 0,
  }).format(averageTicketCents / 100);

  return (
    <div className="flex flex-col gap-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-text-primary tracking-tight">
            Monitor de Ventas y Caja Web del Kiosco
          </h1>
          <p className="text-text-secondary text-sm mt-1">
            Cobro rápido en recreos escolares por código de 6 dígitos y auditoría en tiempo real con 0% de comisión.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            size="sm"
            variant="outline"
            onClick={() => loadData(institutionId)}
            isLoading={isRefreshing}
            icon={<RefreshCw size={14} className={isRefreshing ? 'animate-spin' : ''} />}
          >
            Actualizar Monitor
          </Button>
        </div>
      </div>

      {/* Open Editorial Metric Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 border-y border-slate-200/70 dark:border-white/[0.08] divide-y sm:divide-y-0 lg:divide-x divide-slate-200/70 dark:divide-white/[0.08]">
        <div className="py-4 lg:pr-5 flex items-center gap-3.5">
          <DollarSign size={20} className="text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
          <div>
            <span className="text-xs font-semibold text-text-secondary uppercase tracking-wider block">
              Recaudación de Hoy
            </span>
            <div className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 tabular-nums mt-0.5">
              {totalFormatted}
            </div>
          </div>
        </div>

        <div className="py-4 lg:px-5 flex items-center gap-3.5">
          <ShoppingBag size={20} className="text-brand-primary dark:text-purple-300 flex-shrink-0" />
          <div>
            <span className="text-xs font-semibold text-text-secondary uppercase tracking-wider block">
              Ventas en Recreos
            </span>
            <div className="text-2xl font-extrabold text-text-primary tabular-nums mt-0.5">
              {totalSalesCount}{' '}
              <span className="text-xs text-text-secondary font-normal">operaciones</span>
            </div>
          </div>
        </div>

        <div className="py-4 lg:px-5 flex items-center gap-3.5">
          <ShieldCheck size={20} className="text-blue-600 dark:text-blue-400 flex-shrink-0" />
          <div>
            <span className="text-xs font-semibold text-text-secondary uppercase tracking-wider block">
              Comisión de Plataforma
            </span>
            <div className="text-2xl font-extrabold text-blue-600 dark:text-blue-400 tabular-nums mt-0.5">
              0%{' '}
              <span className="text-xs text-text-secondary font-normal">($0 ARS)</span>
            </div>
          </div>
        </div>

        <div className="py-4 lg:pl-5 flex items-center gap-3.5">
          <TrendingUp size={20} className="text-brand-primary dark:text-purple-300 flex-shrink-0" />
          <div>
            <span className="text-xs font-semibold text-text-secondary uppercase tracking-wider block">
              Ticket Promedio
            </span>
            <div className="text-2xl font-extrabold text-brand-primary dark:text-purple-300 tabular-nums mt-0.5">
              {avgFormatted}
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid: POS Checkout Terminal (Left) & Real-time Sales Monitor (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: POS Terminal */}
        <div className="lg:col-span-6 xl:col-span-5">
          <PosCheckoutTerminal
            products={products}
            onSaleCompleted={handleSaleCompleted}
            institutionId={institutionId}
          />
        </div>

        {/* Right Column: Real-Time Sales Monitor */}
        <div className="lg:col-span-6 xl:col-span-7 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock size={18} className="text-text-secondary" />
              <h2 className="font-extrabold text-lg text-text-primary">
                Monitor en Vivo de Recreos
              </h2>
            </div>
            <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-500/15 px-2.5 py-1 rounded-full">
              ● En Directo
            </span>
          </div>

          {apiError ? (
            <div className="py-10 text-center flex flex-col items-center gap-3 border-t border-slate-200/70 dark:border-white/[0.08]">
              <p className="text-sm font-semibold text-red-600 dark:text-red-400">
                {apiError}
              </p>
              <Button size="sm" variant="outline" onClick={() => loadData(institutionId)}>
                Reintentar
              </Button>
            </div>
          ) : isLoading ? (
            <div className="py-12 text-center text-text-secondary border-t border-slate-200/70 dark:border-white/[0.08]">
              <div className="inline-block w-8 h-8 border-2 border-brand-primary border-t-transparent rounded-full animate-spin mb-3" />
              <p className="text-sm">Cargando monitor de ventas...</p>
            </div>
          ) : sales.length === 0 ? (
            <div className="py-12 text-center text-text-secondary border-t border-slate-200/70 dark:border-white/[0.08]">
              <ShoppingBag size={40} className="mx-auto text-slate-300 dark:text-slate-600 mb-3" />
              <h3 className="font-bold text-text-primary text-base">
                Sin ventas registradas hoy
              </h3>
              <p className="text-xs text-text-secondary mt-1 max-w-sm mx-auto">
                Los cobros realizados en la terminal web o con QR aparecerán inmediatamente aquí con 0% de comisión.
              </p>
            </div>
          ) : (
            <section className="border-t border-slate-200/70 dark:border-white/[0.08]">
              <div className="py-3.5 border-b border-slate-200/60 dark:border-white/[0.07] flex items-center justify-between text-xs font-bold text-text-secondary uppercase tracking-wider">
                <span>Alumno / Hora</span>
                <span className="hidden sm:inline">Detalle</span>
                <span>Neto</span>
              </div>

              <div className="divide-y divide-slate-200/60 dark:divide-white/[0.07] max-h-[640px] overflow-y-auto">
                {sales.map((sale) => (
                  <SaleRow key={sale.id} sale={sale} />
                ))}
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
