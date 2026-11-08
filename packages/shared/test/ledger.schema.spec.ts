import { describe, it, expect } from 'vitest';
import {
  TopUpPreferenceRequestSchema,
  MercadoPagoWebhookPayloadSchema,
  CreateCatalogProductSchema,
  CatalogProductSchema,
  QrPaymentTokenSchema,
  ChargeQrRequestSchema,
  KioskWithdrawalRequestSchema,
} from '../src/schemas/ledger.schema.js';

describe('Ledger & Kiosk Schemas Validation', () => {
  describe('TopUpPreferenceRequestSchema', () => {
    it('accepts valid top-up amount in cents', () => {
      const parsed = TopUpPreferenceRequestSchema.parse({
        studentId: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
        amountCents: 500000,
      });
      expect(parsed.amountCents).toBe(500000);
    });

    it('rejects zero or negative amounts', () => {
      expect(() =>
        TopUpPreferenceRequestSchema.parse({
          studentId: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
          amountCents: 0,
        }),
      ).toThrow();

      expect(() =>
        TopUpPreferenceRequestSchema.parse({
          studentId: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
          amountCents: -1500,
        }),
      ).toThrow();
    });
  });

  describe('MercadoPagoWebhookPayloadSchema', () => {
    it('accepts standard Mercado Pago payment webhook payload', () => {
      const payload = {
        id: 123456789,
        type: 'payment',
        data: { id: '987654321' },
        externalReference: 'topup-f47ac10b-58cc-4372-a567-0e02b2c3d479',
      };
      const parsed = MercadoPagoWebhookPayloadSchema.parse(payload);
      expect(parsed.type).toBe('payment');
      expect(parsed.data.id).toBe('987654321');
    });

    it('rejects payload missing data.id', () => {
      expect(() =>
        MercadoPagoWebhookPayloadSchema.parse({
          id: '123',
          type: 'payment',
          data: {},
        }),
      ).toThrow();
    });
  });

  describe('CatalogProductSchema & CreateCatalogProductSchema', () => {
    const validProduct = {
      institutionId: 'a81bc81b-dead-4e5d-abff-90865d1e13b1',
      name: 'Alfajor de Maicena Artesanal',
      category: 'HEALTHY_SNACK',
      priceCents: 120000,
      stock: 45,
      isActive: true,
    };

    it('parses valid catalog product creation payload', () => {
      const parsed = CreateCatalogProductSchema.parse(validProduct);
      expect(parsed.name).toBe('Alfajor de Maicena Artesanal');
      expect(parsed.priceCents).toBe(120000);
    });

    it('rejects non-positive price in cents', () => {
      expect(() =>
        CreateCatalogProductSchema.parse({
          ...validProduct,
          priceCents: 0,
        }),
      ).toThrow();
    });

    it('rejects negative stock', () => {
      expect(() =>
        CreateCatalogProductSchema.parse({
          ...validProduct,
          stock: -5,
        }),
      ).toThrow();
    });

    it('validates CatalogProductSchema with id and timestamps', () => {
      const fullProduct = {
        ...validProduct,
        id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
        createdAt: new Date().toISOString(),
      };
      const parsed = CatalogProductSchema.parse(fullProduct);
      expect(parsed.id).toBe(fullProduct.id);
    });
  });

  describe('QrPaymentTokenSchema', () => {
    it('accepts valid ephemeral token payload', () => {
      const tokenPayload = {
        token: 'TOKEN-ABC-1234567890',
        studentId: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
        institutionId: 'a81bc81b-dead-4e5d-abff-90865d1e13b1',
        expiresAt: new Date(Date.now() + 120000).toISOString(),
      };
      const parsed = QrPaymentTokenSchema.parse(tokenPayload);
      expect(parsed.token).toBe('TOKEN-ABC-1234567890');
    });

    it('rejects short token (< 8 chars)', () => {
      expect(() =>
        QrPaymentTokenSchema.parse({
          token: '1234',
          studentId: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
          institutionId: 'a81bc81b-dead-4e5d-abff-90865d1e13b1',
          expiresAt: new Date().toISOString(),
        }),
      ).toThrow();
    });
  });

  describe('ChargeQrRequestSchema', () => {
    const validCharge = {
      paymentTokenOrCode: 'TOKEN-ABC-1234567890',
      items: [
        {
          productId: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
          quantity: 2,
        },
      ],
      idempotencyKey: 'idem-key-unique-123456',
    };

    it('parses valid kiosk charge request', () => {
      const parsed = ChargeQrRequestSchema.parse(validCharge);
      expect(parsed.items.length).toBe(1);
      expect(parsed.items[0]?.quantity).toBe(2);
    });

    it('rejects empty items array', () => {
      expect(() =>
        ChargeQrRequestSchema.parse({
          ...validCharge,
          items: [],
        }),
      ).toThrow();
    });

    it('rejects non-positive quantity', () => {
      expect(() =>
        ChargeQrRequestSchema.parse({
          ...validCharge,
          items: [
            {
              productId: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
              quantity: 0,
            },
          ],
        }),
      ).toThrow();
    });
  });

  describe('KioskWithdrawalRequestSchema', () => {
    it('accepts valid kiosk withdrawal request', () => {
      const parsed = KioskWithdrawalRequestSchema.parse({
        amountCents: 15000000,
        mercadoPagoAliasOrCvu: 'kiosco.sanmartin.mp',
        idempotencyKey: 'withdrawal-uuid-unique-1234',
      });
      expect(parsed.amountCents).toBe(15000000);
      expect(parsed.mercadoPagoAliasOrCvu).toBe('kiosco.sanmartin.mp');
    });

    it('rejects zero withdrawal amount', () => {
      expect(() =>
        KioskWithdrawalRequestSchema.parse({
          amountCents: 0,
          mercadoPagoAliasOrCvu: 'alias.mp',
          idempotencyKey: 'key-12345678',
        }),
      ).toThrow();
    });
  });
});
