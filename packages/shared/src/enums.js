"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ModerationStatusSchema = exports.MODERATION_STATUSES = exports.ExchangeModeSchema = exports.EXCHANGE_MODES = exports.ProductCategorySchema = exports.PRODUCT_CATEGORIES = exports.LedgerEntryDirectionSchema = exports.LEDGER_ENTRY_DIRECTIONS = exports.AccountTypeSchema = exports.ACCOUNT_TYPES = exports.ConsentStatusSchema = exports.CONSENT_STATUSES = exports.InstitutionStatusSchema = exports.INSTITUTION_STATUSES = exports.BillingPlanTypeSchema = exports.BILLING_PLAN_TYPES = exports.UserRoleSchema = exports.USER_ROLES = void 0;
const zod_1 = require("zod");
exports.USER_ROLES = [
    'SUPER_ADMIN',
    'SCHOOL_ADMIN',
    'KIOSK',
    'PARENT',
    'STUDENT',
];
exports.UserRoleSchema = zod_1.z.enum(exports.USER_ROLES);
exports.BILLING_PLAN_TYPES = [
    'FIXED_MONTHLY',
    'PER_ACTIVE_STUDENT',
];
exports.BillingPlanTypeSchema = zod_1.z.enum(exports.BILLING_PLAN_TYPES);
exports.INSTITUTION_STATUSES = [
    'ACTIVE',
    'SUSPENDED',
];
exports.InstitutionStatusSchema = zod_1.z.enum(exports.INSTITUTION_STATUSES);
exports.CONSENT_STATUSES = [
    'PENDING',
    'GRANTED',
    'REVOKED',
];
exports.ConsentStatusSchema = zod_1.z.enum(exports.CONSENT_STATUSES);
exports.ACCOUNT_TYPES = [
    'PARENT_WALLET',
    'STUDENT_ALLOCATION',
    'KIOSK_BALANCE',
    'PLATFORM_CLEARING',
];
exports.AccountTypeSchema = zod_1.z.enum(exports.ACCOUNT_TYPES);
exports.LEDGER_ENTRY_DIRECTIONS = [
    'DEBIT',
    'CREDIT',
];
exports.LedgerEntryDirectionSchema = zod_1.z.enum(exports.LEDGER_ENTRY_DIRECTIONS);
exports.PRODUCT_CATEGORIES = [
    'HEALTHY_SNACK',
    'DRINK',
    'CANDY',
    'HOT_MEAL',
    'STATIONERY',
];
exports.ProductCategorySchema = zod_1.z.enum(exports.PRODUCT_CATEGORIES);
exports.EXCHANGE_MODES = [
    'BARTER',
    'DONATION',
    'LOAN',
];
exports.ExchangeModeSchema = zod_1.z.enum(exports.EXCHANGE_MODES);
exports.MODERATION_STATUSES = [
    'PENDING',
    'APPROVED',
    'REJECTED',
    'DELIVERED',
];
exports.ModerationStatusSchema = zod_1.z.enum(exports.MODERATION_STATUSES);
//# sourceMappingURL=enums.js.map