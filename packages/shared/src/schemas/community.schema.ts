import { z } from 'zod';
import { ExchangeModeSchema, ProductCategorySchema } from '../enums.js';

export const CreateExchangeItemSchema = z.object({
  title: z.string().min(2).max(100),
  description: z.string().min(5).max(1000),
  category: z.string().min(2).max(50),
  mode: ExchangeModeSchema,
  photoUrls: z.array(z.string().url()).max(5).default([]),
});

export const ModerateExchangeItemStatusSchema = z.enum([
  'APPROVED',
  'REJECTED',
  'DELIVERED',
]);

export const ModerateExchangeItemSchema = z.object({
  itemId: z.string().uuid(),
  status: ModerateExchangeItemStatusSchema,
  moderatorNotes: z.string().max(500).optional(),
  awardedPoints: z.number().int().nonnegative().default(0),
});

export const SchoolRewardSchema = z.object({
  id: z.string().uuid(),
  institutionId: z.string().uuid(),
  title: z.string().min(2).max(100),
  description: z.string().min(5).max(500),
  pointsCost: z.number().int().positive(),
  stock: z.number().int().nonnegative().optional(),
  badgeImageUrl: z.string().url().optional(),
  isActive: z.boolean().default(true),
});

export const RedeemRewardSchema = z.object({
  rewardId: z.string().uuid(),
  studentId: z.string().uuid(),
});

export const LeaderboardEntryDtoSchema = z.object({
  rank: z.number().int().positive(),
  studentId: z.string().uuid(),
  studentAlias: z.string().min(1).max(50),
  accumulatedPoints: z.number().int().nonnegative(),
  badges: z.array(z.string()),
});

export const CategorySpendingBreakdownSchema = z.object({
  category: ProductCategorySchema,
  amountCents: z.number().int().nonnegative(),
  percentage: z.number().min(0).max(100),
});

export const WeeklyPurchaseItemDtoSchema = z.object({
  id: z.string().uuid(),
  productName: z.string().min(1).max(100),
  category: ProductCategorySchema,
  amountCents: z.number().int().positive(),
  purchasedAt: z.string().datetime().or(z.date()),
});

export const WeeklyParentSummaryDtoSchema = z.object({
  studentId: z.string().uuid(),
  startDate: z.string(),
  endDate: z.string(),
  totalSpentCents: z.number().int().nonnegative(),
  breakdownByCategory: z.array(CategorySpendingBreakdownSchema),
  recentPurchases: z.array(WeeklyPurchaseItemDtoSchema),
  communityPointsEarned: z.number().int().nonnegative(),
  blockedAttemptsCount: z.number().int().nonnegative().default(0),
});
