import Link from 'next/link';
import { LogoPencilC } from '@/shared/ui/LogoPencilC';
import { ThemeToggle } from '@/shared/ui/ThemeToggle';
import { ShieldCheck, School, Store } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col justify-between p-6 sm:p-10">
      <header className="max-w-6xl w-full mx-auto px-5 py-3.5 rounded-3xl liquid-glass flex items-center justify-between gap-4">
        <LogoPencilC size={44} showText />
        <div className="flex items-center gap-2.5 sm:gap-3">
          <Link
            href="/login"
            className="text-xs font-bold px-4 py-2 rounded-full backdrop-blur-md bg-white/70 dark:bg-white/[0.08] border border-white/80 dark:border-white/[0.14] text-text-primary hover:border-brand-primary/60 hover:text-brand-primary transition-all shadow-sm"
          >
            Iniciar Sesión
          </Link>
          <span className="hidden sm:inline-flex text-xs font-semibold px-3 py-1.5 bg-brand-soft/80 dark:bg-brand-primary/20 text-brand-dark dark:text-purple-200 rounded-full border border-brand-primary/15">
            Portal Administrativo
          </span>
          <ThemeToggle compact />
        </div>
      </header>

      <main className="max-w-6xl w-full mx-auto py-12 flex flex-col gap-8">
        <div className="text-center sm:text-left">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-text-primary tracking-tight">
            Gestión y Administración CAMBIAZO
          </h1>
          <p className="text-text-secondary mt-2 text-base sm:text-lg max-w-2xl">
            Selecciona el entorno de administración para gestionar instituciones, códigos
            de invitación escolar, auditoría de consentimiento parental y el kiosco escolar con 0% de comisión.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 border-y border-slate-200/70 dark:border-white/[0.08] divide-y md:divide-y-0 md:divide-x divide-slate-200/70 dark:divide-white/[0.08]">
          {/* Super Admin Console Entry */}
          <Link
            href="/super-admin/institutions"
            className="group py-8 md:pr-8 flex flex-col justify-between transition-colors hover:bg-white/30 dark:hover:bg-white/[0.02]"
          >
            <div>
              <div className="w-11 h-11 rounded-2xl bg-brand-soft/80 dark:bg-brand-primary/25 text-brand-dark dark:text-purple-200 flex items-center justify-center mb-4">
                <ShieldCheck size={22} />
              </div>
              <h2 className="text-xl font-bold text-text-primary group-hover:text-brand-primary transition-colors">
                Super Admin
              </h2>
              <p className="text-text-secondary text-sm mt-2 leading-relaxed">
                Gestión global de instituciones educativas, planes de abono (mensual fijo vs por alumno) y altas de colegios.
              </p>
            </div>
            <div className="mt-6 flex items-center gap-2 text-brand-primary dark:text-purple-300 font-bold text-sm">
              <span>Acceder a Instituciones</span>
              <span className="group-hover:translate-x-1 transition-transform">→</span>
            </div>
          </Link>

          {/* School Admin Panel Entry */}
          <Link
            href="/school/invitations"
            className="group py-8 md:px-8 flex flex-col justify-between transition-colors hover:bg-white/30 dark:hover:bg-white/[0.02]"
          >
            <div>
              <div className="w-11 h-11 rounded-2xl bg-amber-400/20 dark:bg-amber-400/15 text-amber-800 dark:text-amber-300 flex items-center justify-center mb-4">
                <School size={22} />
              </div>
              <h2 className="text-xl font-bold text-text-primary group-hover:text-brand-primary transition-colors">
                Panel Escolar
              </h2>
              <p className="text-text-secondary text-sm mt-2 leading-relaxed">
                Códigos de invitación institucional y nómina de alumnos con consentimiento parental auditable (Ley 25.326).
              </p>
            </div>
            <div className="mt-6 flex items-center gap-2 text-amber-700 dark:text-amber-300 font-bold text-sm">
              <span>Acceder al Panel Escolar</span>
              <span className="group-hover:translate-x-1 transition-transform">→</span>
            </div>
          </Link>

          {/* Kiosk Administration Portal Entry */}
          <Link
            href="/kiosk/catalog"
            className="group py-8 md:pl-8 flex flex-col justify-between transition-colors hover:bg-white/30 dark:hover:bg-white/[0.02]"
          >
            <div>
              <div className="w-11 h-11 rounded-2xl bg-emerald-500/15 dark:bg-emerald-400/15 text-emerald-800 dark:text-emerald-300 flex items-center justify-center mb-4">
                <Store size={22} />
              </div>
              <h2 className="text-xl font-bold text-text-primary group-hover:text-brand-primary transition-colors">
                Portal Kiosco
              </h2>
              <p className="text-text-secondary text-sm mt-2 leading-relaxed">
                Gestión de catálogo, monitor de ventas en tiempo real, terminal auxiliar de 6 dígitos y retiros a Mercado Pago sin comisiones.
              </p>
            </div>
            <div className="mt-6 flex items-center gap-2 text-emerald-700 dark:text-emerald-300 font-bold text-sm">
              <span>Acceder al Kiosco</span>
              <span className="group-hover:translate-x-1 transition-transform">→</span>
            </div>
          </Link>
        </div>
      </main>

      <footer className="max-w-6xl w-full mx-auto pt-6 border-t border-slate-200/70 dark:border-white/[0.08] text-xs text-text-secondary flex flex-col sm:flex-row justify-between items-center gap-4">
        <span>CAMBIAZO © 2026 — Consola Administrativa</span>
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-300 font-medium">
            ● Backend API NestJS Conectado
          </span>
          <span>Ley 25.326 Protección de Datos Personales</span>
        </div>
      </footer>
    </div>
  );
}
