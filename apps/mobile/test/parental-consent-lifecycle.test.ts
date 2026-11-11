import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  GrantParentalConsentSchema,
  RevokeParentalConsentSchema,
} from '@cambiazo/shared';
import {
  fetchConsentStatusAction,
  grantParentalConsentAction,
  revokeParentalConsentAction,
} from '../src/core';
import { installTestBackend, TEST_STUDENT_ID } from './helpers/test-backend';

describe('Digital Parental Consent Lifecycle (Ley 25.326)', () => {
  const studentId = TEST_STUDENT_ID;
  let restoreFetch: (() => void) | null = null;

  beforeEach(() => {
    restoreFetch = installTestBackend().restore;
  });

  afterEach(() => {
    restoreFetch?.();
  });

  describe('GrantParentalConsentSchema & grantParentalConsentAction', () => {
    it('accepts valid consent signature with IPv4, ISO timestamp, and terms version', () => {
      const payload = {
        studentId,
        acceptedTermsVersion: 'v1.0-ley25326',
        acceptedAt: new Date().toISOString(),
        signatureIp: '181.164.20.15',
      };
      const res = GrantParentalConsentSchema.safeParse(payload);
      expect(res.success).toBe(true);
    });

    it('accepts valid consent signature with IPv6', () => {
      const payload = {
        studentId,
        acceptedTermsVersion: 'v1.0-ley25326',
        acceptedAt: new Date().toISOString(),
        signatureIp: '2001:0db8:85a3:0000:0000:8a2e:0370:7334',
      };
      const res = GrantParentalConsentSchema.safeParse(payload);
      expect(res.success).toBe(true);
    });

    it('rejects invalid IP addresses', () => {
      const invalidIps = ['999.999.999.999', 'not-an-ip', '192.168.1'];
      for (const signatureIp of invalidIps) {
        const payload = {
          studentId,
          acceptedTermsVersion: 'v1.0',
          acceptedAt: new Date().toISOString(),
          signatureIp,
        };
        const res = GrantParentalConsentSchema.safeParse(payload);
        expect(res.success).toBe(false);
      }
    });

    it('rejects non-UUID studentId', () => {
      const payload = {
        studentId: 'not-a-uuid',
        acceptedTermsVersion: 'v1.0',
        acceptedAt: new Date().toISOString(),
        signatureIp: '181.164.20.15',
      };
      const res = GrantParentalConsentSchema.safeParse(payload);
      expect(res.success).toBe(false);
    });

    it('transitions student status from PENDING to GRANTED upon valid digital signature', async () => {
      expect(await fetchConsentStatusAction(studentId)).toBe('PENDING');

      const result = await grantParentalConsentAction({
        studentId,
        acceptedTermsVersion: 'v1.0-ley25326',
        acceptedAt: new Date().toISOString(),
        signatureIp: '181.164.20.15',
      });

      expect(result.success).toBe(true);
      expect(result.consentRecord?.status).toBe('GRANTED');
      expect(await fetchConsentStatusAction(studentId)).toBe('GRANTED');
    });
  });

  describe('RevokeParentalConsentSchema & revokeParentalConsentAction', () => {
    it('validates a correct revocation reason of at least 3 characters', () => {
      const res = RevokeParentalConsentSchema.safeParse({
        studentId,
        reason: 'Pausado por límites escolares familiares',
      });
      expect(res.success).toBe(true);
    });

    it('rejects revocation reasons shorter than 3 characters', () => {
      const res = RevokeParentalConsentSchema.safeParse({
        studentId,
        reason: 'No',
      });
      expect(res.success).toBe(false);
    });

    it('transitions student status to REVOKED and stores reason and timestamp', async () => {
      await grantParentalConsentAction({
        studentId,
        acceptedTermsVersion: 'v1.0',
        acceptedAt: new Date().toISOString(),
        signatureIp: '181.164.20.15',
      });
      expect(await fetchConsentStatusAction(studentId)).toBe('GRANTED');

      const reason = 'Pausa preventiva solicitada por la madre';
      const result = await revokeParentalConsentAction({
        studentId,
        reason,
      });

      expect(result.success).toBe(true);
      expect(result.consentRecord?.status).toBe('REVOKED');
      expect(result.consentRecord?.revocationReason).toBe(reason);
      expect(result.consentRecord?.revokedAt).toBeDefined();
      expect(await fetchConsentStatusAction(studentId)).toBe('REVOKED');
    });
  });
});
