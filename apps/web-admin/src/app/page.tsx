import Link from 'next/link';
import { LogoPencilC } from '@/shared/ui/LogoPencilC';
import { Surface } from '@/shared/ui/Surface';
import { ShieldCheck, School, Users, Ticket } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col justify-between p-6 sm:p-12">
      <header className="flex items-center justify-between max-w-5xl w-full mx-auto pb-8 border-b border-slate-200">
        <LogoPencilC size={48} showText />
        <span className="text-xs font-semibold px-3 py-1 bg-brand-soft text-brand-dark rounded-full">
          Portal Administrativo
        </span>
      </header>

      <main className="max-w-5xl w-full mx-auto py-12 flex flex-col gap-8">
        <div className="text-center sm:text-left">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-text-primary tracking-tight">
            Gestión y Administración CAMBIAZO
          </h1>
          <p className="text-text-secondary mt-2 text-base sm:text-lg max-w-2xl">
            Selecciona el entorno de administración para gestionar instituciones, códigos
            de invitación escolar y auditoría de consentimiento parental según la Ley 25.326.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Super Admin Console Entry */}
          <Link href="/super-admin/institutions" className="block group">
            <Surface className="p-8 h-full border-2 border-slate-200 group-hover:border-brand-primary transition-all group-hover:shadow-md">
              <div className="w-14 h-14 rounded-2xl bg-brand-soft text-brand-dark flex items-center justify-center mb-5 group-hover:scale-105 transition-transform">
                <ShieldCheck size={28} />
              </div>
              <h2 className="text-2xl font-bold text-text-primary group-hover:text-brand-primary transition-colors">
                Consola Super Admin
              </h2>
              <p className="text-text-secondary text-sm mt-2 leading-relaxed">
                Gestión global de instituciones educativas, planes de abono (mensual fijo vs por alumno) y altas de colegios con accesos para Directivos y Kiosco.
              </p>
              <div className="mt-6 flex items-center gap-2 text-brand-primary font-bold text-sm">
                <span>Acceder a Instituciones</span>
                <span>→</span>
              </div>
            </Surface>
          </Link>

          {/* School Admin Panel Entry */}
          <Link href="/school/invitations" className="block group">
            <Surface className="p-8 h-full border-2 border-slate-200 group-hover:border-brand-primary transition-all group-hover:shadow-md">
              <div className="w-14 h-14 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center mb-5 group-hover:scale-105 transition-transform">
                <School size={28} />
              </div>
              <h2 className="text-2xl font-bold text-text-primary group-hover:text-brand-primary transition-colors">
                Panel Directivo Escolar
              </h2>
              <p className="text-text-secondary text-sm mt-2 leading-relaxed">
                Generador de códigos de invitación institucional y nómina de alumnos con estado auditable de consentimiento parental (Ley 25.326).
              </p>
              <div className="mt-6 flex items-center gap-2 text-amber-700 font-bold text-sm">
                <span>Acceder al Panel Escolar</span>
                <span>→</span>
              </div>
            </Surface>
          </Link>
        </div>
      </main>

      <footer className="max-w-5xl w-full mx-auto pt-8 border-t border-slate-200 text-xs text-text-secondary flex flex-col sm:flex-row justify-between items-center gap-4">
        <span>CAMBIAZO © 2026 — Monorepo Architecture Wave 1</span>
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1 text-emerald-700 font-medium">
            ● Modo Mock Activo
          </span>
          <span>Ley 25.326 Protección de Datos Personales</span>
        </div>
      </footer>
    </div>
  );
}
