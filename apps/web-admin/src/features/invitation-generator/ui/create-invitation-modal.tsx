'use client';

import React, { useState } from 'react';
import { CreateInvitationSchema } from '@cambiazo/shared';
import { CreateInvitationInput, InvitationCode } from '@/shared/api/types';
import { apiClient } from '@/shared/api/api-client';
import { Modal } from '@/shared/ui/Modal';
import { Input } from '@/shared/ui/Input';
import { Button } from '@/shared/ui/Button';

interface CreateInvitationModalProps {
  isOpen: boolean;
  onClose: () => void;
  institutionId: string;
  onSuccess: (invitation: InvitationCode) => void;
}

export const CreateInvitationModal: React.FC<CreateInvitationModalProps> = ({
  isOpen,
  onClose,
  institutionId,
  onSuccess,
}) => {
  // Default expiration in 90 days
  const defaultDate = new Date();
  defaultDate.setDate(defaultDate.getDate() + 90);
  const defaultDateStr = defaultDate.toISOString().split('T')[0]!;

  const [formData, setFormData] = useState({
    code: '',
    maxUses: '150',
    expiresAtDate: defaultDateStr,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [generalError, setGeneralError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGeneralError(null);

    const expiresAtIso = formData.expiresAtDate
      ? new Date(`${formData.expiresAtDate}T23:59:59.000Z`).toISOString()
      : undefined;

    const payload: CreateInvitationInput = {
      institutionId,
      code: formData.code.trim() ? formData.code.trim().toUpperCase() : undefined,
      maxUses: formData.maxUses ? parseInt(formData.maxUses, 10) : undefined,
      expiresAt: expiresAtIso,
    };

    const parseResult = CreateInvitationSchema.safeParse(payload);
    if (!parseResult.success) {
      const fieldErrors: Record<string, string> = {};
      parseResult.error.issues.forEach((issue) => {
        const fieldName = issue.path[0] as string;
        fieldErrors[fieldName] = issue.message;
      });
      setErrors(fieldErrors);
      return;
    }

    setIsSubmitting(true);
    try {
      const created = await apiClient.createInvitation(parseResult.data);
      onSuccess(created);
      onClose();
      setFormData({
        code: '',
        maxUses: '150',
        expiresAtDate: defaultDateStr,
      });
      setErrors({});
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : 'Error al generar código de invitación';
      setGeneralError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Nuevo Código de Invitación"
      description="Generar un código para el registro de alumnos y familias en la escuela."
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {generalError && (
          <div className="p-3 bg-red-50 text-red-700 text-sm rounded-xl border border-red-200">
            {generalError}
          </div>
        )}

        <Input
          label="Código Personalizado (Opcional)"
          name="code"
          placeholder="Ej: BELGRANO-2026 (autogenerado si se omite)"
          value={formData.code}
          onChange={handleChange}
          error={errors.code}
          helperText="Alfanumérico de 4 a 32 caracteres (guiones permitidos)"
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Límite Máximo de Usos"
            name="maxUses"
            type="number"
            min="1"
            placeholder="150"
            value={formData.maxUses}
            onChange={handleChange}
            error={errors.maxUses}
            helperText="Cantidad máxima de familias que pueden registrarse"
            required
          />

          <Input
            label="Fecha de Expiración"
            name="expiresAtDate"
            type="date"
            value={formData.expiresAtDate}
            onChange={handleChange}
            error={errors.expiresAt}
            required
          />
        </div>

        <div className="flex items-center justify-end gap-3 pt-3">
          <Button
            type="button"
            variant="ghost"
            size="md"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            variant="primary"
            size="md"
            isLoading={isSubmitting}
          >
            Generar Código
          </Button>
        </div>
      </form>
    </Modal>
  );
};
