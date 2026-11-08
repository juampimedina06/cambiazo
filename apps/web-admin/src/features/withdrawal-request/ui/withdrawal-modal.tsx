'use client';

import React, { useState, useEffect } from 'react';
import { Modal } from '@/shared/ui/Modal';
import { Input } from '@/shared/ui/Input';
import { Button } from '@/shared/ui/Button';
import { KioskWithdrawalRequestInput, KioskLedgerBalance } from '@/shared/api/types';
import { KioskWithdrawalRequestSchema } from '@cambiazo/shared';
import { AlertCircle, ShieldCheck, ArrowUpRight } from 'lucide-react';

interface WithdrawalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: KioskWithdrawalRequestInput) => Promise<void>;
  balance: KioskLedgerBalance;
}

export const WithdrawalModal: React.FC<WithdrawalModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  balance,
}) => {
  const [amountPesos, setAmountPesos] = useState('');
  const [mercadoPagoAliasOrCvu, setMercadoPagoAliasOrCvu] = useState('');
  const [idempotencyKey, setIdempotencyKey] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Generate unique idempotency key when opening modal
  useEffect(() => {
    if (isOpen) {
      const key =
        typeof crypto !== 'undefined' && crypto.randomUUID
          ? crypto.randomUUID()
          : `with-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
      setIdempotencyKey(key);
      setAmountPesos('');
      setMercadoPagoAliasOrCvu('');
      setErrors({});
    }
  }, [isOpen]);

  const maxAvailablePesos = balance.availableBalanceCents / 100;

  const handleSetMaxAmount = () => {
    setAmountPesos(maxAvailablePesos.toString());
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const parsedPesos = parseFloat(amountPesos);
    if (isNaN(parsedPesos) || parsedPesos <= 0) {
      setErrors((prev) => ({
        ...prev,
        amountPesos: 'Ingresa un monto en pesos mayor a $0.',
      }));
      return;
    }

    const amountCents = Math.round(parsedPesos * 100);
    if (amountCents > balance.availableBalanceCents) {
      const maxFormatted = new Intl.NumberFormat('es-AR', {
        style: 'currency',
        currency: 'ARS',
      }).format(maxAvailablePesos);

      setErrors((prev) => ({
        ...prev,
        amountPesos: `El monto solicitado excede tu saldo disponible (${maxFormatted}).`,
      }));
      return;
    }

    const payload: KioskWithdrawalRequestInput = {
      amountCents,
      mercadoPagoAliasOrCvu: mercadoPagoAliasOrCvu.trim(),
      idempotencyKey,
    };

    // Validate with shared Zod schema
    const result = KioskWithdrawalRequestSchema.safeParse(payload);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.errors.forEach((err) => {
        const fieldName = err.path[0]?.toString() || 'general';
        fieldErrors[fieldName] = err.message;
      });
      setErrors(fieldErrors);
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(payload);
      onClose();
    } catch (err: unknown) {
      setErrors({
        general:
          err instanceof Error
            ? err.message
            : 'Error inesperado al solicitar el retiro de fondos.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Solicitar Retiro a Mercado Pago"
      description="Transfiere los fondos recaudados en el kiosco escolar a tu cuenta bancaria o CVU/Alias de Mercado Pago."
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        {errors.general && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-xs text-red-700">
            <AlertCircle size={16} className="flex-shrink-0" />
            <span>{errors.general}</span>
          </div>
        )}

        {/* 0% Platform Fee Banner */}
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-start gap-3">
          <ShieldCheck size={20} className="text-emerald-700 flex-shrink-0 mt-0.5" />
          <div className="text-xs text-emerald-900 leading-relaxed">
            <span className="font-bold block">
              Liquidación 100% Neta (0% Comisión de Plataforma)
            </span>
            CAMBIAZO no descuenta comisiones por intermediación de pagos escolares. El 100% del monto solicitado se acreditará en tu cuenta de Mercado Pago vinculada.
          </div>
        </div>

        {/* Amount Input with Max Button */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label
              htmlFor="withdrawal-amount"
              className="text-sm font-semibold text-text-primary"
            >
              Monto a Retirar ($ ARS)
            </label>
            <button
              type="button"
              onClick={handleSetMaxAmount}
              className="text-xs font-bold text-brand-primary hover:text-brand-dark transition-colors"
            >
              Retirar Saldo Total (${maxAvailablePesos.toLocaleString('es-AR')})
            </button>
          </div>

          <Input
            id="withdrawal-amount"
            label=""
            type="number"
            min="1"
            max={maxAvailablePesos}
            step="1"
            placeholder="Ej. 25000"
            value={amountPesos}
            onChange={(e) => setAmountPesos(e.target.value)}
            error={errors.amountPesos || errors.amountCents}
            helperText={
              amountPesos
                ? `Equivale a ${(parseFloat(amountPesos) || 0).toLocaleString('es-AR', {
                    style: 'currency',
                    currency: 'ARS',
                  })} (${Math.round((parseFloat(amountPesos) || 0) * 100)} centavos contables)`
                : `Saldo disponible en libro mayor: $${maxAvailablePesos.toLocaleString('es-AR')}`
            }
            required
          />
        </div>

        {/* Mercado Pago Alias or CVU */}
        <Input
          label="CVU o Alias de Mercado Pago"
          placeholder="Ej. kiosco.belgrano.mp o 0000003100084920194821"
          value={mercadoPagoAliasOrCvu}
          onChange={(e) => setMercadoPagoAliasOrCvu(e.target.value)}
          error={errors.mercadoPagoAliasOrCvu}
          helperText="El alias o CVU de 22 dígitos registrado en Mercado Pago a nombre del titular."
          required
        />

        {/* Idempotency Key Notice */}
        <div className="p-3 bg-slate-50 rounded-xl text-[11px] text-text-secondary flex items-center justify-between">
          <span>Clave de Idempotencia única:</span>
          <span className="font-mono text-slate-500 font-semibold" title={idempotencyKey}>
            {idempotencyKey.substring(0, 18)}...
          </span>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
          <Button
            type="button"
            variant="ghost"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            variant="primary"
            isLoading={isSubmitting}
            icon={<ArrowUpRight size={16} />}
          >
            Confirmar Retiro
          </Button>
        </div>
      </form>
    </Modal>
  );
};
