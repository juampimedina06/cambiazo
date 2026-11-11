import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  LeaderboardEntryDtoSchema,
  SchoolRewardSchema,
  RedeemRewardSchema,
} from '@cambiazo/shared';
import {
  fetchLeaderboardAction,
  fetchSchoolRewardsAction,
  redeemRewardAction,
} from '../src/core';
import {
  installTestBackend,
  TEST_INSTITUTION_ID,
  TEST_STUDENT_ID,
  type TestBackendState,
} from './helpers/test-backend';

describe('Community Points, School Leaderboard & Rewards Catalog (WAVE-3-MOBILE-03)', () => {
  const institutionId = TEST_INSTITUTION_ID;
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

  it('guarantees Community Points are non-monetary and separate from kiosk balance ($ ARS)', () => {
    const student = backendState.students.get(studentId)!;

    expect(student.communityPoints).toBe(120);
    expect(student.balanceArsCents).toBe(450000);
    expect(typeof student.communityPoints).toBe('number');
    expect(typeof student.balanceArsCents).toBe('number');
    expect(student.communityPoints).not.toBe(student.balanceArsCents);
  });

  it('retrieves and validates school leaderboard with LeaderboardEntryDtoSchema', async () => {
    const leaderboard = await fetchLeaderboardAction(institutionId);
    expect(leaderboard.length).toBeGreaterThanOrEqual(5);

    leaderboard.forEach((entry) => {
      const res = LeaderboardEntryDtoSchema.safeParse(entry);
      expect(res.success).toBe(true);
      expect(entry.accumulatedPoints).toBeGreaterThanOrEqual(0);
      expect(entry.badges.length).toBeGreaterThan(0);
    });

    for (let i = 0; i < leaderboard.length; i++) {
      expect(leaderboard[i]!.rank).toBe(i + 1);
    }

    const mateo = leaderboard.find((e) => e.studentId === studentId);
    expect(mateo).toBeDefined();
    expect(mateo?.rank).toBe(2);
    expect(mateo?.accumulatedPoints).toBe(120);
    expect(mateo?.badges).toContain('Primer Canje');
    expect(mateo?.badges).toContain('Solidario');
  });

  it('retrieves and validates school rewards catalog with SchoolRewardSchema', async () => {
    const rewards = await fetchSchoolRewardsAction(institutionId);
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
    const student = backendState.students.get(studentId)!;
    const initialPoints = student.communityPoints;
    const initialBalanceArs = student.balanceArsCents;

    const rewards = await fetchSchoolRewardsAction(institutionId);
    const libraryPass = rewards.find((r) => r.title.includes('Biblioteca'))!;
    const initialStock = libraryPass.stock!;

    const res = await redeemRewardAction({
      rewardId: libraryPass.id,
      studentId,
    });

    expect(res.success).toBe(true);
    expect(res.remainingPoints).toBe(initialPoints - 50);
    expect(student.communityPoints).toBe(70);
    expect(student.balanceArsCents).toBe(initialBalanceArs);
    expect(backendState.rewards.get(libraryPass.id)?.stock).toBe(initialStock - 1);
  });

  it('rejects redeeming reward when student has insufficient community points', async () => {
    const student = backendState.students.get(studentId)!;
    student.communityPoints = 30;

    const rewards = await fetchSchoolRewardsAction(institutionId);
    const lunchReward = rewards.find((r) => r.title.includes('Almuerzo'))!;

    const res = await redeemRewardAction({
      rewardId: lunchReward.id,
      studentId,
    });

    expect(res.success).toBe(false);
    expect(res.error).toContain('insuficientes');
  });

  it('rejects redeeming reward when stock is exhausted', async () => {
    const rewards = await fetchSchoolRewardsAction(institutionId);
    const reward = rewards[0]!;
    backendState.rewards.get(reward.id)!.stock = 0;

    const res = await redeemRewardAction({
      rewardId: reward.id,
      studentId,
    });

    expect(res.success).toBe(false);
    expect(res.error).toContain('stock');
  });
});
