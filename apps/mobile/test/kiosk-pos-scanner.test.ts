import { describe, it, expect, beforeEach } from 'vitest';
import { ChargeQrRequestSchema } from '@cambiazo/shared';
import { mockApiClient } from '../src/shared/api/mock-client.js';

describe('Kiosk Mode POS Scanner (< 5s Recess Workflow & ChargeQrRequestSchema)', () => {
  const studentId = '22222222-2222-4222-8222-222222222222';
  const alfajorId = '10000000-0000-4000-8000-000000000001'; // CANDY, $1.200 (120000 cents)
  const tostadoId = '10000000-0000-4000-8000-000000000002'; // HOT_MEAL, $2.000 (200000 cents)
  const jugoId = '10000000-0000-4000-8000-000000000003';    // DRINK, $1.000 (100000 cents)
  const manzanaId = '10000000-0000-4000-8000-000000000004'; // HEALTHY_SNACK, $600 (60000 cents)

  beforeEach(async () => {
    mockApiClient.resetToDefault();
    // Grant consent so student can make purchases
    await mockApiClient.grantParentalConsent({
      studentId,
      acceptedTermsVersion: 'v1.0',
      acceptedAt: new Date().toISOString(),
      signatureIp: '181.164.20.15',
    });
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
    // Step 1: Student generates 6-digit QR code
    const qrResult = await mockApiClient.generateQrPaymentToken(studentId);
    expect(qrResult.success).toBe(true);
    const code = qrResult.backupCode!;

    // Initial student balance is $4.500 (450000 cents)
    const initialStudent = mockApiClient.getStudent(studentId);
    expect(initialStudent?.balanceArsCents).toBe(450000);

    // Step 2 & 3: Kiosk scans/enters code and charges Alfajor ($1.200)
    const chargeResult = await mockApiClient.chargeQrPayment({
      paymentTokenOrCode: code,
      items: [{ productId: alfajorId, quantity: 1 }],
      idempotencyKey: `pos-charge-${Date.now()}-1`,
    });

    expect(chargeResult.success).toBe(true);
    expect(chargeResult.totalChargedCents).toBe(120000);
    expect(chargeResult.studentName).toBe('Mateo Gómez');

    // Balance deducted: 450000 - 120000 = 330000 ($3.300)
    expect(mockApiClient.getStudent(studentId)?.balanceArsCents).toBe(330000);

    // Check purchase was recorded in purchase/notifications history
    const purchases = mockApiClient.getPurchases(studentId);
    expect(purchases[0]?.amountCents).toBe(120000);
    expect(purchases[0]?.itemsSummary).toContain('Alfajor');
  });

  it('enforces idempotency: duplicate charge request returns cached result without double charging', async () => {
    const qrResult = await mockApiClient.generateQrPaymentToken(studentId);
    const code = qrResult.backupCode!;
    const idempotencyKey = 'unique-kiosk-tx-12345678';

    const chargePayload = {
      paymentTokenOrCode: code,
      items: [{ productId: manzanaId, quantity: 1 }], // $600
      idempotencyKey,
    };

    // First charge execution
    const firstResult = await mockApiClient.chargeQrPayment(chargePayload);
    expect(firstResult.success).toBe(true);
    expect(mockApiClient.getStudent(studentId)?.balanceArsCents).toBe(450000 - 60000);

    // Second charge execution with identical idempotencyKey
    const secondResult = await mockApiClient.chargeQrPayment(chargePayload);
    expect(secondResult.success).toBe(true);
    expect(secondResult.chargeId).toBe(firstResult.chargeId);

    // Balance must NOT be deducted again
    expect(mockApiClient.getStudent(studentId)?.balanceArsCents).toBe(450000 - 60000);
  });

  it('rejects charge when product category is blocked by parent (e.g. CANDY)', async () => {
    // Parent blocks CANDY
    await mockApiClient.updateSpendingLimits({
      studentId,
      dailyLimitCents: 200000,
      weeklyLimitCents: 1000000,
      blockedCategories: ['CANDY'],
      isPaused: false,
    });

    const qrResult = await mockApiClient.generateQrPaymentToken(studentId);
    const code = qrResult.backupCode!;

    // Attempt to charge Alfajor (CANDY)
    const chargeResult = await mockApiClient.chargeQrPayment({
      paymentTokenOrCode: code,
      items: [{ productId: alfajorId, quantity: 1 }],
      idempotencyKey: 'pos-charge-blocked-cat-test',
    });

    expect(chargeResult.success).toBe(false);
    expect(chargeResult.error).toContain('bloqueada');

    // Balance remains untouched
    expect(mockApiClient.getStudent(studentId)?.balanceArsCents).toBe(450000);
  });

  it('rejects charge when account is paused by parent', async () => {
    // Generate code before pause
    const qrResult = await mockApiClient.generateQrPaymentToken(studentId);
    const code = qrResult.backupCode!;

    // Parent pauses account
    await mockApiClient.updateSpendingLimits({
      studentId,
      dailyLimitCents: 200000,
      weeklyLimitCents: 1000000,
      blockedCategories: [],
      isPaused: true,
    });

    // Attempt to charge
    const chargeResult = await mockApiClient.chargeQrPayment({
      paymentTokenOrCode: code,
      items: [{ productId: jugoId, quantity: 1 }],
      idempotencyKey: 'pos-charge-paused-account-test',
    });

    expect(chargeResult.success).toBe(false);
    expect(chargeResult.error).toContain('pausada');
  });

  it('rejects charge when total exceeds remaining daily limit', async () => {
    // Parent sets daily limit to $1.000 (100000 cents)
    await mockApiClient.updateSpendingLimits({
      studentId,
      dailyLimitCents: 100000, // $1.000 limit
      weeklyLimitCents: 500000,
      blockedCategories: [],
      isPaused: false,
    });

    const qrResult = await mockApiClient.generateQrPaymentToken(studentId);
    const code = qrResult.backupCode!;

    // Attempt to charge Tostado ($2.000 / 200000 cents)
    const chargeResult = await mockApiClient.chargeQrPayment({
      paymentTokenOrCode: code,
      items: [{ productId: tostadoId, quantity: 1 }],
      idempotencyKey: 'pos-charge-daily-limit-exceeded',
    });

    expect(chargeResult.success).toBe(false);
    expect(chargeResult.error).toContain('límite diario');
  });

  it('rejects charge when total exceeds available student balance', async () => {
    // Set student balance to low amount: $500 (50000 cents)
    const student = mockApiClient.getStudent(studentId);
    if (student) {
      student.balanceArsCents = 50000;
    }

    const qrResult = await mockApiClient.generateQrPaymentToken(studentId);
    const code = qrResult.backupCode!;

    // Attempt to charge Tostado ($2.000)
    const chargeResult = await mockApiClient.chargeQrPayment({
      paymentTokenOrCode: code,
      items: [{ productId: tostadoId, quantity: 1 }],
      idempotencyKey: 'pos-charge-low-balance-test',
    });

    expect(chargeResult.success).toBe(false);
    expect(chargeResult.error).toContain('Saldo insuficiente');
  });
});
