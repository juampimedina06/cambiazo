'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { LogoPencilC } from '@/shared/ui/LogoPencilC';
import { Surface } from '@/shared/ui/Surface';
import { Button } from '@/shared/ui/Button';
import { ShieldCheck, School, Store, ArrowRight, CheckCircle2 } from 'lucide-react';
import { apiClient } from '@/shared/api/api-client';
import { Institution } from '@/shared/api/types';

export default function LoginPage() {
  const router = useRouter();
  const [role, setRole] = useState<'SUPER_ADMIN' | 'SCHOOL_ADMIN' | 'KIOSK'>('SCHOOL_ADMIN');
  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [selectedInstId, setSelectedInstId] = useState<string>('e28bb18a-66fe-4f8e-9092-2df283f55001');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const list = await apiClient.getInstitutions();
        setInstitutions(list);
        if (list.length > 0) {
          const savedId = localStorage.getItem('cambiazo_institution_id');
          const matched = list.find((i) => i.id === savedId);
          setSelectedInstId(matched ? matched.id : list[0]!.id);
        }
      } catch (e) {
        console.error('Error loading institutions in login:', e);
      }
    }
    load();
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const chosenInst = institutions.find((i) => i.id === selectedInstId);
    const instName = chosenInst ? chosenInst.name : 'Colegio Belgrano Day School';

    localStorage.setItem('cambiazo_role', role);
    localStorage.setItem('cambiazo_institution_id', selectedInstId);
    localStorage.setItem('cambiazo_institution_name', instName);

    if (role === 'SUPER_ADMIN') {
      router.push('/super-admin/institutions');
    } else if (role === 'SCHOOL_ADMIN') {
      router.push('/school/invitations');
    } else {
      router.push('/kiosk/catalog');
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-between p-6 sm:p-12 bg-canvas">
      <header className="flex items-center justify-between max-w-xl w-full mx-auto pb-6 border-b border-slate-200">
        <Link href="/">
          <LogoPencilC size={42} showText />
        </Link>
        <span className="text-xs font-semibold px-3 py-1 bg-brand-soft text-brand-dark rounded-full">
          Inicio de Sesión
        </span>
      </header>

      <main className="max-w-xl w-full mx-auto py-8">
        <Surface className="p-8 border border-slate-200 shadow-sm">
          <div className="text-center mb-8">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-text-primary tracking-tight">
              Ingresar al Portal
            </h1>
            <p className="text-text-secondary text-sm mt-2">
              Seleccioná tu rol y el colegio con el que querés operar en Cambiazo.
            </p>
          </div>

          <form onSubmit={handleLogin} className="flex flex-col gap-6">
            {/* Role Selection */}
            <div>
              <label className="text-xs font-bold text-text-secondary uppercase tracking-wider block mb-3">
                1. Seleccioná tu Perfil
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <button
                  type="button"
                  onClick={() => setRole('SCHOOL_ADMIN')}
                  className={`p-4 rounded-2xl border-2 flex flex-col items-center gap-2 text-center transition-all ${
                    role === 'SCHOOL_ADMIN'
                      ? 'border-brand-primary bg-brand-soft/40 text-brand-dark font-bold shadow-sm'
                      : 'border-slate-200 hover:border-slate-300 text-text-secondary bg-white'
                  }`}
                >
                  <School size={24} className={role === 'SCHOOL_ADMIN' ? 'text-brand-primary' : 'text-slate-400'} />
                  <span className="text-sm">Panel Escolar</span>
                </button>

                <button
                  type="button"
                  onClick={() => setRole('KIOSK')}
                  className={`p-4 rounded-2xl border-2 flex flex-col items-center gap-2 text-center transition-all ${
                    role === 'KIOSK'
                      ? 'border-emerald-500 bg-emerald-50 text-emerald-900 font-bold shadow-sm'
                      : 'border-slate-200 hover:border-slate-300 text-text-secondary bg-white'
                  }`}
                >
                  <Store size={24} className={role === 'KIOSK' ? 'text-emerald-600' : 'text-slate-400'} />
                  <span className="text-sm">Kiosco POS</span>
                </button>

                <button
                  type="button"
                  onClick={() => setRole('SUPER_ADMIN')}
                  className={`p-4 rounded-2xl border-2 flex flex-col items-center gap-2 text-center transition-all ${
                    role === 'SUPER_ADMIN'
                      ? 'border-brand-primary bg-brand-soft/40 text-brand-dark font-bold shadow-sm'
                      : 'border-slate-200 hover:border-slate-300 text-text-secondary bg-white'
                  }`}
                >
                  <ShieldCheck size={24} className={role === 'SUPER_ADMIN' ? 'text-brand-primary' : 'text-slate-400'} />
                  <span className="text-sm">Super Admin</span>
                </button>
              </div>
            </div>

            {/* Institution Selection (only if not Super Admin) */}
            {role !== 'SUPER_ADMIN' && (
              <div>
                <label className="text-xs font-bold text-text-secondary uppercase tracking-wider block mb-2">
                  2. Institución Educativa
                </label>
                <div className="relative">
                  <select
                    value={selectedInstId}
                    onChange={(e) => setSelectedInstId(e.target.value)}
                    className="w-full px-4 py-3.5 bg-white border-2 border-slate-200 rounded-2xl text-text-primary font-bold text-sm focus:outline-none focus:border-brand-primary transition-colors cursor-pointer appearance-none"
                  >
                    {institutions.map((inst) => (
                      <option key={inst.id} value={inst.id}>
                        {inst.name} ({inst.address || 'Sede Central'})
                      </option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-500">
                    ▼
                  </div>
                </div>
                <p className="text-xs text-text-secondary mt-1.5">
                  Cambiarás el contexto operativo a esta escuela específica.
                </p>
              </div>
            )}

            <Button
              type="submit"
              size="lg"
              variant="primary"
              isLoading={isLoading}
              icon={<ArrowRight size={18} />}
              className="w-full mt-2"
            >
              Iniciar Sesión
            </Button>
          </form>
        </Surface>
      </main>

      <footer className="max-w-xl w-full mx-auto pt-6 text-center text-xs text-text-secondary">
        CAMBIAZO © 2026 — Plataforma Escolar Multi-Tenant
      </footer>
    </div>
  );
}
