import { describe, it, expect, beforeEach } from 'vitest';
import {
  LeaderboardEntryDtoSchema,
  SchoolRewardSchema,
  RedeemRewardSchema,
} from '@cambiazo/shared';
import { mockApiClient } from '../src/shared/api/mock-client';

describe('Community Points, School Leaderboard & Rewards Catalog (WAVE-3-MOBILE-03)', () => {
  const institutionId = 'e28bb18a-66fe-4f8e-9092-2df283f55001'; // Colegio Manuel Belgrano
  const studentId = '22222222-2222-4222-8222-222222222222'; // Mateo Gómez

  beforeEach(() => {
    mockApiClient.resetToDefault();
  });

  it('guarantees Community Points are non-monetary and separate from kiosk balance ($ ARS)', () => {
    const student = mockApiClient.getStudent(studentId)!;

    // Student has 120 community points
    expect(student.communityPoints).toBe(120);

    // Kiosk wallet balance is $4.500 (450000 cents)
    expect(student.balanceArsCents).toBe(450000);

    // They are completely different metrics and fields
    expect(typeof student.communityPoints).toBe('number');
    expect(typeof student.balanceArsCents).toBe('number');
    expect(student.communityPoints).not.toBe(student.balanceArsCents);
  });

  it('retrieves and validates school leaderboard with LeaderboardEntryDtoSchema', async () => {
    const leaderboard = await mockApiClient.getLeaderboard(institutionId);
    expect(leaderboard.length).toBeGreaterThanOrEqual(5);

    // Validate each entry
    leaderboard.forEach((entry) => {
      const res = LeaderboardEntryDtoSchema.safeParse(entry);
      expect(res.success).toBe(true);
      expect(entry.accumulatedPoints).toBeGreaterThanOrEqual(0);
      expect(entry.badges.length).toBeGreaterThan(0);
    });

    // Check ranks order (1, 2, 3...)
    for (let i = 0; i < leaderboard.length; i++) {
      expect(leaderboard[i]!.rank).toBe(i + 1);
    }

    // Check student Mateo is present in leaderboard
    const mateo = leaderboard.find((e) => e.studentId === studentId);
    expect(mateo).toBeDefined();
    expect(mateo?.rank).toBe(2);
    expect(mateo?.accumulatedPoints).toBe(120);
    expect(mateo?.badges).toContain('Primer Canje');
    expect(mateo?.badges).toContain('Solidario');
  });

  it('retrieves and validates school rewards catalog with SchoolRewardSchema', async () => {
    const rewards = await mockApiClient.getSchoolRewards(institutionId);
    expect(rewards.length).toBe(4);

    rewards.forEach((reward) => {
      const res = SchoolRewardSchema.safeParse(reward);
      expect(res.success).toBe(true);
      expect(reward.institutionId).toBe(institutionId);
      expect(reward.pointsCost).toBeGreaterThan(0);
      expect(reward.isActive).toBe(true);
    });
  });

  it('validates reward redemption payload with RedeemRewardSchema', () => {
    const valid = {
      rewardId: '66666666-6666-4666-8666-111111111111',
      studentId,
    };
    expect(RedeemRewardSchema.safeParse(valid).success).toBe(true);

    const invalidUuid = {
      rewardId: 'not-a-uuid',
      studentId,
    };
    expect(RedeemRewardSchema.safeParse(invalidUuid).success).toBe(false);
  });

  it('redeems school reward deducting non-monetary community points and decrementing stock', async () => {
    const student = mockApiClient.getStudent(studentId)!;
    const initialPoints = student.communityPoints; // 120 pts
    const initialBalanceArs = student.balanceArsCents; // $4.500

    const rewards = await mockApiClient.getSchoolRewards(institutionId);
    const libraryPass = rewards.find((r) => r.title.includes('Biblioteca'))!; // costs 50 pts, stock 15
    const initialStock = libraryPass.stock!;

    const res = await mockApiClient.redeemReward({
      rewardId: libraryPass.id,
      studentId,
    });

    expect(res.success).toBe(true);
    expect(res.remainingPoints).toBe(initialPoints - 50); // 120 - 50 = 70 pts
    expect(student.communityPoints).toBe(70);

    // Kiosk wallet ($ ARS) was NOT affected at all!
    expect(student.balanceArsCents).toBe(initialBalanceArs);

    // Stock was decremented
    expect(libraryPass.stock).toBe(initialStock - 1);
  });

  it('rejects redeeming reward when student has insufficient community points', async () => {
    const student = mockApiClient.getStudent(studentId)!;
    student.communityPoints = 30; // Not enough for lunch (150 pts)

    const rewards = await mockApiClient.getSchoolRewards(institutionId);
    const lunchReward = rewards.find((r) => r.title.includes('Almuerzo'))!; // costs 150 pts

    const res = await mockApiClient.redeemReward({
      rewardId: lunchReward.id,
      studentId,
    });

    expect(res.success).toBe(false);
    expect(res.error).toContain('insuficientes');
  });

  it('rejects redeeming reward when stock is exhausted', async () => {
    const rewards = await mockApiClient.getSchoolRewards(institutionId);
    const reward = rewards[0]!;
    reward.stock = 0; // Exhaust stock

    const res = await mockApiClient.redeemReward({
      rewardId: reward.id,
      studentId,
    });

    expect(res.success).toBe(false);
    expect(res.error).toContain('stock');
  });
});
