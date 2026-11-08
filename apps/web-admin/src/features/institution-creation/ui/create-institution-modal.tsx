'use client';

import React, { useState } from 'react';
import { CreateInstitutionSchema } from '@cambiazo/shared';
import { CreateInstitutionInput, Institution } from '@/shared/api/types';
import { apiClient } from '@/shared/api/api-client';
import { Modal } from '@/shared/ui/Modal';
import { Input } from '@/shared/ui/Input';
import { Button } from '@/shared/ui/Button';

interface CreateInstitutionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (institution: Institution) => void;
}

export const CreateInstitutionModal: React.FC<CreateInstitutionModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [formData, setFormData] = useState({
    name: '',
    cuit: '',
    address: '',
    billingPlanType: 'FIXED_MONTHLY' as 'FIXED_MONTHLY' | 'PER_ACTIVE_STUDENT',
    monthlyFeePesos: '45000',
    schoolAdminEmail: '',
    kioskEmail: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [generalError, setGeneralError] = useState<string | null>(null);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
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

    // Convert fee to cents
    const feePesosNum = Number(formData.monthlyFeePesos);
    const feeCents = Math.round(feePesosNum * 100);

    const payload: CreateInstitutionInput = {
      name: formData.name.trim(),
      cuit: formData.cuit.trim(),
      address: formData.address.trim(),
      billingPlanType: formData.billingPlanType,
      monthlyFeeCents: feeCents,
      schoolAdminEmail: formData.schoolAdminEmail.trim(),
      kioskEmail: formData.kioskEmail.trim(),
    };

    // Validate using Zod schema
    const parseResult = CreateInstitutionSchema.safeParse(payload);
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
      const created = await apiClient.createInstitution(parseResult.data);
      onSuccess(created);
      onClose();
      // Reset form
      setFormData({
        name: '',
        cuit: '',
        address: '',
        billingPlanType: 'FIXED_MONTHLY',
        monthlyFeePesos: '45000',
        schoolAdminEmail: '',
        kioskEmail: '',
      });
      setErrors({});
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Error al dar de alta la institución';
      setGeneralError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Alta de Institución Educativa"
      description="Crear una nueva escuela y configurar los accesos de administración y kiosco."
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {generalError && (
          <div className="p-3 bg-red-50 text-red-700 text-sm rounded-xl border border-red-200 font-medium">
            {generalError}
          </div>
        )}

        {/* Section 1: School General Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Nombre de la Institución"
            name="name"
            placeholder="Ej: Colegio San Jorge"
            value={formData.name}
            onChange={handleChange}
            error={errors.name}
            required
          />

          <Input
            label="CUIT (con o sin guiones)"
            name="cuit"
            placeholder="30-11223344-5"
            value={formData.cuit}
            onChange={handleChange}
            error={errors.cuit}
            helperText="Formato argentino: 30-xxxxxxxx-x"
            required
          />

          <div className="md:col-span-2">
            <Input
              label="Dirección de la Sede Escolar"
              name="address"
              placeholder="Ej: Av. Santa Fe 3200, CABA"
              value={formData.address}
              onChange={handleChange}
              error={errors.address}
              required
            />
          </div>
        </div>

        {/* Section 2: Billing & Subscription Plan */}
        <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex flex-col gap-3">
          <h4 className="text-xs font-bold text-text-secondary uppercase tracking-wider">
            Plan de Facturación y Abono Mensual
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="billingPlanType"
                className="text-sm font-semibold text-text-primary"
              >
                Modalidad del Abono
              </label>
              <select
                id="billingPlanType"
                name="billingPlanType"
                value={formData.billingPlanType}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary"
              >
                <option value="FIXED_MONTHLY">Abono Fijo Mensual</option>
                <option value="PER_ACTIVE_STUDENT">Por Alumno Activo</option>
              </select>
            </div>

            <Input
              label={
                formData.billingPlanType === 'FIXED_MONTHLY'
                  ? 'Monto Mensual en Pesos ($)'
                  : 'Costo por Alumno Activo en Pesos ($)'
              }
              name="monthlyFeePesos"
              type="number"
              min="1"
              placeholder="45000"
              value={formData.monthlyFeePesos}
              onChange={handleChange}
              error={errors.monthlyFeeCents}
              required
            />
          </div>
        </div>

        {/* Section 3: Initial Staff Accounts */}
        <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex flex-col gap-3">
          <h4 className="text-xs font-bold text-text-secondary uppercase tracking-wider">
            Accesos Iniciales de Personal (Roles de Plataforma)
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Email Directivo (SCHOOL_ADMIN)"
              name="schoolAdminEmail"
              type="email"
              placeholder="directorio@escuela.edu.ar"
              value={formData.schoolAdminEmail}
              onChange={handleChange}
              error={errors.schoolAdminEmail}
              helperText="Recibirá la invitación para administrar códigos y alumnos"
              required
            />

            <Input
              label="Email Kiosco Escolar (KIOSK)"
              name="kioskEmail"
              type="email"
              placeholder="kiosco@escuela.edu.ar"
              value={formData.kioskEmail}
              onChange={handleChange}
              error={errors.kioskEmail}
              helperText="Accederá al lector POS para cobros rápidos"
              required
            />
          </div>
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
            Crear Institución
          </Button>
        </div>
      </form>
    </Modal>
  );
};
