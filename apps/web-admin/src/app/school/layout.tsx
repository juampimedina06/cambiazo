'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LogoPencilC } from '@/shared/ui/LogoPencilC';
import { School, Ticket, Users, ArrowLeft } from 'lucide-react';

export default function SchoolLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  const navItems = [
    {
      href: '/school/invitations',
      label: 'Códigos de Invitación',
      icon: <Ticket size={18} />,
      isActive: pathname.startsWith('/school/invitations'),
    },
    {
      href: '/school/students',
      label: 'Alumnos y Consentimiento (Ley 25.326)',
      icon: <Users size={18} />,
      isActive: pathname.startsWith('/school/students'),
    },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-canvas">
      {/* School Admin Topbar */}
      <header className="bg-surface border-b border-slate-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/" className="hover:opacity-90 transition-opacity">
              <LogoPencilC size={36} showText />
            </Link>
            <div className="h-6 w-px bg-slate-200 hidden sm:block" />
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold text-xs">
                <School size={16} />
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-xs text-text-primary leading-tight">
                  Colegio Belgrano Day School
                </span>
                <span className="text-[10px] text-text-secondary font-medium">
                  Panel Directivo Escolar
                </span>
              </div>
            </div>
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

        {/* Tab Navigation Navigation */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex gap-2 border-t border-slate-100">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-2 px-4 py-3 text-xs sm:text-sm font-bold border-b-2 transition-colors ${
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
