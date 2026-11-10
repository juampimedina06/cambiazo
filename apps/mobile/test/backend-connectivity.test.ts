import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { MockMobileApiClient } from '../src/shared/api/mock-client';

describe('Mobile Backend Connectivity & Resilient Fallback', () => {
  const originalEnv = { ...process.env };
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    process.env.NODE_ENV = 'development';
    process.env.EXPO_PUBLIC_USE_MOCKS = 'false';
  });

  afterEach(() => {
    process.env = { ...originalEnv };
    globalThis.fetch = originalFetch;
  });

  it('gracefully falls back to local registry when backend server is unreachable (no fetch failed error)', async () => {
    globalThis.fetch = (async () => {
      throw new TypeError('fetch failed');
    }) as typeof fetch;

    const client = new MockMobileApiClient();

    // 1. Validate School Code
    const codeRes = await client.validateInviteCode('BELGRANO2026');
    expect(codeRes.success).toBe(true);
    expect(codeRes.institution?.name).toBe('Colegio Manuel Belgrano');

    // 2. Register Family
    const regRes = await client.registerFamily({
      inviteCode: 'BELGRANO2026',
      parent: {
        fullName: 'Laura Pérez',
        dni: '30999888',
        email: 'laura.perez@ejemplo.com',
        phone: '+5491144556677',
        password: 'Password123!',
      },
      student: {
        fullName: 'Tomás Pérez',
        dni: '54999888',
        grade: '5° Primaria',
        dateOfBirth: '2015-03-10',
      },
    });
    expect(regRes.success).toBe(true);
    expect(regRes.student?.id).toBeDefined();

    // 3. Grant Parental Consent
    const consentRes = await client.grantParentalConsent({
      studentId: '22222222-2222-4222-8222-222222222222',
      acceptedTermsVersion: 'v1.0-2026',
      acceptedAt: new Date().toISOString(),
      signatureIp: '127.0.0.1',
    });
    expect(consentRes.success).toBe(true);

    // 4. Generate QR Payment Token
    const qrRes = await client.generateQrPaymentToken('22222222-2222-4222-8222-222222222222');
    expect(qrRes.success).toBe(true);
    expect(qrRes.qrToken?.token).toBeDefined();
    expect(qrRes.backupCode).toMatch(/^\d{6}$/);

    // 5. Charge QR Payment at Kiosk
    const chargeRes = await client.chargeQrPayment({
      paymentTokenOrCode: qrRes.backupCode!,
      items: [{ productId: '10000000-0000-4000-8000-000000000004', quantity: 1 }],
      idempotencyKey: 'idem-fallback-test-1',
    });
    expect(chargeRes.success).toBe(true);
    expect(chargeRes.totalChargedCents).toBe(60000);
  });

  it('correctly parses real NestJS backend response payloads across all mobile endpoints', async () => {
    const mockResponses: Response[] = [
      new Response(
        JSON.stringify({
          valid: true,
          institution: {
            id: 'e28bb18a-66fe-4f8e-9092-2df283f55001',
            name: 'Colegio Manuel Belgrano',
            cuit: '30-71234567-9',
            address: 'Av. Belgrano 1450',
            status: 'ACTIVE',
          },
          invitation: {
            id: 'inv-1',
            code: 'BELGRANO2026',
            expiresAt: null,
            maxUses: 500,
            usedCount: 1,
          },
        }),
        { status: 200 }
      ),
      new Response(
        JSON.stringify({
          token: 'qr_live_backend_token_123',
          code: '654321',
          studentId: '22222222-2222-4222-8222-222222222222',
          institutionId: 'e28bb18a-66fe-4f8e-9092-2df283f55001',
          expiresAt: new Date(Date.now() + 120000).toISOString(),
        }),
        { status: 201 }
      ),
    ];

    globalThis.fetch = (async () => {
      const next = mockResponses.shift();
      if (!next) throw new Error('No more mock responses');
      return next;
    }) as typeof fetch;

    const client = new MockMobileApiClient();
    const codeRes = await client.validateInviteCode('BELGRANO2026');
    expect(codeRes.success).toBe(true);
    expect(codeRes.institution?.id).toBe('e28bb18a-66fe-4f8e-9092-2df283f55001');
    expect(codeRes.institution?.name).toBe('Colegio Manuel Belgrano');
    expect(codeRes.institution?.code).toBe('BELGRANO2026');

    const qrRes = await client.generateQrPaymentToken('22222222-2222-4222-8222-222222222222');
    expect(qrRes.success).toBe(true);
    expect(qrRes.qrToken?.token).toBe('qr_live_backend_token_123');
    expect(qrRes.backupCode).toBe('654321');
  });
});
