'use client';

import React, { useEffect, useState } from 'react';
import { Plus, Search, Users, DollarSign, School } from 'lucide-react';
import { Institution, InstitutionStatus } from '@/shared/api/types';
import { apiClient } from '@/shared/api/api-client';
import { Button } from '@/shared/ui/Button';
import { InstitutionRow } from '@/entities/institution';
import { CreateInstitutionModal } from '@/features/institution-creation';

export default function SuperAdminInstitutionsPage() {
  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'SUSPENDED'>('ALL');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [apiError, setApiError] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const loadInstitutions = async () => {
    setIsLoading(true);
    setApiError(null);
    try {
      const data = await apiClient.getInstitutions();
      const rawList = Array.isArray(data) ? data : ((data as any)?.institutions || []);
      const sanitized = rawList.map((item: any) => item?.institution || item);
      setInstitutions(sanitized);
    } catch (err) {
      console.error('Failed to load institutions:', err);
      setApiError(
        err instanceof Error
          ? err.message
          : 'No se pudo conectar con la API del backend.'
      );
      setInstitutions([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadInstitutions();
  }, []);

  const handleToggleStatus = async (
    id: string,
    currentStatus: InstitutionStatus
  ) => {
    setUpdatingId(id);
    const newStatus: InstitutionStatus =
      currentStatus === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
    try {
      await apiClient.updateInstitutionStatus(id, newStatus);
      setInstitutions((prev) =>
        prev.map((inst) => (inst.id === id ? { ...inst, status: newStatus } : inst))
      );
    } catch (err) {
      console.error('Failed to update status:', err);
    } finally {
      setUpdatingId(null);
    }
  };

  const handleInstitutionCreated = (newInst: any) => {
    const unwrapped = newInst?.institution ? newInst.institution : newInst;
    setInstitutions((prev) => [unwrapped, ...(Array.isArray(prev) ? prev : [])]);
  };

  // Filtered institutions
  const safeInstitutions = (Array.isArray(institutions) ? institutions : []).map(
    (item: any) => item?.institution || item
  );

  const filteredInstitutions = safeInstitutions.filter((inst) => {
    if (!inst) return false;
    const name = typeof inst.name === 'string' ? inst.name : '';
    const cuit = typeof inst.cuit === 'string' ? inst.cuit : '';
    const address = typeof inst.address === 'string' ? inst.address : '';
    const query = searchQuery ? searchQuery.toLowerCase().trim() : '';

    const matchesSearch =
      !query ||
      name.toLowerCase().includes(query) ||
      cuit.includes(query) ||
      address.toLowerCase().includes(query);

    const matchesStatus =
      statusFilter === 'ALL' || inst.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  // Calculate overview metrics
  const totalSchools = safeInstitutions.length;
  const activeSchools = safeInstitutions.filter((i) => i?.status === 'ACTIVE').length;
  const totalStudents = safeInstitutions.reduce((sum, i) => sum + (i?.activeStudentsCount || 0), 0);

  const totalMonthlyBillingCents = safeInstitutions.reduce((sum, i) => {
    if (!i || i.status !== 'ACTIVE') return sum;
    if (i.billingPlanType === 'FIXED_MONTHLY') {
      return sum + (i.monthlyFeeCents || 0);
    } else {
      return sum + (i.monthlyFeeCents || 0) * (i.activeStudentsCount || 0);
    }
  }, 0);

  const formattedTotalBilling = new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    maximumFractionDigits: 0,
  }).format(totalMonthlyBillingCents / 100);

  return (
    <div className="flex flex-col gap-6">
      {/* Page Title & Main Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-text-primary tracking-tight">
            Instituciones Educativas
          </h1>
          <p className="text-text-secondary text-sm mt-1">
            Gestión centralizada de colegios adheridos, modalidades de abono y supervisión.
          </p>
        </div>

        <Button
          size="lg"
          variant="primary"
          onClick={() => setIsModalOpen(true)}
          icon={<Plus size={20} />}
        >
          Nueva Institución
        </Button>
      </div>

      {/* Open Editorial Metrics Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 border-y border-slate-200/70 dark:border-white/[0.08] divide-y sm:divide-y-0 sm:divide-x divide-slate-200/70 dark:divide-white/[0.08]">
        <div className="py-4 sm:pr-6 flex items-center gap-3.5">
          <School size={20} className="text-brand-primary dark:text-purple-300 flex-shrink-0" />
          <div>
            <span className="text-xs font-semibold text-text-secondary uppercase tracking-wider block">
              Colegios Activos
            </span>
            <div className="text-2xl font-extrabold text-text-primary tabular-nums mt-0.5">
              {activeSchools}{' '}
              <span className="text-xs text-text-secondary font-normal">
                de {totalSchools} totales
              </span>
            </div>
          </div>
        </div>

        <div className="py-4 sm:px-6 flex items-center gap-3.5">
          <Users size={20} className="text-amber-600 dark:text-amber-300 flex-shrink-0" />
          <div>
            <span className="text-xs font-semibold text-text-secondary uppercase tracking-wider block">
              Alumnos en Plataforma
            </span>
            <div className="text-2xl font-extrabold text-text-primary tabular-nums mt-0.5">
              {totalStudents.toLocaleString('es-AR')}
            </div>
          </div>
        </div>

        <div className="py-4 sm:pl-6 flex items-center gap-3.5">
          <DollarSign size={20} className="text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
          <div>
            <span className="text-xs font-semibold text-text-secondary uppercase tracking-wider block">
              Facturación Estimada
            </span>
            <div className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 tabular-nums mt-0.5">
              {formattedTotalBilling}
              <span className="text-xs text-text-secondary font-normal"> / mes</span>
            </div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search
            size={18}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted"
          />
          <input
            type="text"
            placeholder="Buscar colegio o CUIT..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 liquid-glass-subtle rounded-2xl text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-brand-primary/60 transition-all"
          />
        </div>

        <div className="flex items-center gap-1 liquid-glass-subtle p-1 rounded-full">
          {(['ALL', 'ACTIVE', 'SUSPENDED'] as const).map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all ${
                statusFilter === status
                  ? 'bg-brand-primary text-white shadow-sm'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              {status === 'ALL'
                ? 'Todos'
                : status === 'ACTIVE'
                ? 'Activos'
                : 'Suspendidos'}
            </button>
          ))}
        </div>
      </div>

      {/* Open List directly on canvas */}
      <section className="border-t border-slate-200/70 dark:border-white/[0.08]">
        <div className="py-3.5 border-b border-slate-200/60 dark:border-white/[0.07] flex justify-between items-center">
          <span className="text-xs font-bold text-text-secondary uppercase tracking-wider">
            Instituciones ({filteredInstitutions.length})
          </span>
          <span className="text-xs text-text-muted font-medium">
            Plan y facturación
          </span>
        </div>

        {apiError ? (
          <div className="py-10 text-center flex flex-col items-center gap-3">
            <p className="text-sm font-semibold text-red-600 dark:text-red-400">
              {apiError}
            </p>
            <Button size="sm" variant="outline" onClick={loadInstitutions}>
              Reintentar conexión
            </Button>
          </div>
        ) : isLoading ? (
          <div className="py-12 text-center text-text-secondary text-sm">
            Cargando instituciones...
          </div>
        ) : filteredInstitutions.length === 0 ? (
          <div className="py-12 text-center flex flex-col items-center justify-center gap-2">
            <School size={36} className="text-slate-300 dark:text-slate-600" />
            <p className="font-semibold text-text-primary text-base">
              No se encontraron instituciones
            </p>
            <p className="text-xs text-text-secondary max-w-sm">
              No hay colegios que coincidan con los criterios de búsqueda actuales.
            </p>
          </div>
        ) : (
          <div>
            {filteredInstitutions.map((institution) => (
              <InstitutionRow
                key={institution.id}
                institution={institution}
                onToggleStatus={handleToggleStatus}
                isUpdating={updatingId === institution.id}
              />
            ))}
          </div>
        )}
      </section>

      {/* Modal for Creating New Institution */}
      <CreateInstitutionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={handleInstitutionCreated}
      />
    </div>
  );
}
