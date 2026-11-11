import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { ChargeQrRequestSchema } from '@cambiazo/shared';
import {
  chargeQrPaymentAction,
  fetchStudentBalanceAction,
  fetchStudentTransactionsAction,
  generateQrPaymentTokenAction,
  grantParentalConsentAction,
  updateSpendingLimitsAction,
} from '../src/core';
import {
  installTestBackend,
  TEST_STUDENT_ID,
  type TestBackendState,
} from './helpers/test-backend';

describe('Kiosk Mode POS Scanner (< 5s Recess Workflow & ChargeQrRequestSchema)', () => {
  const studentId = TEST_STUDENT_ID;
  const alfajorId = '10000000-0000-4000-8000-000000000001';
  const tostadoId = '10000000-0000-4000-8000-000000000002';
  const jugoId = '10000000-0000-4000-8000-000000000003';
  const manzanaId = '10000000-0000-4000-8000-000000000004';

  let backendState: TestBackendState;
  let restoreFetch: (() => void) | null = null;

  beforeEach(async () => {
    const setup = installTestBackend();
    backendState = setup.state;
    restoreFetch = setup.restore;

    await grantParentalConsentAction({
      studentId,
      acceptedTermsVersion: 'v1.0',
      acceptedAt: new Date().toISOString(),
      signatureIp: '181.164.20.15',
    });
  });

  afterEach(() => {
    restoreFetch?.();
  });

  it('validates a correct ChargeQrRequestSchema payload with items and idempotencyKey', () => {
    const payload = {
      paymentTokenOrCode: '481920',
      items: [
        { productId: alfajorId, quantity: 1 },
        { productId: jugoId, quantity: 2 },
      ],
      idempotencyKey: 'pos-test-idempotency-key-01',
    };
    const res = ChargeQrRequestSchema.safeParse(payload);
    expect(res.success).toBe(true);
  });

  it('rejects ChargeQrRequestSchema payload with empty items array', () => {
    const payload = {
      paymentTokenOrCode: '481920',
      items: [],
      idempotencyKey: 'pos-test-idempotency-key-02',
    };
    const res = ChargeQrRequestSchema.safeParse(payload);
    expect(res.success).toBe(false);
  });

  it('executes a sub-5s charge in 3 steps and records purchase in student history', async () => {
    const qrResult = await generateQrPaymentTokenAction(studentId);
    expect(qrResult.success).toBe(true);
    const code = qrResult.backupCode!;

    expect(await fetchStudentBalanceAction(studentId)).toBe(450000);

    const chargeResult = await chargeQrPaymentAction({
      paymentTokenOrCode: code,
      items: [{ productId: alfajorId, quantity: 1 }],
      idempotencyKey: `pos-charge-${Date.now()}-1`,
    });

    expect(chargeResult.success).toBe(true);
    expect(chargeResult.totalChargedCents).toBe(120000);
    expect(chargeResult.studentName).toBe('Mateo Gómez');

    expect(await fetchStudentBalanceAction(studentId)).toBe(330000);

    const purchases = await fetchStudentTransactionsAction(studentId);
    expect(purchases[0]?.amountCents).toBe(120000);
    expect(purchases[0]?.itemsSummary).toContain('Alfajor');
  });

  it('enforces idempotency: duplicate charge request returns cached result without double charging', async () => {
    const qrResult = await generateQrPaymentTokenAction(studentId);
    const code = qrResult.backupCode!;
    const idempotencyKey = 'unique-kiosk-tx-12345678';

    const chargePayload = {
      paymentTokenOrCode: code,
      items: [{ productId: manzanaId, quantity: 1 }],
      idempotencyKey,
    };

    const firstResult = await chargeQrPaymentAction(chargePayload);
    expect(firstResult.success).toBe(true);
    expect(await fetchStudentBalanceAction(studentId)).toBe(450000 - 60000);

    const secondResult = await chargeQrPaymentAction(chargePayload);
    expect(secondResult.success).toBe(true);
    expect(secondResult.chargeId).toBe(firstResult.chargeId);
    expect(await fetchStudentBalanceAction(studentId)).toBe(450000 - 60000);
  });

  it('rejects charge when product category is blocked by parent (e.g. CANDY)', async () => {
    await updateSpendingLimitsAction({
      studentId,
      dailyLimitCents: 200000,
      weeklyLimitCents: 1000000,
      blockedCategories: ['CANDY'],
      isPaused: false,
    });

    const qrResult = await generateQrPaymentTokenAction(studentId);
    const code = qrResult.backupCode!;

    const chargeResult = await chargeQrPaymentAction({
      paymentTokenOrCode: code,
      items: [{ productId: alfajorId, quantity: 1 }],
      idempotencyKey: 'pos-charge-blocked-cat-test',
    });

    expect(chargeResult.success).toBe(false);
    expect(chargeResult.error).toContain('bloqueada');
    expect(await fetchStudentBalanceAction(studentId)).toBe(450000);
  });

  it('rejects charge when account is paused by parent', async () => {
    const qrResult = await generateQrPaymentTokenAction(studentId);
    const code = qrResult.backupCode!;

    await updateSpendingLimitsAction({
      studentId,
      dailyLimitCents: 200000,
      weeklyLimitCents: 1000000,
      blockedCategories: [],
      isPaused: true,
    });

    const chargeResult = await chargeQrPaymentAction({
      paymentTokenOrCode: code,
      items: [{ productId: jugoId, quantity: 1 }],
      idempotencyKey: 'pos-charge-paused-account-test',
    });

    expect(chargeResult.success).toBe(false);
    expect(chargeResult.error).toContain('pausada');
  });

  it('rejects charge when total exceeds remaining daily limit', async () => {
    await updateSpendingLimitsAction({
      studentId,
      dailyLimitCents: 100000,
      weeklyLimitCents: 500000,
      blockedCategories: [],
      isPaused: false,
    });

    const qrResult = await generateQrPaymentTokenAction(studentId);
    const code = qrResult.backupCode!;

    const chargeResult = await chargeQrPaymentAction({
      paymentTokenOrCode: code,
      items: [{ productId: tostadoId, quantity: 1 }],
      idempotencyKey: 'pos-charge-daily-limit-exceeded',
    });

    expect(chargeResult.success).toBe(false);
    expect(chargeResult.error).toContain('límite diario');
  });

  it('rejects charge when total exceeds available student balance', async () => {
    const student = backendState.students.get(studentId);
    if (student) {
      student.balanceArsCents = 50000;
    }

    const qrResult = await generateQrPaymentTokenAction(studentId);
    const code = qrResult.backupCode!;

    const chargeResult = await chargeQrPaymentAction({
      paymentTokenOrCode: code,
      items: [{ productId: tostadoId, quantity: 1 }],
      idempotencyKey: 'pos-charge-low-balance-test',
    });

    expect(chargeResult.success).toBe(false);
    expect(chargeResult.error).toContain('Saldo insuficiente');
  });
});
