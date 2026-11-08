import { describe, it, expect, beforeEach } from 'vitest';
import { ApiClient } from '../src/shared/api/api-client';
import { mockAdapter, DEFAULT_KIOSK_INSTITUTION_ID } from '../src/shared/api/mock-adapter';
import { KioskWithdrawalRequestInput, ChargeQrRequestInput } from '../src/shared/api/types';
import { KioskWithdrawalRequestSchema } from '@cambiazo/shared';

describe('Mercado Pago Payout Module & Ledger Balance (WAVE-2-WEB-02)', () => {
  let client: ApiClient;

  beforeEach(() => {
    mockAdapter.reset();
    client = new ApiClient(true);
  });

  describe('Ledger Balance Calculations', () => {
    it('should calculate available balance from ledger (total sales - total withdrawn)', async () => {
      const balance = await client.getKioskLedgerBalance(DEFAULT_KIOSK_INSTITUTION_ID);

      expect(balance.institutionId).toBe(DEFAULT_KIOSK_INSTITUTION_ID);
      expect(balance.totalSalesCents).toBeGreaterThan(0);
      expect(balance.totalWithdrawnCents).toBeGreaterThan(0);
      expect(balance.availableBalanceCents).toBe(
        balance.totalSalesCents - balance.totalWithdrawnCents
      );
      expect(balance.currency).toBe('ARS');
    });

    it('should dynamically increase available balance after new sales', async () => {
      const initialBalance = await client.getKioskLedgerBalance(DEFAULT_KIOSK_INSTITUTION_ID);

      // Create a new sale
      const products = await client.getCatalogProducts(DEFAULT_KIOSK_INSTITUTION_ID);
      const empanada = products.find((p) => p.name === 'Empanada Criolla al Horno')!;

      const chargePayload: ChargeQrRequestInput = {
        paymentTokenOrCode: '123456',
        items: [{ productId: empanada.id, quantity: 2 }],
        idempotencyKey: 'idem-test-balance-increase',
      };
      await client.processKioskCharge(chargePayload, DEFAULT_KIOSK_INSTITUTION_ID);

      const updatedBalance = await client.getKioskLedgerBalance(DEFAULT_KIOSK_INSTITUTION_ID);
      expect(updatedBalance.totalSalesCents).toBe(
        initialBalance.totalSalesCents + empanada.priceCents * 2
      );
      expect(updatedBalance.availableBalanceCents).toBe(
        initialBalance.availableBalanceCents + empanada.priceCents * 2
      );
    });
  });

  describe('Mercado Pago Payout Request', () => {
    it('should request a payout to a valid Mercado Pago CVU/Alias with KioskWithdrawalRequestSchema', async () => {
      const initialBalance = await client.getKioskLedgerBalance(DEFAULT_KIOSK_INSTITUTION_ID);
      const amountPesos = 10000; // $10.000 ARS
      const amountCents = amountPesos * 100; // 1000000 cents

      const requestPayload: KioskWithdrawalRequestInput = {
        amountCents,
        mercadoPagoAliasOrCvu: 'kiosco.escolar.mp',
        idempotencyKey: 'idem-withdrawal-test-001',
      };

      // Zod validation check
      expect(() => KioskWithdrawalRequestSchema.parse(requestPayload)).not.toThrow();

      const withdrawal = await client.requestKioskWithdrawal(
        requestPayload,
        DEFAULT_KIOSK_INSTITUTION_ID
      );

      expect(withdrawal.id).toBeDefined();
      expect(withdrawal.amountCents).toBe(1000000);
      expect(withdrawal.mercadoPagoAliasOrCvu).toBe('kiosco.escolar.mp');
      expect(withdrawal.status).toBe('PROCESSED');
      expect(withdrawal.processedAt).toBeDefined();

      // Verify withdrawal history includes the new payout
      const history = await client.getKioskWithdrawals(DEFAULT_KIOSK_INSTITUTION_ID);
      expect(history.some((w) => w.id === withdrawal.id)).toBe(true);

      // Verify available ledger balance decreased accordingly
      const newBalance = await client.getKioskLedgerBalance(DEFAULT_KIOSK_INSTITUTION_ID);
      expect(newBalance.availableBalanceCents).toBe(
        initialBalance.availableBalanceCents - amountCents
      );
    });

    it('should reject withdrawal request exceeding available balance', async () => {
      const balance = await client.getKioskLedgerBalance(DEFAULT_KIOSK_INSTITUTION_ID);

      const excessivePayload: KioskWithdrawalRequestInput = {
        amountCents: balance.availableBalanceCents + 5000000, // Exceeds balance by $50.000 ARS
        mercadoPagoAliasOrCvu: 'kiosco.exceso.mp',
        idempotencyKey: 'idem-excessive-withdrawal',
      };

      await expect(
        client.requestKioskWithdrawal(excessivePayload, DEFAULT_KIOSK_INSTITUTION_ID)
      ).rejects.toThrow(/Saldo insuficiente/);
    });

    it('should reject invalid payload with invalid Alias/CVU length', async () => {
      const invalidPayload = {
        amountCents: 500000,
        mercadoPagoAliasOrCvu: 'abc', // Too short (min 6)
        idempotencyKey: 'idem-invalid-alias',
      };

      await expect(
        client.requestKioskWithdrawal(invalidPayload, DEFAULT_KIOSK_INSTITUTION_ID)
      ).rejects.toThrow();
    });
  });

  describe('Idempotency Key Guarantee on Withdrawals', () => {
    it('should guarantee idempotency: duplicate idempotencyKey returns existing withdrawal without double debiting balance', async () => {
      const initialBalance = await client.getKioskLedgerBalance(DEFAULT_KIOSK_INSTITUTION_ID);
      const idempotencyKey = 'idem-payout-duplicate-check-777';

      const payload: KioskWithdrawalRequestInput = {
        amountCents: 500000, // $5.000 ARS
        mercadoPagoAliasOrCvu: '0000003100084920194821',
        idempotencyKey,
      };

      // First call
      const firstWithdrawal = await client.requestKioskWithdrawal(
        payload,
        DEFAULT_KIOSK_INSTITUTION_ID
      );
      expect(firstWithdrawal.id).toBeDefined();

      const balanceAfterFirst = await client.getKioskLedgerBalance(DEFAULT_KIOSK_INSTITUTION_ID);
      expect(balanceAfterFirst.availableBalanceCents).toBe(
        initialBalance.availableBalanceCents - 500000
      );

      // Second call with same idempotencyKey (simulating double click)
      const secondWithdrawal = await client.requestKioskWithdrawal(
        payload,
        DEFAULT_KIOSK_INSTITUTION_ID
      );

      // Must return identical record
      expect(secondWithdrawal.id).toBe(firstWithdrawal.id);
      expect(secondWithdrawal.idempotencyKey).toBe(idempotencyKey);

      // Balance must NOT be debited twice
      const balanceAfterSecond = await client.getKioskLedgerBalance(DEFAULT_KIOSK_INSTITUTION_ID);
      expect(balanceAfterSecond.availableBalanceCents).toBe(
        balanceAfterFirst.availableBalanceCents
      );

      // History must have only 1 entry with this idempotency key
      const history = await client.getKioskWithdrawals(DEFAULT_KIOSK_INSTITUTION_ID);
      const matches = history.filter((w) => w.idempotencyKey === idempotencyKey);
      expect(matches.length).toBe(1);
    });
  });
});
