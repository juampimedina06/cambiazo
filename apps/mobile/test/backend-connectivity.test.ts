import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  chargeQrPaymentAction,
  generateQrPaymentTokenAction,
  grantParentalConsentAction,
  registerFamilyAction,
  resetApiBaseUrlCache,
  validateInviteCodeAction,
} from '../src/core';

describe('Mobile Backend Connectivity & Real HTTP Client', () => {
  const originalEnv = { ...process.env };
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    resetApiBaseUrlCache();
    process.env.EXPO_PUBLIC_API_URL = 'http://localhost:3000/api/v1';
  });

  afterEach(() => {
    process.env = { ...originalEnv };
    globalThis.fetch = originalFetch;
    resetApiBaseUrlCache();
  });

  it('returns explicit server connectivity error without silent mock fallbacks when backend is unreachable', async () => {
    globalThis.fetch = (async () => {
      throw new TypeError('fetch failed');
    }) as typeof fetch;

    const codeRes = await validateInviteCodeAction('BELGRANO2026');
    expect(codeRes.success).toBe(false);
    expect(codeRes.error).toContain('No se pudo conectar con el servidor');

    const regRes = await registerFamilyAction({
      inviteCode: 'BELGRANO2026',
      parent: {
        fullName: 'Laura Pérez',
        dni: '30999888',
        email: 'laura.perez@ejemplo.com',
        phone: '+5491144556677',
        password: 'Password123!',
      },
      students: [
        {
          fullName: 'Tomás Pérez',
          dni: '54999888',
          grade: '5° Primaria',
          dateOfBirth: '2015-03-10',
        },
      ],
    });
    expect(regRes.success).toBe(false);
    expect(regRes.error).toContain('No se pudo conectar con el servidor');

    const consentRes = await grantParentalConsentAction({
      studentId: '22222222-2222-4222-8222-222222222222',
      acceptedTermsVersion: 'v1.0-2026',
      acceptedAt: new Date().toISOString(),
      signatureIp: '127.0.0.1',
    });
    expect(consentRes.success).toBe(false);
    expect(consentRes.error).toContain('No se pudo conectar con el servidor');

    const qrRes = await generateQrPaymentTokenAction(
      '22222222-2222-4222-8222-222222222222'
    );
    expect(qrRes.success).toBe(false);
    expect(qrRes.error).toContain('No se pudo conectar con el servidor');

    const chargeRes = await chargeQrPaymentAction({
      paymentTokenOrCode: '123456',
      items: [
        { productId: '10000000-0000-4000-8000-000000000004', quantity: 1 },
      ],
      idempotencyKey: 'idem-offline-error-test-1',
    });
    expect(chargeRes.success).toBe(false);
    expect(chargeRes.error).toContain('No se pudo conectar con el servidor');
  });

  it('correctly parses real NestJS backend response payloads across mobile actions', async () => {
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

    const codeRes = await validateInviteCodeAction('BELGRANO2026');
    expect(codeRes.success).toBe(true);
    expect(codeRes.institution?.id).toBe('e28bb18a-66fe-4f8e-9092-2df283f55001');
    expect(codeRes.institution?.name).toBe('Colegio Manuel Belgrano');
    expect(codeRes.institution?.code).toBe('BELGRANO2026');

    const qrRes = await generateQrPaymentTokenAction(
      '22222222-2222-4222-8222-222222222222'
    );
    expect(qrRes.success).toBe(true);
    expect(qrRes.qrToken?.token).toBe('qr_live_backend_token_123');
    expect(qrRes.backupCode).toBe('654321');
  });
});
