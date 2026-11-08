'use client';

import React, { useEffect, useState } from 'react';
import { Plus, Ticket, Users, CheckCircle2, AlertCircle } from 'lucide-react';
import { InvitationCode } from '@/shared/api/types';
import { apiClient } from '@/shared/api/api-client';
import { Surface } from '@/shared/ui/Surface';
import { Button } from '@/shared/ui/Button';
import { InvitationRow } from '@/entities/invitation';
import { CreateInvitationModal } from '@/features/invitation-generator';

const DEFAULT_SCHOOL_ID = 'f47ac10b-58cc-4372-a567-0e02b2c3d479'; // Colegio Belgrano Day School

export default function SchoolInvitationsPage() {
  const [invitations, setInvitations] = useState<InvitationCode[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const loadInvitations = async () => {
    setIsLoading(true);
    try {
      const data = await apiClient.getInvitations(DEFAULT_SCHOOL_ID);
      setInvitations(data);
    } catch (err) {
      console.error('Failed to load invitations:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadInvitations();
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

      {/* Metrics Row (NO CARD-IN-CARD) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Surface className="p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-brand-soft text-brand-dark flex items-center justify-center flex-shrink-0">
            <Ticket size={24} />
          </div>
          <div>
            <span className="text-xs font-semibold text-text-secondary uppercase tracking-wider block">
              Códigos Creados
            </span>
            <div className="text-2xl font-extrabold text-text-primary tabular-nums mt-0.5">
              {totalCodes}
            </div>
          </div>
        </Surface>

        <Surface className="p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center flex-shrink-0">
            <Users size={24} />
          </div>
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
        </Surface>

        <Surface className="p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center flex-shrink-0">
            <CheckCircle2 size={24} />
          </div>
          <div>
            <span className="text-xs font-semibold text-text-secondary uppercase tracking-wider block">
              Tasa de Adopción
            </span>
            <div className="text-2xl font-extrabold text-emerald-600 tabular-nums mt-0.5">
              {totalMax > 0 ? Math.round((totalUsed / totalMax) * 100) : 0}%
            </div>
          </div>
        </Surface>
      </div>

      {/* Main Table / Flat List inside Surface (NO CARD-IN-CARD) */}
      <Surface>
        <div className="px-5 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <span className="text-xs font-bold text-text-secondary uppercase tracking-wider">
            Códigos Disponibles ({invitations.length})
          </span>
          <span className="text-xs text-text-secondary font-medium">
            Expira según configuración de directivos
          </span>
        </div>

        {isLoading ? (
          <div className="p-12 text-center text-text-secondary text-sm">
            Cargando códigos de invitación...
          </div>
        ) : invitations.length === 0 ? (
          <div className="p-12 text-center flex flex-col items-center justify-center gap-2">
            <Ticket size={36} className="text-slate-300" />
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
      </Surface>

      {/* Modal for Creating Invitation */}
      <CreateInvitationModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        institutionId={DEFAULT_SCHOOL_ID}
        onSuccess={handleInvitationCreated}
      />
    </div>
  );
}
