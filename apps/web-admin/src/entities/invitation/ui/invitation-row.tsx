'use client';

import React, { useState } from 'react';
import { Ticket, Copy, Check, Clock } from 'lucide-react';
import { InvitationCode } from '@/shared/api/types';
import { Pill } from '@/shared/ui/Pill';

interface InvitationRowProps {
  invitation: InvitationCode;
}

export const InvitationRow: React.FC<InvitationRowProps> = ({ invitation }) => {
  const [copied, setCopied] = useState(false);

  const isExpired = new Date(invitation.expiresAt).getTime() < Date.now();
  const isExhausted = invitation.currentUses >= invitation.maxUses;
  const isValid = invitation.isActive && !isExpired && !isExhausted;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(invitation.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
    }
  };

  const formattedExpiration = new Date(invitation.expiresAt).toLocaleDateString(
    'es-AR',
    {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }
  );

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 sm:p-5 border-b border-slate-100 hover:bg-slate-50/50 transition-colors gap-4">
      {/* 1. Code Badge & Copy */}
      <div className="flex items-center gap-3.5 min-w-[240px]">
        <div className="w-11 h-11 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center flex-shrink-0">
          <Ticket size={22} />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono font-extrabold text-base text-text-primary tracking-wider bg-slate-100 px-2.5 py-0.5 rounded-lg border border-slate-200">
              {invitation.code}
            </span>
            <button
              onClick={handleCopy}
              className="p-1.5 text-text-secondary hover:text-brand-primary rounded-lg transition-colors"
              title="Copiar código"
              aria-label={`Copiar código ${invitation.code}`}
            >
              {copied ? (
                <Check size={16} className="text-emerald-600" />
              ) : (
                <Copy size={16} />
              )}
            </button>
          </div>
          <p className="text-xs text-text-secondary mt-1">
            Creado el {new Date(invitation.createdAt).toLocaleDateString('es-AR')}
          </p>
        </div>
      </div>

      {/* 2. Usage Metric */}
      <div className="flex flex-col gap-1 min-w-[160px]">
        <div className="flex justify-between text-xs text-text-secondary font-medium">
          <span>Usos:</span>
          <span className="font-bold text-text-primary tabular-nums">
            {invitation.currentUses} / {invitation.maxUses}
          </span>
        </div>
        <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${
              isExhausted ? 'bg-rose-500' : 'bg-brand-primary'
            }`}
            style={{
              width: `${Math.min(
                100,
                (invitation.currentUses / invitation.maxUses) * 100
              )}%`,
            }}
          />
        </div>
      </div>

      {/* 3. Expiration & Status */}
      <div className="flex items-center justify-between sm:justify-end gap-3">
        <div className="flex items-center gap-1.5 text-xs text-text-secondary">
          <Clock size={14} />
          <span>Vence {formattedExpiration}</span>
        </div>
        <Pill
          variant={
            isValid ? 'active' : isExhausted ? 'suspended' : 'pending'
          }
          label={isValid ? 'Activo' : isExhausted ? 'Agotado' : 'Vencido'}
        />
      </div>
    </div>
  );
};
