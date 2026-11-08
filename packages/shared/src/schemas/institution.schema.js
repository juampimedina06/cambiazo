"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ValidateInviteCodeSchema = exports.CreateInvitationSchema = exports.InstitutionDtoSchema = exports.CreateInstitutionSchema = exports.CUIT_REGEX = void 0;
const zod_1 = require("zod");
const enums_js_1 = require("../enums.js");
exports.CUIT_REGEX = /^\d{2}-?\d{8}-?\d{1}$/;
exports.CreateInstitutionSchema = zod_1.z.object({
    name: zod_1.z.string().min(2).max(100),
    cuit: zod_1.z.string().regex(exports.CUIT_REGEX, 'Invalid Argentine CUIT format'),
    address: zod_1.z.string().min(3).max(255),
    billingPlanType: enums_js_1.BillingPlanTypeSchema,
    monthlyFeeCents: zod_1.z.number().int().positive(),
    schoolAdminEmail: zod_1.z.string().email(),
    kioskEmail: zod_1.z.string().email(),
});
exports.InstitutionDtoSchema = zod_1.z.object({
    id: zod_1.z.string().uuid(),
    name: zod_1.z.string().min(2).max(100),
    cuit: zod_1.z.string(),
    address: zod_1.z.string(),
    billingPlanType: enums_js_1.BillingPlanTypeSchema,
    monthlyFeeCents: zod_1.z.number().int().positive(),
    status: enums_js_1.InstitutionStatusSchema,
    activeStudentsCount: zod_1.z.number().int().nonnegative(),
    createdAt: zod_1.z.string().datetime().or(zod_1.z.date()),
});
exports.CreateInvitationSchema = zod_1.z.object({
    institutionId: zod_1.z.string().uuid(),
    code: zod_1.z.string().regex(/^[A-Za-z0-9_-]{4,32}$/, 'Invitation code must be alphanumeric (4-32 characters)').optional(),
    maxUses: zod_1.z.number().int().positive().optional(),
    expiresAt: zod_1.z.string().datetime().or(zod_1.z.date()).optional(),
});
exports.ValidateInviteCodeSchema = zod_1.z.object({
    code: zod_1.z.string().min(4).max(32),
});
//# sourceMappingURL=institution.schema.js.map