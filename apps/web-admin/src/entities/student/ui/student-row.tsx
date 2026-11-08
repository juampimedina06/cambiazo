'use client';

import React, { useState } from 'react';
import {
  GraduationCap,
  ShieldCheck,
  ShieldAlert,
  Clock,
  Info,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import { StudentRosterItem, ConsentStatus } from '@/shared/api/types';
import { Pill } from '@/shared/ui/Pill';
import { Button } from '@/shared/ui/Button';
import { Modal } from '@/shared/ui/Modal';

interface StudentRowProps {
  student: StudentRosterItem;
  onUpdateConsent?: (
    studentId: string,
    status: ConsentStatus,
    reason?: string
  ) => void;
}

export const StudentRow: React.FC<StudentRowProps> = ({
  student,
  onUpdateConsent,
}) => {
  const [showAuditModal, setShowAuditModal] = useState(false);
  const [showRevokeModal, setShowRevokeModal] = useState(false);
  const [revokeReason, setRevokeReason] = useState('');

  const formattedBalance = new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    maximumFractionDigits: 0,
  }).format(student.walletBalanceCents / 100);

  const getStatusBadge = () => {
    switch (student.consentStatus) {
      case 'GRANTED':
        return (
          <Pill
            variant="granted"
            icon={<ShieldCheck size={14} />}
            label="Consentimiento Otorgado"
          />
        );
      case 'REVOKED':
        return (
          <Pill
            variant="revoked"
            icon={<ShieldAlert size={14} />}
            label="Consentimiento Revocado"
          />
        );
      case 'PENDING':
      default:
        return (
          <Pill
            variant="pending"
            icon={<Clock size={14} />}
            label="Pendiente de Firma"
          />
        );
    }
  };

  const handleGrantConsent = () => {
    if (onUpdateConsent) {
      onUpdateConsent(student.studentId, 'GRANTED');
    }
  };

  const handleRevokeConsent = () => {
    if (onUpdateConsent && revokeReason.trim().length >= 3) {
      onUpdateConsent(student.studentId, 'REVOKED', revokeReason.trim());
      setShowRevokeModal(false);
      setRevokeReason('');
    }
  };

  return (
    <>
      <div className="flex flex-col lg:flex-row lg:items-center justify-between p-4 sm:p-5 border-b border-slate-100 hover:bg-slate-50/50 transition-colors gap-4">
        {/* 1. Student Identity */}
        <div className="flex items-center gap-3.5 min-w-[260px]">
          <div className="w-12 h-12 rounded-2xl bg-brand-soft text-brand-dark flex items-center justify-center flex-shrink-0">
            <GraduationCap size={22} />
          </div>
          <div>
            <h4 className="font-bold text-text-primary text-base leading-tight">
              {student.studentName}
            </h4>
            <p className="text-xs text-text-secondary mt-0.5">
              {student.grade} • DNI {student.studentDni}
            </p>
            <div className="flex items-center gap-3 mt-1.5 text-xs font-semibold">
              <span className="text-emerald-600">
                Saldo: {formattedBalance}
              </span>
              <span className="text-amber-600">
                ⭐ {student.communityPoints} Pts
              </span>
            </div>
          </div>
        </div>

        {/* 2. Family & Parent Contact */}
        <div className="flex flex-col min-w-[220px]">
          <span className="text-xs font-semibold text-text-secondary uppercase tracking-wider">
            Tutor / Responsable
          </span>
          <span className="font-bold text-text-primary text-sm mt-0.5">
            {student.parentName}
          </span>
          <span className="text-xs text-text-secondary mt-0.5">
            {student.parentEmail} • {student.parentPhone}
          </span>
        </div>

        {/* 3. Parental Consent Status & Audit Action */}
        <div className="flex items-center justify-between lg:justify-end gap-3 flex-wrap">
          {getStatusBadge()}

          <button
            onClick={() => setShowAuditModal(true)}
            className="flex items-center gap-1 text-xs text-brand-primary hover:text-brand-dark font-semibold px-2 py-1.5 rounded-lg hover:bg-brand-soft/50 transition-colors"
            title="Ver trazabilidad Ley 25.326"
          >
            <Info size={14} />
            <span>Auditoría</span>
          </button>

          {onUpdateConsent && (
            <div className="flex items-center gap-2">
              {student.consentStatus !== 'GRANTED' && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleGrantConsent}
                  icon={<CheckCircle size={14} className="text-emerald-600" />}
                >
                  Otorgar
                </Button>
              )}
              {student.consentStatus === 'GRANTED' && (
                <Button
                  size="sm"
                  variant="danger"
                  onClick={() => setShowRevokeModal(true)}
                  icon={<XCircle size={14} />}
                >
                  Revocar
                </Button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Parental Consent Audit Trail Modal (Ley 25.326) */}
      <Modal
        isOpen={showAuditModal}
        onClose={() => setShowAuditModal(false)}
        title="Registro de Consentimiento Parental (Ley 25.326)"
        description={`Trazabilidad legal para ${student.studentName} y su tutor ${student.parentName}`}
      >
        <div className="flex flex-col gap-4 text-sm">
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex flex-col gap-2">
            <div className="flex justify-between items-center">
              <span className="text-text-secondary">Estado Actual:</span>
              {getStatusBadge()}
            </div>
            <div className="flex justify-between items-center">
              <span className="text-text-secondary">Alumno:</span>
              <span className="font-semibold text-text-primary">
                {student.studentName} (DNI {student.studentDni})
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-text-secondary">Padre/Tutor:</span>
              <span className="font-semibold text-text-primary">
                {student.parentName} ({student.parentEmail})
              </span>
            </div>
          </div>

          {student.consentStatus === 'GRANTED' && (
            <div className="p-4 bg-emerald-50/60 rounded-xl border border-emerald-200 flex flex-col gap-2">
              <h5 className="font-bold text-emerald-900 text-sm flex items-center gap-2">
                <ShieldCheck size={16} /> Firma Electrónica Registrada
              </h5>
              <div className="grid grid-cols-2 gap-2 text-xs mt-1">
                <div>
                  <span className="text-emerald-700 block">Versión Términos:</span>
                  <span className="font-mono font-bold text-emerald-950">
                    {student.consentAudit.acceptedTermsVersion || 'v1.2-2026'}
                  </span>
                </div>
                <div>
                  <span className="text-emerald-700 block">Dirección IP:</span>
                  <span className="font-mono font-bold text-emerald-950">
                    {student.consentAudit.signatureIp || '181.44.12.98'}
                  </span>
                </div>
                <div className="col-span-2">
                  <span className="text-emerald-700 block">Fecha y Hora de Firma:</span>
                  <span className="font-bold text-emerald-950">
                    {student.consentAudit.signedAt
                      ? new Date(student.consentAudit.signedAt).toLocaleString(
                          'es-AR'
                        )
                      : 'No registrada'}
                  </span>
                </div>
              </div>
            </div>
          )}

          {student.consentStatus === 'REVOKED' && (
            <div className="p-4 bg-rose-50 rounded-xl border border-rose-200 flex flex-col gap-2">
              <h5 className="font-bold text-rose-900 text-sm flex items-center gap-2">
                <ShieldAlert size={16} /> Consentimiento Revocado
              </h5>
              <p className="text-xs text-rose-800">
                <strong>Motivo de revocación:</strong>{' '}
                {student.consentAudit.revocationReason || 'No especificado'}
              </p>
              {student.consentAudit.revokedAt && (
                <p className="text-xs text-rose-700">
                  Fecha de revocación:{' '}
                  {new Date(student.consentAudit.revokedAt).toLocaleString(
                    'es-AR'
                  )}
                </p>
              )}
            </div>
          )}

          {student.consentStatus === 'PENDING' && (
            <div className="p-4 bg-amber-50 rounded-xl border border-amber-200">
              <p className="text-xs text-amber-800">
                El alumno tiene su cuenta temporalmente pausada hasta que el tutor
                complete la firma digital mediante el código de invitación escolar.
              </p>
            </div>
          )}

          <div className="flex justify-end pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowAuditModal(false)}
            >
              Cerrar
            </Button>
          </div>
        </div>
      </Modal>

      {/* Revocation Reason Modal */}
      <Modal
        isOpen={showRevokeModal}
        onClose={() => setShowRevokeModal(false)}
        title="Revocar Consentimiento Parental"
        description={`Confirmar la revocación para ${student.studentName}. El alumno no podrá realizar compras en el kiosco.`}
      >
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-text-primary">
              Motivo de Revocación (mínimo 3 caracteres)
            </label>
            <textarea
              className="w-full p-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-rose-400"
              rows={3}
              placeholder="Ej: Solicitud formal del padre/tutor o baja de matrícula."
              value={revokeReason}
              onChange={(e) => setRevokeReason(e.target.value)}
            />
          </div>
          <div className="flex justify-end gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowRevokeModal(false)}
            >
              Cancelar
            </Button>
            <Button
              variant="danger"
              size="sm"
              disabled={revokeReason.trim().length < 3}
              onClick={handleRevokeConsent}
            >
              Confirmar Revocación
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
};
