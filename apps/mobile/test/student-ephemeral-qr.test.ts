import { describe, it, expect, beforeEach } from 'vitest';
import { QrPaymentTokenSchema } from '@cambiazo/shared';
import { mockApiClient } from '../src/shared/api/mock-client';

describe('Student Ephemeral QR Payment Token (QrPaymentTokenSchema & 120s Expiry)', () => {
  const studentId = '22222222-2222-4222-8222-222222222222';

  beforeEach(() => {
    mockApiClient.resetToDefault();
  });

  it('validates a correct QrPaymentTokenSchema payload', () => {
    const payload = {
      token: 'cambiazo_qr_22222222_481920_1731034800000',
      studentId,
      institutionId: 'e28bb18a-66fe-4f8e-9092-2df283f55001',
      expiresAt: new Date(Date.now() + 120000).toISOString(),
    };
    const res = QrPaymentTokenSchema.safeParse(payload);
    expect(res.success).toBe(true);
  });

  it('rejects QR token with non-UUID studentId or institutionId', () => {
    const invalid = {
      token: 'valid_token_string',
      studentId: 'not-a-uuid',
      institutionId: 'e28bb18a-66fe-4f8e-9092-2df283f55001',
      expiresAt: new Date().toISOString(),
    };
    expect(QrPaymentTokenSchema.safeParse(invalid).success).toBe(false);
  });

  it('rejects QR generation if student does not have parental consent GRANTED', async () => {
    // Initial student consent status is PENDING
    const result = await mockApiClient.generateQrPaymentToken(studentId);
    expect(result.success).toBe(false);
    expect(result.error).toContain('consentimiento parental');
  });

  it('generates ephemeral QR token with large 6-digit backup code and 120s expiration when consent is GRANTED', async () => {
    // Grant consent first
    await mockApiClient.grantParentalConsent({
      studentId,
      acceptedTermsVersion: 'v1.0',
      acceptedAt: new Date().toISOString(),
      signatureIp: '181.164.20.15',
    });

    const beforeTime = Date.now();
    const result = await mockApiClient.generateQrPaymentToken(studentId);

    expect(result.success).toBe(true);
    expect(result.qrToken).toBeDefined();
    expect(result.backupCode).toBeDefined();
    expect(result.backupCode?.length).toBe(6);
    expect(/^\d{6}$/.test(result.backupCode!)).toBe(true);
    expect(result.expiresInSeconds).toBe(120);

    // Verify QrPaymentTokenSchema compliance
    const validation = QrPaymentTokenSchema.safeParse(result.qrToken);
    expect(validation.success).toBe(true);

    // Verify 120-second expiration window
    const expiresTimestamp = new Date(result.qrToken!.expiresAt).getTime();
    const diffSeconds = Math.round((expiresTimestamp - beforeTime) / 1000);
    expect(diffSeconds).toBeGreaterThanOrEqual(119);
    expect(diffSeconds).toBeLessThanOrEqual(121);
  });

  it('blocks QR token generation when account is paused by tutor (isPaused: true)', async () => {
    // Grant consent
    await mockApiClient.grantParentalConsent({
      studentId,
      acceptedTermsVersion: 'v1.0',
      acceptedAt: new Date().toISOString(),
      signatureIp: '181.164.20.15',
    });

    // Pause account
    await mockApiClient.updateSpendingLimits({
      studentId,
      dailyLimitCents: 200000,
      weeklyLimitCents: 1000000,
      blockedCategories: [],
      isPaused: true,
    });

    const result = await mockApiClient.generateQrPaymentToken(studentId);
    expect(result.success).toBe(false);
    expect(result.error).toContain('pausada');
  });
});
