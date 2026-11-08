"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.KioskWithdrawalRequestSchema = exports.ChargeQrRequestSchema = exports.ChargeQrItemSchema = exports.QrPaymentTokenSchema = exports.CatalogProductSchema = exports.CreateCatalogProductSchema = exports.MercadoPagoWebhookPayloadSchema = exports.TopUpPreferenceRequestSchema = void 0;
const zod_1 = require("zod");
const enums_js_1 = require("../enums.js");
exports.TopUpPreferenceRequestSchema = zod_1.z.object({
    studentId: zod_1.z.string().uuid(),
    amountCents: zod_1.z.number().int().positive(),
});
exports.MercadoPagoWebhookPayloadSchema = zod_1.z.object({
    id: zod_1.z.union([zod_1.z.string(), zod_1.z.number()]),
    type: zod_1.z.string(),
    data: zod_1.z.object({
        id: zod_1.z.union([zod_1.z.string(), zod_1.z.number()]),
    }),
    externalReference: zod_1.z.string().optional(),
    external_reference: zod_1.z.string().optional(),
});
exports.CreateCatalogProductSchema = zod_1.z.object({
    institutionId: zod_1.z.string().uuid(),
    name: zod_1.z.string().min(2).max(100),
    category: enums_js_1.ProductCategorySchema,
    priceCents: zod_1.z.number().int().positive(),
    stock: zod_1.z.number().int().nonnegative(),
    isActive: zod_1.z.boolean().default(true),
});
exports.CatalogProductSchema = exports.CreateCatalogProductSchema.extend({
    id: zod_1.z.string().uuid(),
    createdAt: zod_1.z.string().datetime().or(zod_1.z.date()).optional(),
    updatedAt: zod_1.z.string().datetime().or(zod_1.z.date()).optional(),
});
exports.QrPaymentTokenSchema = zod_1.z.object({
    token: zod_1.z.string().min(8),
    studentId: zod_1.z.string().uuid(),
    institutionId: zod_1.z.string().uuid(),
    expiresAt: zod_1.z.string().datetime(),
});
exports.ChargeQrItemSchema = zod_1.z.object({
    productId: zod_1.z.string().uuid(),
    quantity: zod_1.z.number().int().positive(),
});
exports.ChargeQrRequestSchema = zod_1.z.object({
    paymentTokenOrCode: zod_1.z.string().min(4),
    items: zod_1.z.array(exports.ChargeQrItemSchema).min(1),
    idempotencyKey: zod_1.z.string().min(8),
});
exports.KioskWithdrawalRequestSchema = zod_1.z.object({
    amountCents: zod_1.z.number().int().positive(),
    mercadoPagoAliasOrCvu: zod_1.z.string().min(6).max(50),
    idempotencyKey: zod_1.z.string().min(8),
});
//# sourceMappingURL=ledger.schema.js.map