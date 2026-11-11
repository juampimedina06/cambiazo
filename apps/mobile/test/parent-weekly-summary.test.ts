import { describe, it, expect, beforeEach } from 'vitest';
import {
  WeeklyParentSummaryDtoSchema,
  type WeeklyParentSummaryDto,
} from '@cambiazo/shared';
import { mockApiClient } from '../src/shared/api/mock-client';

describe('Parent Weekly Summary & Habits View (WAVE-3-MOBILE-03)', () => {
  const studentId = '22222222-2222-4222-8222-222222222222';

  beforeEach(() => {
    mockApiClient.resetToDefault();
  });

  it('generates a valid weekly summary adhering to WeeklyParentSummaryDtoSchema', () => {
    const summary = mockApiClient.getWeeklyParentSummary(studentId);

    // Schema validation
    const parsed = WeeklyParentSummaryDtoSchema.safeParse(summary);
    expect(parsed.success).toBe(true);

    if (parsed.success) {
      expect(parsed.data.studentId).toBe(studentId);
      expect(parsed.data.totalSpentCents).toBeGreaterThan(0);
      expect(parsed.data.recentPurchases.length).toBeGreaterThan(0);
      expect(parsed.data.breakdownByCategory.length).toBe(5);
    }
  });

  it('correctly calculates total spent and category spending breakdown', () => {
    const summary: WeeklyParentSummaryDto = mockApiClient.getWeeklyParentSummary(studentId);

    // Sum of items matches totalSpentCents
    const itemsSum = summary.recentPurchases.reduce((acc, item) => acc + item.amountCents, 0);
    expect(summary.totalSpentCents).toBe(itemsSum);

    // Check all categories are present
    const categories = summary.breakdownByCategory.map((c) => c.category);
    expect(categories).toContain('HEALTHY_SNACK');
    expect(categories).toContain('HOT_MEAL');
    expect(categories).toContain('DRINK');
    expect(categories).toContain('CANDY');
    expect(categories).toContain('STATIONERY');

    // Sum of amounts across breakdown equals totalSpentCents
    const breakdownTotal = summary.breakdownByCategory.reduce((acc, c) => acc + c.amountCents, 0);
    expect(breakdownTotal).toBe(summary.totalSpentCents);

    // Percentages are within 0-100 range and sum to ~100% when there is spending
    const percentageSum = summary.breakdownByCategory.reduce((acc, c) => acc + c.percentage, 0);
    expect(percentageSum).toBeGreaterThanOrEqual(98);
    expect(percentageSum).toBeLessThanOrEqual(102);
  });

  it('tracks blocked purchase attempts and details protective parental controls', async () => {
    // Initial seeded blocked attempt
    let summary = mockApiClient.getWeeklyParentSummary(studentId);
    expect(summary.blockedAttemptsCount).toBe(1);

    const initialList = mockApiClient.getBlockedAttempts(studentId);
    expect(initialList.length).toBe(1);
    expect(initialList[0]?.reason).toContain('Golosinas');

    // Manually record another blocked attempt
    mockApiClient.recordBlockedAttempt(studentId, 'Supera el límite diario de $2.000');

    summary = mockApiClient.getWeeklyParentSummary(studentId);
    expect(summary.blockedAttemptsCount).toBe(2);

    const updatedList = mockApiClient.getBlockedAttempts(studentId);
    expect(updatedList.length).toBe(2);
    expect(updatedList[0]?.reason).toContain('límite diario');
  });

  it('automatically records blocked attempt when chargeQrPayment is blocked by parental controls', async () => {
    // Grant consent first
    await mockApiClient.grantParentalConsent({
      studentId,
      acceptedTermsVersion: 'v1.0',
      acceptedAt: new Date().toISOString(),
      signatureIp: '181.164.20.15',
    });

    // Block CANDY category
    await mockApiClient.updateSpendingLimits({
      studentId,
      dailyLimitCents: 200000,
      weeklyLimitCents: 1000000,
      blockedCategories: ['CANDY'],
      isPaused: false,
    });

    // Generate QR token
    const qrRes = await mockApiClient.generateQrPaymentToken(studentId);
    expect(qrRes.success).toBe(true);

    // Attempt to purchase Candy (Alfajor)
    const chargeRes = await mockApiClient.chargeQrPayment({
      paymentTokenOrCode: qrRes.backupCode!,
      items: [{ productId: '10000000-0000-4000-8000-000000000001', quantity: 1 }],
      idempotencyKey: `idemp_blocked_${Date.now()}`,
    });

    expect(chargeRes.success).toBe(false);
    expect(chargeRes.error).toContain('bloqueada');

    // Verify blocked attempt was automatically recorded
    const summary = mockApiClient.getWeeklyParentSummary(studentId);
    expect(summary.blockedAttemptsCount).toBeGreaterThanOrEqual(2);

    const latestBlocked = mockApiClient.getBlockedAttempts(studentId)[0];
    expect(latestBlocked?.reason).toContain('CANDY');
  });

  it('reflects non-monetary community points earned in the weekly report', () => {
    const summary = mockApiClient.getWeeklyParentSummary(studentId);
    expect(summary.communityPointsEarned).toBe(120);

    // Updating student community points updates the weekly summary
    const student = mockApiClient.getStudent(studentId)!;
    student.communityPoints = 170;

    const updated = mockApiClient.getWeeklyParentSummary(studentId);
    expect(updated.communityPointsEarned).toBe(170);
  });

  it('generates a valid weekly summary for a newly registered student and normalizes legacy non-UUID student IDs without ZodError', async () => {
    const reg = await mockApiClient.registerFamily({
      inviteCode: 'BELGRANO2026',
      parent: {
        fullName: 'Laura Pérez',
        email: 'laura.perez@ejemplo.com',
        password: 'Password1234',
        dni: '30112233',
      },
      student: {
        fullName: 'Tomás Pérez',
        dni: '54112233',
        grade: '4° Primaria A',
        dateOfBirth: '2016-03-10',
      },
    });

    expect(reg.success).toBe(true);
    expect(reg.student?.id).toBeDefined();

    // Must not throw ZodError for newly registered student
    const newStudentSummary = mockApiClient.getWeeklyParentSummary(reg.student!.id);
    expect(WeeklyParentSummaryDtoSchema.safeParse(newStudentSummary).success).toBe(true);

    // Must not throw ZodError even if passed a legacy non-UUID studentId
    const legacySummary = mockApiClient.getWeeklyParentSummary('s-1762815000000-abc12');
    expect(WeeklyParentSummaryDtoSchema.safeParse(legacySummary).success).toBe(true);
  });
});
