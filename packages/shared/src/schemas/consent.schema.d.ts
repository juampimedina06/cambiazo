import { z } from 'zod';
export declare const RegisterParentAndStudentSchema: z.ZodObject<{
    inviteCode: z.ZodString;
    parent: z.ZodObject<{
        fullName: z.ZodString;
        email: z.ZodString;
        password: z.ZodString;
        phone: z.ZodOptional<z.ZodString>;
        dni: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        fullName: string;
        email: string;
        password: string;
        dni: string;
        phone?: string | undefined;
    }, {
        fullName: string;
        email: string;
        password: string;
        dni: string;
        phone?: string | undefined;
    }>;
    student: z.ZodObject<{
        fullName: z.ZodString;
        dni: z.ZodString;
        grade: z.ZodString;
        dateOfBirth: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        fullName: string;
        dni: string;
        grade: string;
        dateOfBirth: string;
    }, {
        fullName: string;
        dni: string;
        grade: string;
        dateOfBirth: string;
    }>;
}, "strip", z.ZodTypeAny, {
    inviteCode: string;
    parent: {
        fullName: string;
        email: string;
        password: string;
        dni: string;
        phone?: string | undefined;
    };
    student: {
        fullName: string;
        dni: string;
        grade: string;
        dateOfBirth: string;
    };
}, {
    inviteCode: string;
    parent: {
        fullName: string;
        email: string;
        password: string;
        dni: string;
        phone?: string | undefined;
    };
    student: {
        fullName: string;
        dni: string;
        grade: string;
        dateOfBirth: string;
    };
}>;
export declare const GrantParentalConsentSchema: z.ZodObject<{
    studentId: z.ZodString;
    acceptedTermsVersion: z.ZodString;
    acceptedAt: z.ZodString;
    signatureIp: z.ZodString;
}, "strip", z.ZodTypeAny, {
    studentId: string;
    acceptedTermsVersion: string;
    acceptedAt: string;
    signatureIp: string;
}, {
    studentId: string;
    acceptedTermsVersion: string;
    acceptedAt: string;
    signatureIp: string;
}>;
export declare const RevokeParentalConsentSchema: z.ZodObject<{
    studentId: z.ZodString;
    reason: z.ZodString;
}, "strip", z.ZodTypeAny, {
    studentId: string;
    reason: string;
}, {
    studentId: string;
    reason: string;
}>;
export declare const SpendingLimitsSchema: z.ZodObject<{
    studentId: z.ZodString;
    dailyLimitCents: z.ZodNumber;
    weeklyLimitCents: z.ZodNumber;
    blockedCategories: z.ZodArray<z.ZodEnum<["HEALTHY_SNACK", "DRINK", "CANDY", "HOT_MEAL", "STATIONERY"]>, "many">;
    isPaused: z.ZodBoolean;
}, "strip", z.ZodTypeAny, {
    studentId: string;
    dailyLimitCents: number;
    weeklyLimitCents: number;
    blockedCategories: ("HEALTHY_SNACK" | "DRINK" | "CANDY" | "HOT_MEAL" | "STATIONERY")[];
    isPaused: boolean;
}, {
    studentId: string;
    dailyLimitCents: number;
    weeklyLimitCents: number;
    blockedCategories: ("HEALTHY_SNACK" | "DRINK" | "CANDY" | "HOT_MEAL" | "STATIONERY")[];
    isPaused: boolean;
}>;
//# sourceMappingURL=consent.schema.d.ts.map