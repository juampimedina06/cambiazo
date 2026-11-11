import { type ConsentStatus } from '@cambiazo/shared';
import type { ApiAuthContext } from '../../api/cambiazoApi';

export interface ConsentRecord {
  id: string;
  studentId: string;
  parentId: string;
  status: ConsentStatus;
  acceptedTermsVersion: string;
  acceptedAt: string;
  signatureIp: string;
  revokedAt?: string;
  revocationReason?: string;
}

export interface ConsentActionResult {
  success: boolean;
  consentRecord?: ConsentRecord;
  error?: string;
}

export interface StudentAccessCheckResult {
  allowed: boolean;
  status: ConsentStatus;
  reason?: string;
}

export interface ConsentBackendResponse {
  id?: string;
  consentId?: string;
  status?: string;
  grantedAt?: string;
  revokedAt?: string;
}

export interface ConsentStatusApiOptions {
  auth?: ApiAuthContext;
}

