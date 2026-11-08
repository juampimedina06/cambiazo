import React from 'react';
import Link from 'next/link';
import { LogoPencilC } from '@/shared/ui/LogoPencilC';
import { Shield, Building2, ArrowLeft } from 'lucide-react';

export default function SuperAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col bg-canvas">
      {/* Super Admin Topbar */}
      <header className="bg-surface border-b border-slate-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/" className="hover:opacity-90 transition-opacity">
              <LogoPencilC size={36} showText />
            </Link>
            <div className="h-6 w-px bg-slate-200 hidden sm:block" />
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1.5 px-3 py-1 bg-brand-soft text-brand-dark rounded-full text-xs font-bold">
                <Shield size={14} />
                Super Admin
              </span>
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
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
}
