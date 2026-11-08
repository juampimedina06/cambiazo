"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WeeklyParentSummaryDtoSchema = exports.WeeklyPurchaseItemDtoSchema = exports.CategorySpendingBreakdownSchema = exports.LeaderboardEntryDtoSchema = exports.RedeemRewardSchema = exports.SchoolRewardSchema = exports.ModerateExchangeItemSchema = exports.ModerateExchangeItemStatusSchema = exports.CreateExchangeItemSchema = void 0;
const zod_1 = require("zod");
const enums_js_1 = require("../enums.js");
exports.CreateExchangeItemSchema = zod_1.z.object({
    title: zod_1.z.string().min(2).max(100),
    description: zod_1.z.string().min(5).max(1000),
    category: zod_1.z.string().min(2).max(50),
    mode: enums_js_1.ExchangeModeSchema,
    photoUrls: zod_1.z.array(zod_1.z.string().url()).max(5).default([]),
});
exports.ModerateExchangeItemStatusSchema = zod_1.z.enum([
    'APPROVED',
    'REJECTED',
    'DELIVERED',
]);
exports.ModerateExchangeItemSchema = zod_1.z.object({
    itemId: zod_1.z.string().uuid(),
    status: exports.ModerateExchangeItemStatusSchema,
    moderatorNotes: zod_1.z.string().max(500).optional(),
    awardedPoints: zod_1.z.number().int().nonnegative().default(0),
});
exports.SchoolRewardSchema = zod_1.z.object({
    id: zod_1.z.string().uuid(),
    institutionId: zod_1.z.string().uuid(),
    title: zod_1.z.string().min(2).max(100),
    description: zod_1.z.string().min(5).max(500),
    pointsCost: zod_1.z.number().int().positive(),
    stock: zod_1.z.number().int().nonnegative().optional(),
    badgeImageUrl: zod_1.z.string().url().optional(),
    isActive: zod_1.z.boolean().default(true),
});
exports.RedeemRewardSchema = zod_1.z.object({
    rewardId: zod_1.z.string().uuid(),
    studentId: zod_1.z.string().uuid(),
});
exports.LeaderboardEntryDtoSchema = zod_1.z.object({
    rank: zod_1.z.number().int().positive(),
    studentId: zod_1.z.string().uuid(),
    studentAlias: zod_1.z.string().min(1).max(50),
    accumulatedPoints: zod_1.z.number().int().nonnegative(),
    badges: zod_1.z.array(zod_1.z.string()),
});
exports.CategorySpendingBreakdownSchema = zod_1.z.object({
    category: enums_js_1.ProductCategorySchema,
    amountCents: zod_1.z.number().int().nonnegative(),
    percentage: zod_1.z.number().min(0).max(100),
});
exports.WeeklyPurchaseItemDtoSchema = zod_1.z.object({
    id: zod_1.z.string().uuid(),
    productName: zod_1.z.string().min(1).max(100),
    category: enums_js_1.ProductCategorySchema,
    amountCents: zod_1.z.number().int().positive(),
    purchasedAt: zod_1.z.string().datetime().or(zod_1.z.date()),
});
exports.WeeklyParentSummaryDtoSchema = zod_1.z.object({
    studentId: zod_1.z.string().uuid(),
    startDate: zod_1.z.string(),
    endDate: zod_1.z.string(),
    totalSpentCents: zod_1.z.number().int().nonnegative(),
    breakdownByCategory: zod_1.z.array(exports.CategorySpendingBreakdownSchema),
    recentPurchases: zod_1.z.array(exports.WeeklyPurchaseItemDtoSchema),
    communityPointsEarned: zod_1.z.number().int().nonnegative(),
    blockedAttemptsCount: zod_1.z.number().int().nonnegative().default(0),
});
//# sourceMappingURL=community.schema.js.map