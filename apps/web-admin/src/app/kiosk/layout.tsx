'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LogoPencilC } from '@/shared/ui/LogoPencilC';
import { Package, CreditCard, ArrowUpRight, ArrowLeft } from 'lucide-react';
import { InstitutionSwitcher } from '@/shared/ui/InstitutionSwitcher';
import { ThemeToggle } from '@/shared/ui/ThemeToggle';

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
    <div className="min-h-screen flex flex-col">
      {/* Kiosk Topbar */}
      <header className="liquid-glass-nav sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4 sm:gap-6">
            <Link href="/" className="hover:opacity-90 transition-opacity">
              <LogoPencilC size={36} showText />
            </Link>
            <div className="h-6 w-px bg-slate-200/80 dark:bg-white/[0.12] hidden sm:block" />
            <InstitutionSwitcher roleLabel="Portal Kiosco" isKiosk={true} />
          </div>

          <div className="flex items-center gap-2.5 sm:gap-3">
            <ThemeToggle compact />
            <Link
              href="/"
              className="text-xs font-semibold text-text-secondary hover:text-text-primary flex items-center gap-1.5 px-3 py-2 rounded-full backdrop-blur-md bg-white/50 dark:bg-white/[0.06] border border-white/70 dark:border-white/[0.1] hover:bg-white/80 dark:hover:bg-white/[0.12] transition-all"
            >
              <ArrowLeft size={14} />
              <span className="hidden sm:inline">Cambiar de Portal</span>
            </Link>
          </div>
        </div>

        {/* Segmented Glass Pill Navigation */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-3 flex items-center gap-1.5 overflow-x-auto scrollbar-none">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs sm:text-sm font-semibold transition-all whitespace-nowrap ${
                item.isActive
                  ? 'bg-brand-primary text-white shadow-[0_4px_16px_-2px_rgba(108,60,233,0.45)]'
                  : 'text-text-secondary hover:text-text-primary hover:bg-white/60 dark:hover:bg-white/[0.08]'
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
