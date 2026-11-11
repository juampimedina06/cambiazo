import {
  GrantParentalConsentSchema,
  RevokeParentalConsentSchema,
  type ConsentStatus,
  type GrantParentalConsentDto,
  type RevokeParentalConsentDto,
} from '@cambiazo/shared';
import {
  ApiClientError,
  cambiazoApi,
  extractApiErrorMessage,
  normalizeConsentStatus,
} from '../../api/cambiazoApi';
import type { StudentProfile } from '../../auth/interface/auth.interface';
import type {
  ConsentActionResult,
  ConsentBackendResponse,
  ConsentRecord,
  ConsentStatusApiOptions,
  StudentAccessCheckResult,
} from '../interface/consent.interface';

export async function grantParentalConsentAction(
  input: GrantParentalConsentDto,
  options?: ConsentStatusApiOptions
): Promise<ConsentActionResult> {
  const validation = GrantParentalConsentSchema.safeParse(input);
  if (!validation.success) {
    return {
      success: false,
      error: validation.error.errors[0]?.message || 'Firma de consentimiento inválida',
    };
  }

  try {
    const response = await cambiazoApi.post<ConsentBackendResponse>(
      '/consents/grant',
      validation.data,
      {
        auth: {
          role: 'PARENT',
          ...options?.auth,
        },
      },
      'Error al firmar consentimiento'
    );

    const consentRecord: ConsentRecord = {
      id: response.consentId || response.id || '',
      studentId: validation.data.studentId,
      parentId: options?.auth?.userId || '',
      status: 'GRANTED',
      acceptedTermsVersion: validation.data.acceptedTermsVersion,
      acceptedAt: response.grantedAt || validation.data.acceptedAt,
      signatureIp: validation.data.signatureIp,
    };

    return {
      success: true,
      consentRecord,
    };
  } catch (error) {
    return {
      success: false,
      error: extractApiErrorMessage(error, 'Error al firmar consentimiento'),
    };
  }
}

export async function revokeParentalConsentAction(
  input: RevokeParentalConsentDto,
  options?: ConsentStatusApiOptions
): Promise<ConsentActionResult> {
  const validation = RevokeParentalConsentSchema.safeParse(input);
  if (!validation.success) {
    return {
      success: false,
      error: validation.error.errors[0]?.message || 'Motivo de revocación inválido',
    };
  }

  try {
    const response = await cambiazoApi.post<ConsentBackendResponse>(
      '/consents/revoke',
      validation.data,
      {
        auth: {
          role: 'PARENT',
          ...options?.auth,
        },
      },
      'Error al revocar consentimiento'
    );

    const consentRecord: ConsentRecord = {
      id: response.consentId || response.id || '',
      studentId: validation.data.studentId,
      parentId: options?.auth?.userId || '',
      status: 'REVOKED',
      acceptedTermsVersion: 'v1.0',
      acceptedAt: new Date().toISOString(),
      signatureIp: '127.0.0.1',
      revokedAt: response.revokedAt || new Date().toISOString(),
      revocationReason: validation.data.reason,
    };

    return {
      success: true,
      consentRecord,
    };
  } catch (error) {
    return {
      success: false,
      error: extractApiErrorMessage(error, 'Error al revocar consentimiento'),
    };
  }
}

export async function fetchConsentStatusAction(
  studentId: string,
  options?: ConsentStatusApiOptions
): Promise<ConsentStatus> {
  try {
    const response = await cambiazoApi.get<{
      consentStatus?: string;
      status?: string;
    }>(
      `/consents/status/${encodeURIComponent(studentId)}`,
      { auth: options?.auth }
    );
    return normalizeConsentStatus(response.consentStatus ?? response.status);
  } catch (error) {
    if (error instanceof ApiClientError) {
      if (error.code === 'PARENTAL_CONSENT_REVOKED') {
        return 'REVOKED';
      }
      if (error.code === 'PARENTAL_CONSENT_REQUIRED') {
        return 'PENDING';
      }
    }
    return options?.fallbackStatus ?? 'PENDING';
  }
}

export function evaluateStudentConsentAccess(
  student: Pick<StudentProfile, 'consentStatus'> | null | undefined,
  revocationReason?: string
): StudentAccessCheckResult {
  if (!student) {
    return {
      allowed: false,
      status: 'PENDING',
      reason: 'Alumno no encontrado',
    };
  }

  if (student.consentStatus === 'PENDING') {
    return {
      allowed: false,
      status: 'PENDING',
      reason:
        'Tu padre o tutor aún debe aceptar el consentimiento digital para habilitar tu cuenta.',
    };
  }

  if (student.consentStatus === 'REVOKED') {
    return {
      allowed: false,
      status: 'REVOKED',
      reason: revocationReason
        ? `Tu acceso fue suspendido por tu tutor: ${revocationReason}`
        : 'Tu acceso fue revocado por tu tutor.',
    };
  }

  return {
    allowed: true,
    status: 'GRANTED',
  };
}

