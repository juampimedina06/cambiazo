import { z } from 'zod';
export declare const CreateExchangeItemSchema: z.ZodObject<{
    title: z.ZodString;
    description: z.ZodString;
    category: z.ZodString;
    mode: z.ZodEnum<["BARTER", "DONATION", "LOAN"]>;
    photoUrls: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
}, "strip", z.ZodTypeAny, {
    category: string;
    title: string;
    description: string;
    mode: "BARTER" | "DONATION" | "LOAN";
    photoUrls: string[];
}, {
    category: string;
    title: string;
    description: string;
    mode: "BARTER" | "DONATION" | "LOAN";
    photoUrls?: string[] | undefined;
}>;
export declare const ModerateExchangeItemStatusSchema: z.ZodEnum<["APPROVED", "REJECTED", "DELIVERED"]>;
export declare const ModerateExchangeItemSchema: z.ZodObject<{
    itemId: z.ZodString;
    status: z.ZodEnum<["APPROVED", "REJECTED", "DELIVERED"]>;
    moderatorNotes: z.ZodOptional<z.ZodString>;
    awardedPoints: z.ZodDefault<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    status: "APPROVED" | "REJECTED" | "DELIVERED";
    itemId: string;
    awardedPoints: number;
    moderatorNotes?: string | undefined;
}, {
    status: "APPROVED" | "REJECTED" | "DELIVERED";
    itemId: string;
    moderatorNotes?: string | undefined;
    awardedPoints?: number | undefined;
}>;
export declare const SchoolRewardSchema: z.ZodObject<{
    id: z.ZodString;
    institutionId: z.ZodString;
    title: z.ZodString;
    description: z.ZodString;
    pointsCost: z.ZodNumber;
    stock: z.ZodOptional<z.ZodNumber>;
    badgeImageUrl: z.ZodOptional<z.ZodString>;
    isActive: z.ZodDefault<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    id: string;
    institutionId: string;
    isActive: boolean;
    title: string;
    description: string;
    pointsCost: number;
    stock?: number | undefined;
    badgeImageUrl?: string | undefined;
}, {
    id: string;
    institutionId: string;
    title: string;
    description: string;
    pointsCost: number;
    stock?: number | undefined;
    isActive?: boolean | undefined;
    badgeImageUrl?: string | undefined;
}>;
export declare const RedeemRewardSchema: z.ZodObject<{
    rewardId: z.ZodString;
    studentId: z.ZodString;
}, "strip", z.ZodTypeAny, {
    studentId: string;
    rewardId: string;
}, {
    studentId: string;
    rewardId: string;
}>;
export declare const LeaderboardEntryDtoSchema: z.ZodObject<{
    rank: z.ZodNumber;
    studentId: z.ZodString;
    studentAlias: z.ZodString;
    accumulatedPoints: z.ZodNumber;
    badges: z.ZodArray<z.ZodString, "many">;
}, "strip", z.ZodTypeAny, {
    studentId: string;
    rank: number;
    studentAlias: string;
    accumulatedPoints: number;
    badges: string[];
}, {
    studentId: string;
    rank: number;
    studentAlias: string;
    accumulatedPoints: number;
    badges: string[];
}>;
export declare const CategorySpendingBreakdownSchema: z.ZodObject<{
    category: z.ZodEnum<["HEALTHY_SNACK", "DRINK", "CANDY", "HOT_MEAL", "STATIONERY"]>;
    amountCents: z.ZodNumber;
    percentage: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    amountCents: number;
    category: "HEALTHY_SNACK" | "DRINK" | "CANDY" | "HOT_MEAL" | "STATIONERY";
    percentage: number;
}, {
    amountCents: number;
    category: "HEALTHY_SNACK" | "DRINK" | "CANDY" | "HOT_MEAL" | "STATIONERY";
    percentage: number;
}>;
export declare const WeeklyPurchaseItemDtoSchema: z.ZodObject<{
    id: z.ZodString;
    productName: z.ZodString;
    category: z.ZodEnum<["HEALTHY_SNACK", "DRINK", "CANDY", "HOT_MEAL", "STATIONERY"]>;
    amountCents: z.ZodNumber;
    purchasedAt: z.ZodUnion<[z.ZodString, z.ZodDate]>;
}, "strip", z.ZodTypeAny, {
    id: string;
    amountCents: number;
    category: "HEALTHY_SNACK" | "DRINK" | "CANDY" | "HOT_MEAL" | "STATIONERY";
    productName: string;
    purchasedAt: string | Date;
}, {
    id: string;
    amountCents: number;
    category: "HEALTHY_SNACK" | "DRINK" | "CANDY" | "HOT_MEAL" | "STATIONERY";
    productName: string;
    purchasedAt: string | Date;
}>;
export declare const WeeklyParentSummaryDtoSchema: z.ZodObject<{
    studentId: z.ZodString;
    startDate: z.ZodString;
    endDate: z.ZodString;
    totalSpentCents: z.ZodNumber;
    breakdownByCategory: z.ZodArray<z.ZodObject<{
        category: z.ZodEnum<["HEALTHY_SNACK", "DRINK", "CANDY", "HOT_MEAL", "STATIONERY"]>;
        amountCents: z.ZodNumber;
        percentage: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        amountCents: number;
        category: "HEALTHY_SNACK" | "DRINK" | "CANDY" | "HOT_MEAL" | "STATIONERY";
        percentage: number;
    }, {
        amountCents: number;
        category: "HEALTHY_SNACK" | "DRINK" | "CANDY" | "HOT_MEAL" | "STATIONERY";
        percentage: number;
    }>, "many">;
    recentPurchases: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        productName: z.ZodString;
        category: z.ZodEnum<["HEALTHY_SNACK", "DRINK", "CANDY", "HOT_MEAL", "STATIONERY"]>;
        amountCents: z.ZodNumber;
        purchasedAt: z.ZodUnion<[z.ZodString, z.ZodDate]>;
    }, "strip", z.ZodTypeAny, {
        id: string;
        amountCents: number;
        category: "HEALTHY_SNACK" | "DRINK" | "CANDY" | "HOT_MEAL" | "STATIONERY";
        productName: string;
        purchasedAt: string | Date;
    }, {
        id: string;
        amountCents: number;
        category: "HEALTHY_SNACK" | "DRINK" | "CANDY" | "HOT_MEAL" | "STATIONERY";
        productName: string;
        purchasedAt: string | Date;
    }>, "many">;
    communityPointsEarned: z.ZodNumber;
    blockedAttemptsCount: z.ZodDefault<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    studentId: string;
    startDate: string;
    endDate: string;
    totalSpentCents: number;
    breakdownByCategory: {
        amountCents: number;
        category: "HEALTHY_SNACK" | "DRINK" | "CANDY" | "HOT_MEAL" | "STATIONERY";
        percentage: number;
    }[];
    recentPurchases: {
        id: string;
        amountCents: number;
        category: "HEALTHY_SNACK" | "DRINK" | "CANDY" | "HOT_MEAL" | "STATIONERY";
        productName: string;
        purchasedAt: string | Date;
    }[];
    communityPointsEarned: number;
    blockedAttemptsCount: number;
}, {
    studentId: string;
    startDate: string;
    endDate: string;
    totalSpentCents: number;
    breakdownByCategory: {
        amountCents: number;
        category: "HEALTHY_SNACK" | "DRINK" | "CANDY" | "HOT_MEAL" | "STATIONERY";
        percentage: number;
    }[];
    recentPurchases: {
        id: string;
        amountCents: number;
        category: "HEALTHY_SNACK" | "DRINK" | "CANDY" | "HOT_MEAL" | "STATIONERY";
        productName: string;
        purchasedAt: string | Date;
    }[];
    communityPointsEarned: number;
    blockedAttemptsCount?: number | undefined;
}>;
//# sourceMappingURL=community.schema.d.ts.map