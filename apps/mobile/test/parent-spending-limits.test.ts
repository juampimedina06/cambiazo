import { describe, it, expect, beforeEach } from 'vitest';
import { SpendingLimitsSchema } from '@cambiazo/shared';
import { mockApiClient } from '../src/shared/api/mock-client';

describe('Parent Spending Limits & Controls (SpendingLimitsSchema & Pause Toggle)', () => {
  const studentId = '22222222-2222-4222-8222-222222222222';

  beforeEach(() => {
    mockApiClient.resetToDefault();
  });

  it('validates a complete spending limits payload with blocked categories', () => {
    const payload = {
      studentId,
      dailyLimitCents: 200000, // $2.000
      weeklyLimitCents: 1000000, // $10.000
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
    const updateResult = await mockApiClient.updateSpendingLimits({
      studentId,
      dailyLimitCents: 350000, // $3.500
      weeklyLimitCents: 1500000, // $15.000
      blockedCategories: ['CANDY', 'DRINK'],
      isPaused: false,
    });

    expect(updateResult.success).toBe(true);
    expect(updateResult.limits?.dailyLimitCents).toBe(350000);
    expect(updateResult.limits?.weeklyLimitCents).toBe(1500000);
    expect(updateResult.limits?.blockedCategories).toEqual(['CANDY', 'DRINK']);

    // Check retrieval
    const currentLimits = mockApiClient.getSpendingLimits(studentId);
    expect(currentLimits.dailyLimitCents).toBe(350000);
    expect(currentLimits.blockedCategories).toContain('CANDY');
    expect(currentLimits.blockedCategories).toContain('DRINK');
    expect(currentLimits.blockedCategories).not.toContain('STATIONERY');

    // Also updates student profile dailyLimitCents
    expect(mockApiClient.getStudent(studentId)?.dailyLimitCents).toBe(350000);
  });

  it('immediately pauses and unpauses student account with isPaused flag', async () => {
    expect(mockApiClient.isAccountPaused(studentId)).toBe(false);

    // Pause account
    const pauseResult = await mockApiClient.updateSpendingLimits({
      studentId,
      dailyLimitCents: 200000,
      weeklyLimitCents: 1000000,
      blockedCategories: [],
      isPaused: true,
    });

    expect(pauseResult.success).toBe(true);
    expect(pauseResult.limits?.isPaused).toBe(true);
    expect(mockApiClient.isAccountPaused(studentId)).toBe(true);

    // Unpause account
    const unpauseResult = await mockApiClient.updateSpendingLimits({
      studentId,
      dailyLimitCents: 200000,
      weeklyLimitCents: 1000000,
      blockedCategories: [],
      isPaused: false,
    });

    expect(unpauseResult.success).toBe(true);
    expect(unpauseResult.limits?.isPaused).toBe(false);
    expect(mockApiClient.isAccountPaused(studentId)).toBe(false);
  });
});
