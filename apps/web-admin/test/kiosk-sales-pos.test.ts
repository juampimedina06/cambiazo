import { describe, it, expect, beforeEach } from 'vitest';
import { ApiClient } from '../src/shared/api/api-client';
import { mockAdapter, DEFAULT_KIOSK_INSTITUTION_ID } from '../src/shared/api/mock-adapter';
import { ChargeQrRequestInput } from '../src/shared/api/types';
import { ChargeQrRequestSchema } from '@cambiazo/shared';

describe('Kiosk Sales Monitor & POS Web Terminal (WAVE-2-WEB-02)', () => {
  let client: ApiClient;

  beforeEach(() => {
    mockAdapter.reset();
    client = new ApiClient(true);
  });

  describe('Real-Time Sales Monitor & 0% Platform Fee Indicator', () => {
    it('should list sales with transparent 0% platform fee and 100% net kiosk revenue', async () => {
      const sales = await client.getKioskSales(DEFAULT_KIOSK_INSTITUTION_ID);
      expect(sales.length).toBeGreaterThanOrEqual(4);

      sales.forEach((sale) => {
        expect(sale.platformFeeCents).toBe(0); // 0% platform fee
        expect(sale.netAmountCents).toBe(sale.totalAmountCents); // 100% net to kiosk
        expect(sale.idempotencyKey).toBeDefined();
        expect(sale.status).toBe('COMPLETED');
      });
    });

    it('should correctly format items and timestamp in sale record', async () => {
      const sales = await client.getKioskSales(DEFAULT_KIOSK_INSTITUTION_ID);
      const first = sales[0]!;

      expect(first.paymentCode).toBe('482910');
      expect(first.studentName).toBe('Mateo Rossi');
      expect(first.totalAmountCents).toBe(430000); // $4.300 ARS
      expect(first.items.length).toBe(2);
      expect(first.items[0]?.productName).toBe('Sándwich Tostado de Jamón y Queso');
      expect(first.items[1]?.productName).toBe('Jugo de Naranja Natural 350ml');
    });
  });

  describe('Auxiliary 6-Digit Web POS Terminal Checkout', () => {
    it('should process a 6-digit payment code charge and deduct stock accurately', async () => {
      const products = await client.getCatalogProducts(DEFAULT_KIOSK_INSTITUTION_ID);
      const alfajor = products.find((p) => p.name === 'Alfajor de Arroz y Miel')!;
      const initialStock = alfajor.stock;

      const chargePayload: ChargeQrRequestInput = {
        paymentTokenOrCode: '54123456', // Mateo Rossi suffix
        items: [
          {
            productId: alfajor.id,
            quantity: 2,
          },
        ],
        idempotencyKey: 'idem-test-charge-001',
      };

      // Zod validation check
      expect(() => ChargeQrRequestSchema.parse(chargePayload)).not.toThrow();

      const sale = await client.processKioskCharge(
        chargePayload,
        DEFAULT_KIOSK_INSTITUTION_ID
      );

      expect(sale.id).toBeDefined();
      expect(sale.paymentCode).toBe('54123456');
      expect(sale.totalAmountCents).toBe(alfajor.priceCents * 2);
      expect(sale.platformFeeCents).toBe(0); // 0% fee
      expect(sale.netAmountCents).toBe(sale.totalAmountCents);
      expect(sale.items[0]?.quantity).toBe(2);

      // Verify stock was decremented in catalog
      const updatedProduct = await client.getCatalogProductById(alfajor.id);
      expect(updatedProduct?.stock).toBe(initialStock - 2);

      // Verify sale appears in sales monitor
      const sales = await client.getKioskSales(DEFAULT_KIOSK_INSTITUTION_ID);
      expect(sales.some((s) => s.id === sale.id)).toBe(true);
    });

    it('should reject charge when requested quantity exceeds available stock', async () => {
      const products = await client.getCatalogProducts(DEFAULT_KIOSK_INSTITUTION_ID);
      const sandwich = products.find((p) => p.name === 'Sándwich Tostado de Jamón y Queso')!;

      const excessivePayload: ChargeQrRequestInput = {
        paymentTokenOrCode: '719304',
        items: [
          {
            productId: sandwich.id,
            quantity: sandwich.stock + 10, // Exceeds stock
          },
        ],
        idempotencyKey: 'idem-test-excess-stock',
      };

      await expect(
        client.processKioskCharge(excessivePayload, DEFAULT_KIOSK_INSTITUTION_ID)
      ).rejects.toThrow(/Stock insuficiente/);
    });
  });

  describe('Idempotency Key Guarantee on Charges', () => {
    it('should be strictly idempotent: same idempotencyKey returns existing sale without double debiting stock', async () => {
      const products = await client.getCatalogProducts(DEFAULT_KIOSK_INSTITUTION_ID);
      const juice = products.find((p) => p.name === 'Jugo de Naranja Natural 350ml')!;
      const initialStock = juice.stock;
      const idempotencyKey = 'idem-unique-key-recess-999';

      const chargePayload: ChargeQrRequestInput = {
        paymentTokenOrCode: '992812',
        items: [
          {
            productId: juice.id,
            quantity: 1,
          },
        ],
        idempotencyKey,
      };

      // First attempt
      const firstSale = await client.processKioskCharge(
        chargePayload,
        DEFAULT_KIOSK_INSTITUTION_ID
      );
      expect(firstSale.id).toBeDefined();

      const stockAfterFirst = (await client.getCatalogProductById(juice.id))?.stock;
      expect(stockAfterFirst).toBe(initialStock - 1);

      // Second attempt (simulating duplicate click or network retry)
      const secondSale = await client.processKioskCharge(
        chargePayload,
        DEFAULT_KIOSK_INSTITUTION_ID
      );

      // Must return identical sale record without creating a new one
      expect(secondSale.id).toBe(firstSale.id);
      expect(secondSale.idempotencyKey).toBe(idempotencyKey);

      // Stock must NOT have been deducted a second time!
      const stockAfterSecond = (await client.getCatalogProductById(juice.id))?.stock;
      expect(stockAfterSecond).toBe(initialStock - 1);

      // Monitor must NOT contain duplicates
      const sales = await client.getKioskSales(DEFAULT_KIOSK_INSTITUTION_ID);
      const occurrences = sales.filter((s) => s.idempotencyKey === idempotencyKey);
      expect(occurrences.length).toBe(1);
    });
  });
});
