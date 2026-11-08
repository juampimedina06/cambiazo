'use client';

import React, { useEffect, useState } from 'react';
import { Plus, Search, Building2, Users, DollarSign, School } from 'lucide-react';
import { Institution, InstitutionStatus } from '@/shared/api/types';
import { apiClient } from '@/shared/api/api-client';
import { Surface } from '@/shared/ui/Surface';
import { Button } from '@/shared/ui/Button';
import { InstitutionRow } from '@/entities/institution';
import { CreateInstitutionModal } from '@/features/institution-creation';

export default function SuperAdminInstitutionsPage() {
  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'SUSPENDED'>('ALL');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const loadInstitutions = async () => {
    setIsLoading(true);
    try {
      const data = await apiClient.getInstitutions();
      setInstitutions(data);
    } catch (err) {
      console.error('Failed to load institutions:', err);
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

  const handleInstitutionCreated = (newInst: Institution) => {
    setInstitutions((prev) => [newInst, ...prev]);
  };

  // Filtered institutions
  const filteredInstitutions = institutions.filter((inst) => {
    const matchesSearch =
      inst.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inst.cuit.includes(searchQuery) ||
      inst.address.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus =
      statusFilter === 'ALL' || inst.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  // Calculate overview metrics
  const totalSchools = institutions.length;
  const activeSchools = institutions.filter((i) => i.status === 'ACTIVE').length;
  const totalStudents = institutions.reduce((sum, i) => sum + i.activeStudentsCount, 0);

  const totalMonthlyBillingCents = institutions.reduce((sum, i) => {
    if (i.status !== 'ACTIVE') return sum;
    if (i.billingPlanType === 'FIXED_MONTHLY') {
      return sum + i.monthlyFeeCents;
    } else {
      return sum + i.monthlyFeeCents * i.activeStudentsCount;
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

      {/* Metrics Row (Flat on canvas, NO card-in-card) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Surface className="p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-brand-soft text-brand-dark flex items-center justify-center flex-shrink-0">
            <School size={24} />
          </div>
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
        </Surface>

        <Surface className="p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center flex-shrink-0">
            <Users size={24} />
          </div>
          <div>
            <span className="text-xs font-semibold text-text-secondary uppercase tracking-wider block">
              Alumnos en Plataforma
            </span>
            <div className="text-2xl font-extrabold text-text-primary tabular-nums mt-0.5">
              {totalStudents.toLocaleString('es-AR')}
            </div>
          </div>
        </Surface>

        <Surface className="p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center flex-shrink-0">
            <DollarSign size={24} />
          </div>
          <div>
            <span className="text-xs font-semibold text-text-secondary uppercase tracking-wider block">
              Facturación Estimada
            </span>
            <div className="text-2xl font-extrabold text-emerald-600 tabular-nums mt-0.5">
              {formattedTotalBilling}
              <span className="text-xs text-text-secondary font-normal"> / mes</span>
            </div>
          </div>
        </Surface>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search
            size={18}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-secondary"
          />
          <input
            type="text"
            placeholder="Buscar por nombre, CUIT o dirección..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-surface border border-slate-200 rounded-xl text-sm text-text-primary placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-primary"
          />
        </div>

        <div className="flex items-center gap-2">
          {(['ALL', 'ACTIVE', 'SUSPENDED'] as const).map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-3 py-2 rounded-xl text-xs font-bold transition-colors ${
                statusFilter === status
                  ? 'bg-brand-primary text-white shadow-sm'
                  : 'bg-surface text-text-secondary hover:bg-slate-100 border border-slate-200'
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

      {/* Main Table / Flat List inside Surface (NO CARD-IN-CARD) */}
      <Surface>
        <div className="px-5 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <span className="text-xs font-bold text-text-secondary uppercase tracking-wider">
            Listado de Instituciones ({filteredInstitutions.length})
          </span>
          <span className="text-xs text-text-secondary font-medium">
            Abono fijo mensual vs por alumno activo
          </span>
        </div>

        {isLoading ? (
          <div className="p-12 text-center text-text-secondary text-sm">
            Cargando instituciones...
          </div>
        ) : filteredInstitutions.length === 0 ? (
          <div className="p-12 text-center flex flex-col items-center justify-center gap-2">
            <School size={36} className="text-slate-300" />
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
      </Surface>

      {/* Modal for Creating New Institution */}
      <CreateInstitutionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={handleInstitutionCreated}
      />
    </div>
  );
}
