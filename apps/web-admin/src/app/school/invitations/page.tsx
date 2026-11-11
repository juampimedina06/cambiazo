'use client';

import React, { useEffect, useState } from 'react';
import { Plus, Ticket, Users, CheckCircle2 } from 'lucide-react';
import { InvitationCode } from '@/shared/api/types';
import { apiClient } from '@/shared/api/api-client';
import { getActiveInstitutionId } from '@/shared/api/tenant';
import { Button } from '@/shared/ui/Button';
import { InvitationRow } from '@/entities/invitation';
import { CreateInvitationModal } from '@/features/invitation-generator';

export default function SchoolInvitationsPage() {
  const [invitations, setInvitations] = useState<InvitationCode[]>([]);
  const [institutionId, setInstitutionId] = useState<string>(() => getActiveInstitutionId());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [apiError, setApiError] = useState<string | null>(null);

  const loadInvitations = async (targetId: string = institutionId) => {
    setIsLoading(true);
    setApiError(null);
    try {
      const data = await apiClient.getInvitations(targetId);
      setInvitations(data);
    } catch (err) {
      console.error('Failed to load invitations:', err);
      setApiError(
        err instanceof Error
          ? err.message
          : 'No se pudieron cargar los códigos de invitación.'
      );
      setInvitations([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const activeId = getActiveInstitutionId();
    setInstitutionId(activeId);
    loadInvitations(activeId);
  }, []);

  const handleInvitationCreated = (newInv: InvitationCode) => {
    setInvitations((prev) => [newInv, ...prev]);
  };

  // Metrics
  const totalCodes = invitations.length;
  const totalUsed = invitations.reduce((sum, inv) => sum + inv.currentUses, 0);
  const totalMax = invitations.reduce((sum, inv) => sum + inv.maxUses, 0);

  return (
    <div className="flex flex-col gap-6">
      {/* Header and Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-text-primary tracking-tight">
            Códigos de Invitación Escolar
          </h1>
          <p className="text-text-secondary text-sm mt-1">
            Genera y administra códigos de acceso para que los padres y tutores vinculen a sus hijos a la institución.
          </p>
        </div>

        <Button
          size="lg"
          variant="primary"
          onClick={() => setIsModalOpen(true)}
          icon={<Plus size={20} />}
        >
          Generar Código
        </Button>
      </div>

      {/* Open Editorial Metrics Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 border-y border-slate-200/70 dark:border-white/[0.08] divide-y sm:divide-y-0 sm:divide-x divide-slate-200/70 dark:divide-white/[0.08]">
        <div className="py-4 sm:pr-6 flex items-center gap-3.5">
          <Ticket size={20} className="text-brand-primary dark:text-purple-300 flex-shrink-0" />
          <div>
            <span className="text-xs font-semibold text-text-secondary uppercase tracking-wider block">
              Códigos Creados
            </span>
            <div className="text-2xl font-extrabold text-text-primary tabular-nums mt-0.5">
              {totalCodes}
            </div>
          </div>
        </div>

        <div className="py-4 sm:px-6 flex items-center gap-3.5">
          <Users size={20} className="text-amber-600 dark:text-amber-300 flex-shrink-0" />
          <div>
            <span className="text-xs font-semibold text-text-secondary uppercase tracking-wider block">
              Familias Vinculadas
            </span>
            <div className="text-2xl font-extrabold text-text-primary tabular-nums mt-0.5">
              {totalUsed}{' '}
              <span className="text-xs text-text-secondary font-normal">
                de {totalMax} cupos
              </span>
            </div>
          </div>
        </div>

        <div className="py-4 sm:pl-6 flex items-center gap-3.5">
          <CheckCircle2 size={20} className="text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
          <div>
            <span className="text-xs font-semibold text-text-secondary uppercase tracking-wider block">
              Tasa de Adopción
            </span>
            <div className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 tabular-nums mt-0.5">
              {totalMax > 0 ? Math.round((totalUsed / totalMax) * 100) : 0}%
            </div>
          </div>
        </div>
      </div>

      {/* Open List directly on canvas */}
      <section className="border-t border-slate-200/70 dark:border-white/[0.08]">
        <div className="py-3.5 border-b border-slate-200/60 dark:border-white/[0.07] flex justify-between items-center">
          <span className="text-xs font-bold text-text-secondary uppercase tracking-wider">
            Códigos Disponibles ({invitations.length})
          </span>
          <span className="text-xs text-text-muted font-medium">
            Vigencia institucional
          </span>
        </div>

        {apiError ? (
          <div className="py-10 text-center flex flex-col items-center gap-3">
            <p className="text-sm font-semibold text-red-600 dark:text-red-400">
              {apiError}
            </p>
            <Button size="sm" variant="outline" onClick={() => loadInvitations(institutionId)}>
              Reintentar
            </Button>
          </div>
        ) : isLoading ? (
          <div className="py-12 text-center text-text-secondary text-sm">
            Cargando códigos de invitación...
          </div>
        ) : invitations.length === 0 ? (
          <div className="py-12 text-center flex flex-col items-center justify-center gap-2">
            <Ticket size={36} className="text-slate-300 dark:text-slate-600" />
            <p className="font-semibold text-text-primary text-base">
              No hay códigos generados
            </p>
            <p className="text-xs text-text-secondary max-w-sm">
              Crea tu primer código de invitación para iniciar el registro de familias.
            </p>
          </div>
        ) : (
          <div>
            {invitations.map((inv) => (
              <InvitationRow key={inv.id} invitation={inv} />
            ))}
          </div>
        )}
      </section>

      {/* Modal for Creating Invitation */}
      <CreateInvitationModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        institutionId={institutionId}
        onSuccess={handleInvitationCreated}
      />
    </div>
  );
}
