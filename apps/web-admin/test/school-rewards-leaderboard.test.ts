import { describe, it, expect, beforeEach } from 'vitest';
import { ApiClient } from '../src/shared/api/api-client';
import { mockAdapter, DEFAULT_KIOSK_INSTITUTION_ID } from '../src/shared/api/mock-adapter';
import { SchoolReward } from '../src/shared/api/types';
import { SchoolRewardSchema, LeaderboardEntryDtoSchema } from '@cambiazo/shared';

describe('School Admin Rewards ABM & Leaderboard (WAVE-3-WEB-03)', () => {
  let client: ApiClient;

  beforeEach(() => {
    mockAdapter.reset();
    client = new ApiClient(true);
  });

  describe('Rewards & Badges ABM', () => {
    it('should list configured school rewards', async () => {
      const rewards = await client.getSchoolRewards();
      expect(rewards.length).toBeGreaterThanOrEqual(4);

      const guardian = rewards.find((r) => r.title.includes('Guardián del Reciclaje'));
      expect(guardian).toBeDefined();
      expect(guardian?.pointsCost).toBe(100);
      expect(guardian?.isActive).toBe(true);
    });

    it('should create a valid non-monetary reward with SchoolRewardSchema validation', async () => {
      const newReward: SchoolReward = {
        id: 'd3b07384-d113-469b-8f5b-999999999999',
        institutionId: DEFAULT_KIOSK_INSTITUTION_ID,
        title: 'Mención de Liderazgo Ambiental',
        description: 'Diploma escolar por organizar la jornada de recolección de útiles.',
        pointsCost: 300,
        stock: 10,
        badgeImageUrl: 'https://storage.cambiazo.ar/badges/liderazgo.png',
        isActive: true,
      };

      // Validate with shared Zod schema
      const validated = SchoolRewardSchema.parse(newReward);
      expect(validated.pointsCost).toBe(300);

      const created = await client.createSchoolReward(newReward);
      expect(created.id).toBe(newReward.id);
      expect(created.title).toBe(newReward.title);

      const rewards = await client.getSchoolRewards();
      expect(rewards.some((r) => r.id === newReward.id)).toBe(true);
    });

    it('should reject invalid reward creation (e.g. non-positive points cost or short title)', async () => {
      const invalidReward = {
        id: 'd3b07384-d113-469b-8f5b-999999999999',
        institutionId: DEFAULT_KIOSK_INSTITUTION_ID,
        title: 'X', // too short (< 2)
        description: 'Breve',
        pointsCost: -50, // negative cost
        isActive: true,
      };

      expect(() => SchoolRewardSchema.parse(invalidReward)).toThrow();
    });

    it('should toggle reward active status', async () => {
      const rewards = await client.getSchoolRewards();
      const first = rewards[0]!;
      expect(first.isActive).toBe(true);

      const updated = await client.updateSchoolReward(first.id, { isActive: false });
      expect(updated.isActive).toBe(false);

      const reFetched = await client.getSchoolRewards();
      const target = reFetched.find((r) => r.id === first.id);
      expect(target?.isActive).toBe(false);
    });

    it('should delete a school reward', async () => {
      const rewardsBefore = await client.getSchoolRewards();
      const toDelete = rewardsBefore[0]!;

      const success = await client.deleteSchoolReward(toDelete.id);
      expect(success).toBe(true);

      const rewardsAfter = await client.getSchoolRewards();
      expect(rewardsAfter.some((r) => r.id === toDelete.id)).toBe(false);
    });
  });

  describe('Leaderboard & Gamification Ranking', () => {
    it('should return students ordered by rank and accumulated points', async () => {
      const leaderboard = await client.getSchoolLeaderboard();
      expect(leaderboard.length).toBeGreaterThanOrEqual(5);

      // Verify each entry conforms to LeaderboardEntryDtoSchema
      for (const entry of leaderboard) {
        LeaderboardEntryDtoSchema.parse(entry);
      }

      // Check sorting by rank
      expect(leaderboard[0]!.rank).toBe(1);
      expect(leaderboard[0]!.accumulatedPoints).toBeGreaterThanOrEqual(leaderboard[1]!.accumulatedPoints);
      expect(leaderboard[1]!.rank).toBe(2);
    });

    it('should display authentic badges for top students', async () => {
      const leaderboard = await client.getSchoolLeaderboard();
      const topStudent = leaderboard[0]!;
      expect(topStudent.badges.length).toBeGreaterThan(0);
      expect(topStudent.badges).toContain('GUARDIAN_RECICLAJE');
    });
  });

  describe('Reward Redemptions & Fulfillment Desk', () => {
    it('should list pending reward redemptions requested by students', async () => {
      const redemptions = await client.getRewardRedemptions();
      expect(redemptions.length).toBeGreaterThan(0);

      const pending = redemptions.filter((r) => r.status === 'PENDING');
      expect(pending.length).toBeGreaterThan(0);
    });

    it('should fulfill reward redemption when physically delivered in school', async () => {
      const redemptions = await client.getRewardRedemptions();
      const pending = redemptions.find((r) => r.status === 'PENDING')!;

      const fulfilled = await client.fulfillRewardRedemption(pending.id);
      expect(fulfilled.status).toBe('FULFILLED');
      expect(fulfilled.fulfilledAt).toBeDefined();

      // Check re-fetch
      const updatedList = await client.getRewardRedemptions();
      const updatedItem = updatedList.find((r) => r.id === pending.id);
      expect(updatedItem?.status).toBe('FULFILLED');
    });
  });
});
