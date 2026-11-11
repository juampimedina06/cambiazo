import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { SpendingLimitsSchema } from '@cambiazo/shared';
import {
  fetchSpendingLimitsAction,
  updateSpendingLimitsAction,
} from '../src/core';
import {
  installTestBackend,
  TEST_STUDENT_ID,
  type TestBackendState,
} from './helpers/test-backend';

describe('Parent Spending Limits & Controls (SpendingLimitsSchema & Pause Toggle)', () => {
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

  it('validates a complete spending limits payload with blocked categories', () => {
    const payload = {
      studentId,
      dailyLimitCents: 200000,
      weeklyLimitCents: 1000000,
      blockedCategories: ['CANDY', 'HOT_MEAL'] as const,
      isPaused: false,
    };
    const res = SpendingLimitsSchema.safeParse(payload);
    expect(res.success).toBe(true);
  });

  it('rejects negative daily or weekly spending limits', () => {
    const invalidDaily = {
      studentId,
      dailyLimitCents: -5000,
      weeklyLimitCents: 100000,
      blockedCategories: [],
      isPaused: false,
    };
    expect(SpendingLimitsSchema.safeParse(invalidDaily).success).toBe(false);

    const invalidWeekly = {
      studentId,
      dailyLimitCents: 50000,
      weeklyLimitCents: -1,
      blockedCategories: [],
      isPaused: false,
    };
    expect(SpendingLimitsSchema.safeParse(invalidWeekly).success).toBe(false);
  });

  it('rejects invalid product category values', () => {
    const invalid = {
      studentId,
      dailyLimitCents: 100000,
      weeklyLimitCents: 500000,
      blockedCategories: ['INVALID_CATEGORY'],
      isPaused: false,
    };
    const res = SpendingLimitsSchema.safeParse(invalid);
    expect(res.success).toBe(false);
  });

  it('updates daily and weekly caps and persists blocked categories', async () => {
    const updateResult = await updateSpendingLimitsAction({
      studentId,
      dailyLimitCents: 350000,
      weeklyLimitCents: 1500000,
      blockedCategories: ['CANDY', 'DRINK'],
      isPaused: false,
    });

    expect(updateResult.success).toBe(true);
    expect(updateResult.limits?.dailyLimitCents).toBe(350000);
    expect(updateResult.limits?.weeklyLimitCents).toBe(1500000);
    expect(updateResult.limits?.blockedCategories).toEqual(['CANDY', 'DRINK']);

    const currentLimits = await fetchSpendingLimitsAction(studentId);
    expect(currentLimits.dailyLimitCents).toBe(350000);
    expect(currentLimits.blockedCategories).toContain('CANDY');
    expect(currentLimits.blockedCategories).toContain('DRINK');
    expect(currentLimits.blockedCategories).not.toContain('STATIONERY');

    expect(backendState.students.get(studentId)?.dailyLimitCents).toBe(350000);
  });

  it('immediately pauses and unpauses student account with isPaused flag', async () => {
    expect((await fetchSpendingLimitsAction(studentId)).isPaused).toBe(false);

    const pauseResult = await updateSpendingLimitsAction({
      studentId,
      dailyLimitCents: 200000,
      weeklyLimitCents: 1000000,
      blockedCategories: [],
      isPaused: true,
    });

    expect(pauseResult.success).toBe(true);
    expect(pauseResult.limits?.isPaused).toBe(true);
    expect((await fetchSpendingLimitsAction(studentId)).isPaused).toBe(true);

    const unpauseResult = await updateSpendingLimitsAction({
      studentId,
      dailyLimitCents: 200000,
      weeklyLimitCents: 1000000,
      blockedCategories: [],
      isPaused: false,
    });

    expect(unpauseResult.success).toBe(true);
    expect(unpauseResult.limits?.isPaused).toBe(false);
    expect((await fetchSpendingLimitsAction(studentId)).isPaused).toBe(false);
  });
});
