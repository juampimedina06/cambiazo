import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  WeeklyParentSummaryDtoSchema,
  type WeeklyParentSummaryDto,
} from '@cambiazo/shared';
import {
  chargeQrPaymentAction,
  fetchWeeklyParentSummaryAction,
  generateQrPaymentTokenAction,
  grantParentalConsentAction,
  updateSpendingLimitsAction,
} from '../src/core';
import {
  installTestBackend,
  TEST_STUDENT_ID,
  type TestBackendState,
} from './helpers/test-backend';

describe('Parent Weekly Summary & Habits View (WAVE-3-MOBILE-03)', () => {
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

  it('generates a valid weekly summary adhering to WeeklyParentSummaryDtoSchema', async () => {
    const summary = await fetchWeeklyParentSummaryAction(studentId);

    const parsed = WeeklyParentSummaryDtoSchema.safeParse(summary);
    expect(parsed.success).toBe(true);

    if (parsed.success) {
      expect(parsed.data.studentId).toBe(studentId);
      expect(parsed.data.totalSpentCents).toBeGreaterThan(0);
      expect(parsed.data.recentPurchases.length).toBeGreaterThan(0);
      expect(parsed.data.breakdownByCategory.length).toBe(5);
    }
  });

  it('correctly calculates total spent and category spending breakdown', async () => {
    const summary: WeeklyParentSummaryDto =
      await fetchWeeklyParentSummaryAction(studentId);

    const itemsSum = summary.recentPurchases.reduce(
      (acc, item) => acc + item.amountCents,
      0
    );
    expect(summary.totalSpentCents).toBe(itemsSum);

    const categories = summary.breakdownByCategory.map((c) => c.category);
    expect(categories).toContain('HEALTHY_SNACK');
    expect(categories).toContain('HOT_MEAL');
    expect(categories).toContain('DRINK');
    expect(categories).toContain('CANDY');
    expect(categories).toContain('STATIONERY');

    const breakdownTotal = summary.breakdownByCategory.reduce(
      (acc, c) => acc + c.amountCents,
      0
    );
    expect(breakdownTotal).toBe(summary.totalSpentCents);

    const percentageSum = summary.breakdownByCategory.reduce(
      (acc, c) => acc + c.percentage,
      0
    );
    expect(percentageSum).toBeGreaterThanOrEqual(98);
    expect(percentageSum).toBeLessThanOrEqual(102);
  });

  it('tracks blocked purchase attempts and details protective parental controls', async () => {
    let summary = await fetchWeeklyParentSummaryAction(studentId);
    expect(summary.blockedAttemptsCount).toBe(1);

    backendState.blockedAttempts.get(studentId)?.unshift({
      id: 'blk-manual-2',
      reason: 'Supera el límite diario de $2.000',
      timestamp: new Date().toISOString(),
    });

    summary = await fetchWeeklyParentSummaryAction(studentId);
    expect(summary.blockedAttemptsCount).toBe(2);
  });

  it('automatically records blocked attempt when chargeQrPayment is blocked by parental controls', async () => {
    await grantParentalConsentAction({
      studentId,
      acceptedTermsVersion: 'v1.0',
      acceptedAt: new Date().toISOString(),
      signatureIp: '181.164.20.15',
    });

    await updateSpendingLimitsAction({
      studentId,
      dailyLimitCents: 200000,
      weeklyLimitCents: 1000000,
      blockedCategories: ['CANDY'],
      isPaused: false,
    });

    const qrRes = await generateQrPaymentTokenAction(studentId);
    expect(qrRes.success).toBe(true);

    const chargeRes = await chargeQrPaymentAction({
      paymentTokenOrCode: qrRes.backupCode!,
      items: [{ productId: '10000000-0000-4000-8000-000000000001', quantity: 1 }],
      idempotencyKey: `idemp_blocked_${Date.now()}`,
    });

    expect(chargeRes.success).toBe(false);
    expect(chargeRes.error).toContain('bloqueada');

    const summary = await fetchWeeklyParentSummaryAction(studentId);
    expect(summary.blockedAttemptsCount).toBeGreaterThanOrEqual(2);
    expect(backendState.blockedAttempts.get(studentId)?.[0]?.reason).toContain('CANDY');
  });

  it('reflects non-monetary community points earned in the weekly report', async () => {
    const summary = await fetchWeeklyParentSummaryAction(studentId);
    expect(summary.communityPointsEarned).toBe(120);

    const student = backendState.students.get(studentId)!;
    student.communityPoints = 185;
    const updated = await fetchWeeklyParentSummaryAction(studentId);
    expect(updated.communityPointsEarned).toBe(185);
  });
});
