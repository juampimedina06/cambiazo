import { useState, useCallback } from 'react';
import {
  GrantParentalConsentSchema,
  RevokeParentalConsentSchema,
  type ConsentStatus,
} from '@cambiazo/shared';
import {
  evaluateStudentConsentAccess,
  grantParentalConsentAction,
  revokeParentalConsentAction,
  type ConsentRecord,
} from '../../../core';
import { authStore } from '../../../shared/store/auth-store';

export function useParentalConsent() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const grantConsent = useCallback(
    async (params: {
      studentId: string;
      acceptedTermsVersion?: string;
      signatureIp?: string;
    }): Promise<{ success: boolean; consentRecord?: ConsentRecord; error?: string }> => {
      setIsLoading(true);
      setError(null);

      const targetStudentId = params.studentId;
      if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(targetStudentId)) {
        const msg = 'No se encontró un alumno válido para firmar el consentimiento.';
        setError(msg);
        setIsLoading(false);
        return { success: false, error: msg };
      }

      const payload = {
        studentId: targetStudentId,
        acceptedTermsVersion: params.acceptedTermsVersion || 'v1.0',
        acceptedAt: new Date().toISOString(),
        signatureIp: params.signatureIp || '181.164.20.15', // Default standard Argentine IP for mobile client
      };

      const validation = GrantParentalConsentSchema.safeParse(payload);
      if (!validation.success) {
        const msg = validation.error.errors[0]?.message || 'Firma de consentimiento inválida';
        setError(msg);
        setIsLoading(false);
        return { success: false, error: msg };
      }

      try {
        const state = authStore.getState();
        const studentRecord = state.students.find((s) => s.id === targetStudentId) || state.student;
        const result = await grantParentalConsentAction(validation.data, {
          auth: {
            role: 'PARENT',
            userId: state.parent?.id || studentRecord?.parentId,
            institutionId: studentRecord?.institutionId || state.institution?.id,
          },
        });
        if (!result.success || !result.consentRecord) {
          const msg = result.error || 'Error al procesar el consentimiento';
          setError(msg);
          return { success: false, error: msg };
        }

        authStore.updateStudentConsent('GRANTED', targetStudentId);
        return { success: true, consentRecord: result.consentRecord };
      } catch {
        const msg = 'Error de conexión al firmar consentimiento.';
        setError(msg);
        return { success: false, error: msg };
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const revokeConsent = useCallback(
    async (params: {
      studentId: string;
      reason: string;
    }): Promise<{ success: boolean; consentRecord?: ConsentRecord; error?: string }> => {
      setIsLoading(true);
      setError(null);

      const validation = RevokeParentalConsentSchema.safeParse({
        studentId: params.studentId,
        reason: params.reason.trim(),
      });

      if (!validation.success) {
        const msg = validation.error.errors[0]?.message || 'El motivo debe tener al menos 3 caracteres';
        setError(msg);
        setIsLoading(false);
        return { success: false, error: msg };
      }

      try {
        const state = authStore.getState();
        const studentRecord =
          state.students.find((s) => s.id === validation.data.studentId) || state.student;
        const result = await revokeParentalConsentAction(validation.data, {
          auth: {
            role: 'PARENT',
            userId: state.parent?.id || studentRecord?.parentId,
            institutionId: studentRecord?.institutionId || state.institution?.id,
          },
        });
        if (!result.success || !result.consentRecord) {
          const msg = result.error || 'Error al revocar consentimiento';
          setError(msg);
          return { success: false, error: msg };
        }

        authStore.updateStudentConsent('REVOKED', validation.data.studentId);
        return { success: true, consentRecord: result.consentRecord };
      } catch {
        const msg = 'Error de conexión al revocar consentimiento.';
        setError(msg);
        return { success: false, error: msg };
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const checkStudentConsent = useCallback(
    (studentId: string): { allowed: boolean; status: ConsentStatus; reason?: string } => {
      const state = authStore.getState();
      const target =
        state.students.find((s) => s.id === studentId) || state.student;
      return evaluateStudentConsentAccess(target);
    },
    []
  );

  return {
    isLoading,
    error,
    grantConsent,
    revokeConsent,
    checkStudentConsent,
  };
}
