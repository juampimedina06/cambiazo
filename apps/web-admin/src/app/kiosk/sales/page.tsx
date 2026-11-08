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
import { DEFAULT_KIOSK_INSTITUTION_ID } from '@/shared/api/mock-adapter';
import { Surface } from '@/shared/ui/Surface';
import { Button } from '@/shared/ui/Button';
import { SaleRow } from '@/entities/sale';
import { PosCheckoutTerminal } from '@/features/pos-terminal';

export default function KioskSalesPage() {
  const [sales, setSales] = useState<KioskSale[]>([]);
  const [products, setProducts] = useState<CatalogProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadData = async () => {
    setIsRefreshing(true);
    try {
      const [salesData, productsData] = await Promise.all([
        apiClient.getKioskSales(DEFAULT_KIOSK_INSTITUTION_ID),
        apiClient.getCatalogProducts(DEFAULT_KIOSK_INSTITUTION_ID),
      ]);
      setSales(salesData);
      setProducts(productsData);
    } catch (err) {
      console.error('Error loading kiosk sales and catalog:', err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSaleCompleted = (newSale: KioskSale) => {
    setSales((prev) => [newSale, ...prev]);
    // Refresh products to reflect deducted stock
    apiClient
      .getCatalogProducts(DEFAULT_KIOSK_INSTITUTION_ID)
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
            onClick={loadData}
            isLoading={isRefreshing}
            icon={<RefreshCw size={14} className={isRefreshing ? 'animate-spin' : ''} />}
          >
            Actualizar Monitor
          </Button>
        </div>
      </div>

      {/* Metric Cards (Anti-nesting: independent Surfaces directly on canvas) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Surface className="p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center flex-shrink-0">
            <DollarSign size={24} />
          </div>
          <div>
            <span className="text-xs font-semibold text-text-secondary uppercase tracking-wider block">
              Recaudación de Hoy
            </span>
            <div className="text-2xl font-extrabold text-emerald-700 tabular-nums mt-0.5">
              {totalFormatted}
            </div>
            <span className="text-[11px] text-text-secondary font-medium">
              Pesos reales 1 a 1
            </span>
          </div>
        </Surface>

        <Surface className="p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-brand-soft text-brand-dark flex items-center justify-center flex-shrink-0">
            <ShoppingBag size={24} />
          </div>
          <div>
            <span className="text-xs font-semibold text-text-secondary uppercase tracking-wider block">
              Ventas en Recreos
            </span>
            <div className="text-2xl font-extrabold text-text-primary tabular-nums mt-0.5">
              {totalSalesCount}{' '}
              <span className="text-xs text-text-secondary font-normal">
                operaciones
              </span>
            </div>
            <span className="text-[11px] text-emerald-600 font-semibold">
              100% completadas
            </span>
          </div>
        </Surface>

        <Surface className="p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-800 flex items-center justify-center flex-shrink-0">
            <ShieldCheck size={24} />
          </div>
          <div>
            <span className="text-xs font-semibold text-text-secondary uppercase tracking-wider block">
              Comisión de Plataforma
            </span>
            <div className="text-2xl font-extrabold text-blue-700 tabular-nums mt-0.5">
              0%{' '}
              <span className="text-xs text-text-secondary font-normal">
                ($0 ARS)
              </span>
            </div>
            <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full inline-block mt-0.5">
              100% neto para el kiosquero
            </span>
          </div>
        </Surface>

        <Surface className="p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-purple-100 text-purple-800 flex items-center justify-center flex-shrink-0">
            <TrendingUp size={24} />
          </div>
          <div>
            <span className="text-xs font-semibold text-text-secondary uppercase tracking-wider block">
              Ticket Promedio
            </span>
            <div className="text-2xl font-extrabold text-brand-primary tabular-nums mt-0.5">
              {avgFormatted}
            </div>
            <span className="text-[11px] text-text-secondary font-medium">
              por alumno / compra
            </span>
          </div>
        </Surface>
      </div>

      {/* Main Grid: POS Checkout Terminal (Left) & Real-time Sales Monitor (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: POS Terminal */}
        <div className="lg:col-span-6 xl:col-span-5">
          <PosCheckoutTerminal
            products={products}
            onSaleCompleted={handleSaleCompleted}
            institutionId={DEFAULT_KIOSK_INSTITUTION_ID}
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
            <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
              ● En Directo
            </span>
          </div>

          {isLoading ? (
            <Surface className="p-12 text-center text-text-secondary">
              <div className="inline-block w-8 h-8 border-2 border-brand-primary border-t-transparent rounded-full animate-spin mb-3" />
              <p className="text-sm">Cargando monitor de ventas...</p>
            </Surface>
          ) : sales.length === 0 ? (
            <Surface className="p-12 text-center text-text-secondary">
              <ShoppingBag size={40} className="mx-auto text-slate-300 mb-3" />
              <h3 className="font-bold text-text-primary text-base">
                Sin ventas registradas hoy
              </h3>
              <p className="text-xs text-text-secondary mt-1 max-w-sm mx-auto">
                Los cobros realizados en la terminal web o con QR aparecerán inmediatamente aquí con 0% de comisión.
              </p>
            </Surface>
          ) : (
            <Surface>
              <div className="px-5 py-3.5 bg-slate-50/80 border-b border-slate-100 flex items-center justify-between text-xs font-bold text-text-secondary uppercase tracking-wider">
                <span>Hora / Alumno</span>
                <span className="hidden sm:inline">Ítems / Comisión</span>
                <span>Monto Neto Kiosco</span>
              </div>

              <div className="divide-y divide-slate-100 max-h-[640px] overflow-y-auto">
                {sales.map((sale) => (
                  <SaleRow key={sale.id} sale={sale} />
                ))}
              </div>
            </Surface>
          )}
        </div>
      </div>
    </div>
  );
}
