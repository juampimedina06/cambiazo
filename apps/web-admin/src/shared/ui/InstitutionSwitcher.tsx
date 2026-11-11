'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { School, Store, LogOut, ChevronDown } from 'lucide-react';
import { apiClient } from '@/shared/api/api-client';
import { Institution } from '@/shared/api/types';

interface InstitutionSwitcherProps {
  roleLabel: string;
  isKiosk?: boolean;
}

export const InstitutionSwitcher: React.FC<InstitutionSwitcherProps> = ({
  roleLabel,
  isKiosk = false,
}) => {
  const router = useRouter();
  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [currentId, setCurrentId] = useState<string>('e28bb18a-66fe-4f8e-9092-2df283f55001');
  const [currentName, setCurrentName] = useState<string>('Colegio Belgrano Day School');

  useEffect(() => {
    const savedId = localStorage.getItem('cambiazo_institution_id');
    const savedName = localStorage.getItem('cambiazo_institution_name');
    if (savedId) setCurrentId(savedId);
    if (savedName) setCurrentName(savedName);

    async function fetchInstitutions() {
      try {
        const list = await apiClient.getInstitutions();
        setInstitutions(list);
        if (savedId) {
          const match = list.find((i) => i.id === savedId);
          if (match) setCurrentName(match.name);
        }
      } catch (err) {
        console.error('Failed to load institutions in switcher:', err);
      }
    }
    fetchInstitutions();
  }, []);

  const handleSelectInstitution = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newId = e.target.value;
    const found = institutions.find((i) => i.id === newId);
    if (found) {
      setCurrentId(found.id);
      setCurrentName(found.name);
      localStorage.setItem('cambiazo_institution_id', found.id);
      localStorage.setItem('cambiazo_institution_name', found.name);
      // Reload current route with new tenant context
      window.location.reload();
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('cambiazo_role');
    localStorage.removeItem('cambiazo_institution_id');
    localStorage.removeItem('cambiazo_institution_name');
    router.push('/login');
  };

  return (
    <div className="flex items-center gap-3">
      {/* School Badge & Selector */}
      <div className="flex items-center gap-2">
        <div
          className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs backdrop-blur-md ${
            isKiosk
              ? 'bg-brand-primary/15 dark:bg-brand-primary/25 text-brand-dark dark:text-purple-200'
              : 'bg-amber-400/20 dark:bg-amber-400/15 text-amber-800 dark:text-amber-300'
          }`}
        >
          {isKiosk ? <Store size={16} /> : <School size={16} />}
        </div>

        <div className="flex flex-col">
          <div className="relative inline-block">
            <select
              value={currentId}
              onChange={handleSelectInstitution}
              className="bg-transparent font-bold text-xs text-text-primary pr-5 cursor-pointer hover:text-brand-primary transition-colors focus:outline-none appearance-none"
              title="Cambiar de institución educativa"
            >
              {institutions.length > 0 ? (
                institutions.map((inst) => (
                  <option
                    key={inst.id}
                    value={inst.id}
                    className="text-text-primary bg-white dark:bg-[#17142B]"
                  >
                    {inst.name}
                  </option>
                ))
              ) : (
                <option
                  value={currentId}
                  className="text-text-primary bg-white dark:bg-[#17142B]"
                >
                  {currentName}
                </option>
              )}
            </select>
            <ChevronDown
              size={12}
              className="pointer-events-none absolute right-0 top-1/2 -translate-y-1/2 text-text-muted"
            />
          </div>
          <span className="text-[10px] text-text-secondary font-medium">
            {roleLabel} • Clic para cambiar
          </span>
        </div>
      </div>

      <div className="h-6 w-px bg-slate-200/80 dark:bg-white/[0.12] hidden sm:block mx-1" />

      {/* Logout button */}
      <button
        onClick={handleLogout}
        className="text-xs font-semibold text-text-secondary hover:text-rose-600 dark:hover:text-rose-400 flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl hover:bg-rose-500/10 transition-colors"
        title="Cerrar Sesión"
      >
        <LogOut size={14} />
        <span className="hidden sm:inline">Cerrar Sesión</span>
      </button>
    </div>
  );
};
