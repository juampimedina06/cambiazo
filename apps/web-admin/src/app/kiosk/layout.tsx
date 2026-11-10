'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LogoPencilC } from '@/shared/ui/LogoPencilC';
import { Store, Package, CreditCard, ArrowUpRight, ArrowLeft } from 'lucide-react';
import { InstitutionSwitcher } from '@/shared/ui/InstitutionSwitcher';

export default function KioskLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  const navItems = [
    {
      href: '/kiosk/catalog',
      label: 'Catálogo de Productos',
      icon: <Package size={18} />,
      isActive: pathname.startsWith('/kiosk/catalog'),
    },
    {
      href: '/kiosk/sales',
      label: 'Monitor y Caja POS',
      icon: <CreditCard size={18} />,
      isActive: pathname.startsWith('/kiosk/sales'),
    },
    {
      href: '/kiosk/withdrawals',
      label: 'Retiros Mercado Pago',
      icon: <ArrowUpRight size={18} />,
      isActive: pathname.startsWith('/kiosk/withdrawals'),
    },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-canvas">
      {/* Kiosk Topbar */}
      <header className="bg-surface border-b border-slate-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/" className="hover:opacity-90 transition-opacity">
              <LogoPencilC size={36} showText />
            </Link>
            <div className="h-6 w-px bg-slate-200 hidden sm:block" />
            <InstitutionSwitcher roleLabel="Portal Kiosco" isKiosk={true} />
          </div>

          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="text-xs font-semibold text-text-secondary hover:text-text-primary flex items-center gap-1 px-3 py-2 rounded-xl hover:bg-slate-100 transition-colors"
            >
              <ArrowLeft size={14} />
              <span>Cambiar de Portal</span>
            </Link>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex gap-2 border-t border-slate-100 overflow-x-auto scrollbar-none">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-2 px-4 py-3 text-xs sm:text-sm font-bold border-b-2 transition-colors whitespace-nowrap ${
                item.isActive
                  ? 'border-brand-primary text-brand-primary'
                  : 'border-transparent text-text-secondary hover:text-text-primary hover:border-slate-300'
              }`}
            >
              {item.icon}
              <span>{item.label}</span>
            </Link>
          ))}
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
}
