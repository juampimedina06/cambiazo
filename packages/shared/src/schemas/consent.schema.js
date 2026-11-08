"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SpendingLimitsSchema = exports.RevokeParentalConsentSchema = exports.GrantParentalConsentSchema = exports.RegisterParentAndStudentSchema = void 0;
const zod_1 = require("zod");
const enums_js_1 = require("../enums.js");
exports.RegisterParentAndStudentSchema = zod_1.z.object({
    inviteCode: zod_1.z.string().min(4).max(32),
    parent: zod_1.z.object({
        fullName: zod_1.z.string().min(2).max(100),
        email: zod_1.z.string().email(),
        password: zod_1.z.string().min(8).max(100),
        phone: zod_1.z.string().min(6).max(25).optional(),
        dni: zod_1.z.string().min(6).max(15),
    }),
    student: zod_1.z.object({
        fullName: zod_1.z.string().min(2).max(100),
        dni: zod_1.z.string().min(6).max(15),
        grade: zod_1.z.string().min(1).max(50),
        dateOfBirth: zod_1.z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date of birth must be in YYYY-MM-DD format'),
    }),
});
exports.GrantParentalConsentSchema = zod_1.z.object({
    studentId: zod_1.z.string().uuid(),
    acceptedTermsVersion: zod_1.z.string().min(1).max(20),
    acceptedAt: zod_1.z.string().datetime(),
    signatureIp: zod_1.z.string().ip({ message: 'Valid IPv4 or IPv6 required' }),
});
exports.RevokeParentalConsentSchema = zod_1.z.object({
    studentId: zod_1.z.string().uuid(),
    reason: zod_1.z.string().min(3).max(500),
});
exports.SpendingLimitsSchema = zod_1.z.object({
    studentId: zod_1.z.string().uuid(),
    dailyLimitCents: zod_1.z.number().int().nonnegative(),
    weeklyLimitCents: zod_1.z.number().int().nonnegative(),
    blockedCategories: zod_1.z.array(enums_js_1.ProductCategorySchema),
    isPaused: zod_1.z.boolean(),
});
//# sourceMappingURL=consent.schema.js.map