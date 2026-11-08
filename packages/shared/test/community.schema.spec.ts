import { describe, it, expect } from 'vitest';
import {
  CreateExchangeItemSchema,
  ModerateExchangeItemSchema,
  SchoolRewardSchema,
  RedeemRewardSchema,
  LeaderboardEntryDtoSchema,
  WeeklyParentSummaryDtoSchema,
} from '../src/schemas/community.schema.js';

describe('Community & Gamification Schemas Validation', () => {
  describe('CreateExchangeItemSchema', () => {
    const validItem = {
      title: 'Set de Reglas y Compas Maped',
      description: 'Kit de geometría completo en excelente estado para 1er año.',
      category: 'STATIONERY',
      mode: 'BARTER',
      photoUrls: ['https://storage.cambiazo.ar/items/item1.jpg'],
    };

    it('parses valid community exchange item payload', () => {
      const parsed = CreateExchangeItemSchema.parse(validItem);
      expect(parsed.title).toBe(validItem.title);
      expect(parsed.mode).toBe('BARTER');
      expect(parsed.photoUrls.length).toBe(1);
    });

    it('rejects short title (< 2 chars)', () => {
      expect(() =>
        CreateExchangeItemSchema.parse({
          ...validItem,
          title: 'A',
        }),
      ).toThrow();
    });

    it('rejects invalid photo URL', () => {
      expect(() =>
        CreateExchangeItemSchema.parse({
          ...validItem,
          photoUrls: ['not-a-valid-url'],
        }),
      ).toThrow();
    });
  });

  describe('ModerateExchangeItemSchema', () => {
    it('parses valid approval moderation with points awarded', () => {
      const parsed = ModerateExchangeItemSchema.parse({
        itemId: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
        status: 'DELIVERED',
        moderatorNotes: 'Entregado en el punto escolar de recepción',
        awardedPoints: 50,
      });
      expect(parsed.status).toBe('DELIVERED');
      expect(parsed.awardedPoints).toBe(50);
    });

    it('rejects invalid status (e.g. PENDING is not a moderator action)', () => {
      expect(() =>
        ModerateExchangeItemSchema.parse({
          itemId: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
          status: 'PENDING',
        }),
      ).toThrow();
    });

    it('rejects negative points awarded', () => {
      expect(() =>
        ModerateExchangeItemSchema.parse({
          itemId: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
          status: 'APPROVED',
          awardedPoints: -10,
        }),
      ).toThrow();
    });
  });

  describe('SchoolRewardSchema & RedeemRewardSchema', () => {
    it('parses valid school reward', () => {
      const reward = {
        id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
        institutionId: 'a81bc81b-dead-4e5d-abff-90865d1e13b1',
        title: 'Insignia Guardián del Reciclaje',
        description: 'Reconocimiento escolar por donar 5 útiles.',
        pointsCost: 150,
        badgeImageUrl: 'https://storage.cambiazo.ar/badges/guardian.png',
        isActive: true,
      };
      const parsed = SchoolRewardSchema.parse(reward);
      expect(parsed.pointsCost).toBe(150);
      expect(parsed.title).toBe(reward.title);
    });

    it('parses valid redemption request', () => {
      const parsed = RedeemRewardSchema.parse({
        rewardId: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
        studentId: 'a81bc81b-dead-4e5d-abff-90865d1e13b1',
      });
      expect(parsed.rewardId).toBe('f47ac10b-58cc-4372-a567-0e02b2c3d479');
    });
  });

  describe('LeaderboardEntryDtoSchema', () => {
    it('parses valid student leaderboard entry', () => {
      const entry = {
        rank: 1,
        studentId: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
        studentAlias: 'Mateo R.',
        accumulatedPoints: 340,
        badges: ['SOLIDARIO_ORO', 'GUARDIAN_LIBROS'],
      };
      const parsed = LeaderboardEntryDtoSchema.parse(entry);
      expect(parsed.rank).toBe(1);
      expect(parsed.studentAlias).toBe('Mateo R.');
      expect(parsed.accumulatedPoints).toBe(340);
    });

    it('rejects non-positive rank', () => {
      expect(() =>
        LeaderboardEntryDtoSchema.parse({
          rank: 0,
          studentId: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
          studentAlias: 'Mateo R.',
          accumulatedPoints: 10,
          badges: [],
        }),
      ).toThrow();
    });
  });

  describe('WeeklyParentSummaryDtoSchema', () => {
    const validSummary = {
      studentId: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
      startDate: '2026-11-01',
      endDate: '2026-11-07',
      totalSpentCents: 450000,
      breakdownByCategory: [
        {
          category: 'HEALTHY_SNACK',
          amountCents: 300000,
          percentage: 66.67,
        },
        {
          category: 'DRINK',
          amountCents: 150000,
          percentage: 33.33,
        },
      ],
      recentPurchases: [
        {
          id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
          productName: 'Ensalada de Frutas',
          category: 'HEALTHY_SNACK',
          amountCents: 300000,
          purchasedAt: '2026-11-05T15:30:00.000Z',
        },
      ],
      communityPointsEarned: 40,
      blockedAttemptsCount: 1,
    };

    it('parses valid parent weekly summary', () => {
      const parsed = WeeklyParentSummaryDtoSchema.parse(validSummary);
      expect(parsed.totalSpentCents).toBe(450000);
      expect(parsed.communityPointsEarned).toBe(40);
      expect(parsed.breakdownByCategory.length).toBe(2);
    });

    it('rejects negative spent amount', () => {
      expect(() =>
        WeeklyParentSummaryDtoSchema.parse({
          ...validSummary,
          totalSpentCents: -100,
        }),
      ).toThrow();
    });
  });
});
