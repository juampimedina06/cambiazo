import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { TopUpPreferenceRequestSchema } from '@cambiazo/shared';
import {
  completeTopUpAction,
  createTopUpPreferenceAction,
  fetchStudentBalanceAction,
} from '../src/core';
import {
  installTestBackend,
  TEST_STUDENT_ID,
  type TestBackendState,
} from './helpers/test-backend';

describe('Parent 1:1 Balance Top-Up (TopUpPreferenceRequestSchema & MP Checkout)', () => {
  const studentId = TEST_STUDENT_ID;
  let backendState: TestBackendState;
  let restoreFetch: (() => void) | null = null;

  beforeEach(() => {
    const setup = installTestBackend();
    backendState = setup.state;
    restoreFetch = setup.restore;
  });

  afterEach(() => {
    restoreFetch?.();
  });

  it('validates a correct top-up preference request payload in ARS cents', () => {
    const payload = {
      studentId,
      amountCents: 200000,
    };
    const res = TopUpPreferenceRequestSchema.safeParse(payload);
    expect(res.success).toBe(true);
  });

  it('rejects top-up requests with zero or negative amounts', () => {
    const invalidAmounts = [0, -100, -50000];
    for (const amountCents of invalidAmounts) {
      const res = TopUpPreferenceRequestSchema.safeParse({
        studentId,
        amountCents,
      });
      expect(res.success).toBe(false);
    }
  });

  it('rejects top-up requests with non-UUID studentId', () => {
    const res = TopUpPreferenceRequestSchema.safeParse({
      studentId: 'not-a-valid-uuid',
      amountCents: 100000,
    });
    expect(res.success).toBe(false);
  });

  it('generates a valid Mercado Pago checkout preference for active students', async () => {
    const result = await createTopUpPreferenceAction({
      studentId,
      amountCents: 500000,
    });

    expect(result.success).toBe(true);
    expect(result.preferenceId).toBeDefined();
    expect(result.preferenceId).toContain('pref_mp_');
    expect(result.initPoint).toContain('mercadopago.com.ar');
    expect(result.amountCents).toBe(500000);
  });

  it('strictly enforces 1-to-1 conversion ratio: $1 ARS loaded = $1 ARS kiosk balance', async () => {
    expect(await fetchStudentBalanceAction(studentId)).toBe(450000);

    const loadedAmountCents = 200000;
    const prefResult = await createTopUpPreferenceAction({
      studentId,
      amountCents: loadedAmountCents,
    });
    expect(prefResult.success).toBe(true);

    const completionResult = await completeTopUpAction({
      studentId,
      amountCents: loadedAmountCents,
      preferenceId: prefResult.preferenceId!,
    });

    expect(completionResult.success).toBe(true);
    expect(completionResult.newBalanceArsCents).toBe(650000);
    expect(backendState.students.get(studentId)?.balanceArsCents).toBe(650000);
  });

  it('rejects top-up completion when amount is zero or negative', async () => {
    const completionResult = await completeTopUpAction({
      studentId,
      amountCents: 0,
      preferenceId: 'pref_mock',
    });
    expect(completionResult.success).toBe(false);
    expect(completionResult.error).toContain('mayor a cero');
  });

  it('rejects top-up for non-existent student', async () => {
    const nonExistentId = '99999999-9999-4999-8999-999999999999';
    const result = await createTopUpPreferenceAction({
      studentId: nonExistentId,
      amountCents: 100000,
    });
    expect(result.success).toBe(false);
    expect(result.error).toContain('no encontrado');
  });
});
