import { describe, it, expect, beforeEach } from 'vitest';
import { ApiClient } from '../src/shared/api/api-client';
import { mockAdapter } from '../src/shared/api/mock-adapter';

describe('Super Admin Global Metrics & Automated Billing (WAVE-3-WEB-03)', () => {
  let client: ApiClient;

  beforeEach(() => {
    mockAdapter.reset();
    client = new ApiClient(true);
  });

  it('should calculate global metrics across all educational institutions', async () => {
    const metrics = await client.getSuperAdminMetrics();
    expect(metrics).toBeDefined();

    expect(metrics.totalSchoolsCount).toBeGreaterThanOrEqual(3);
    expect(metrics.activeSchoolsCount).toBeGreaterThanOrEqual(2);
    expect(metrics.totalActiveStudents).toBeGreaterThan(500);
    expect(metrics.totalKioskVolumeCents).toBeGreaterThan(0);
    expect(metrics.totalMonthlyBillingCents).toBeGreaterThan(0);
  });

  it('should correctly calculate fee for FIXED_MONTHLY plan', async () => {
    const metrics = await client.getSuperAdminMetrics();

    const belgrano = metrics.institutionsBilling.find(
      (i) => i.institutionName === 'Colegio Belgrano Day School'
    );
    expect(belgrano).toBeDefined();
    expect(belgrano?.billingPlanType).toBe('FIXED_MONTHLY');
    expect(belgrano?.status).toBe('ACTIVE');

    // Fee equals exactly monthlyRateCents
    expect(belgrano?.calculatedMonthlyFeeCents).toBe(belgrano?.monthlyRateCents);
    expect(belgrano?.calculatedMonthlyFeeCents).toBe(4500000); // $45.000 ARS
  });

  it('should correctly calculate fee for PER_ACTIVE_STUDENT plan (rate * activeStudentsCount)', async () => {
    const metrics = await client.getSuperAdminMetrics();

    const sanMartin = metrics.institutionsBilling.find(
      (i) => i.institutionName === 'Instituto San Martín de Tours'
    );
    expect(sanMartin).toBeDefined();
    expect(sanMartin?.billingPlanType).toBe('PER_ACTIVE_STUDENT');
    expect(sanMartin?.status).toBe('ACTIVE');

    // 310 active students * $250 ARS (25000 cents) = $77.500 ARS (7750000 cents)
    const expectedFeeCents = sanMartin!.monthlyRateCents * sanMartin!.activeStudentsCount;
    expect(sanMartin?.calculatedMonthlyFeeCents).toBe(expectedFeeCents);
    expect(sanMartin?.calculatedMonthlyFeeCents).toBe(7750000);
  });

  it('should zero out fee for SUSPENDED institution', async () => {
    const metrics = await client.getSuperAdminMetrics();

    const suspendedSchool = metrics.institutionsBilling.find(
      (i) => i.status === 'SUSPENDED'
    );
    expect(suspendedSchool).toBeDefined();
    expect(suspendedSchool?.calculatedMonthlyFeeCents).toBe(0);
  });

  it('should verify total monthly billing equals the sum of active institutions calculated fees', async () => {
    const metrics = await client.getSuperAdminMetrics();

    const sumActiveCalculatedFees = metrics.institutionsBilling
      .filter((i) => i.status === 'ACTIVE')
      .reduce((sum, i) => sum + i.calculatedMonthlyFeeCents, 0);

    expect(metrics.totalMonthlyBillingCents).toBe(sumActiveCalculatedFees);
  });
});
