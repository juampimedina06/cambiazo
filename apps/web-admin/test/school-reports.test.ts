import { describe, it, expect, beforeEach } from 'vitest';
import { ApiClient } from '../src/shared/api/api-client';
import { mockAdapter } from '../src/shared/api/mock-adapter';

describe('School Reports & Nutritional Dashboard (WAVE-3-WEB-03)', () => {
  let client: ApiClient;

  beforeEach(() => {
    mockAdapter.reset();
    client = new ApiClient(true);
  });

  it('should compute healthy vs candy consumption proportion in the kiosk', async () => {
    const metrics = await client.getSchoolReportMetrics();
    expect(metrics).toBeDefined();

    expect(metrics.healthyPercentage).toBeGreaterThanOrEqual(0);
    expect(metrics.healthyPercentage).toBeLessThanOrEqual(100);

    expect(metrics.candyPercentage).toBeGreaterThanOrEqual(0);
    expect(metrics.candyPercentage).toBeLessThanOrEqual(100);

    // Sum should equal 100%
    expect(metrics.healthyPercentage + metrics.candyPercentage).toBe(100);
  });

  it('should compute spending breakdown by product category', async () => {
    const metrics = await client.getSchoolReportMetrics();
    expect(metrics.categoryBreakdown.length).toBeGreaterThan(0);

    const totalPercentage = metrics.categoryBreakdown.reduce(
      (sum, cat) => sum + cat.percentage,
      0
    );
    expect(totalPercentage).toBeGreaterThanOrEqual(95); // accounts for rounding
    expect(totalPercentage).toBeLessThanOrEqual(105);
  });

  it('should compute volume of community school supplies reused', async () => {
    const metrics = await client.getSchoolReportMetrics();

    expect(metrics.totalReusedItems).toBeGreaterThanOrEqual(2);
    expect(metrics.itemsByMode.DONATION).toBeGreaterThan(0);
    expect(metrics.itemsByMode.BARTER).toBeGreaterThan(0);
    expect(metrics.itemsByMode.LOAN).toBeGreaterThan(0);

    expect(metrics.totalCommunityPointsAwarded).toBeGreaterThanOrEqual(100);
    expect(metrics.activeParticipantStudentsCount).toBeGreaterThan(0);
  });
});
