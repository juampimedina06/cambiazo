import { useState, useCallback } from 'react';
import {
  GrantParentalConsentSchema,
  RevokeParentalConsentSchema,
  type ConsentStatus,
} from '@cambiazo/shared';
import {
  mockApiClient,
  type MockConsentRecord,
} from '../../../shared/api/mock-client';
import { authStore } from '../../../shared/store/auth-store';

export function useParentalConsent() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const grantConsent = useCallback(
    async (params: {
      studentId: string;
      acceptedTermsVersion?: string;
      signatureIp?: string;
    }): Promise<{ success: boolean; consentRecord?: MockConsentRecord; error?: string }> => {
      setIsLoading(true);
      setError(null);

      let targetStudentId = params.studentId;
      if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(targetStudentId)) {
        targetStudentId = '22222222-2222-4222-8222-222222222222';
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
        const result = await mockApiClient.grantParentalConsent(validation.data);
        if (!result.success || !result.consentRecord) {
          const msg = result.error || 'Error al procesar el consentimiento';
          setError(msg);
          return { success: false, error: msg };
        }

        authStore.updateStudentConsent('GRANTED');
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
    }): Promise<{ success: boolean; consentRecord?: MockConsentRecord; error?: string }> => {
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
        const result = await mockApiClient.revokeParentalConsent(validation.data);
        if (!result.success || !result.consentRecord) {
          const msg = result.error || 'Error al revocar consentimiento';
          setError(msg);
          return { success: false, error: msg };
        }

        authStore.updateStudentConsent('REVOKED');
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
      return mockApiClient.checkStudentAccess(studentId);
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
