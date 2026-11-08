import { z } from 'zod';

export const USER_ROLES = [
  'SUPER_ADMIN',
  'SCHOOL_ADMIN',
  'KIOSK',
  'PARENT',
  'STUDENT',
] as const;
export const UserRoleSchema = z.enum(USER_ROLES);
export type UserRole = z.infer<typeof UserRoleSchema>;

export const BILLING_PLAN_TYPES = [
  'FIXED_MONTHLY',
  'PER_ACTIVE_STUDENT',
] as const;
export const BillingPlanTypeSchema = z.enum(BILLING_PLAN_TYPES);
export type BillingPlanType = z.infer<typeof BillingPlanTypeSchema>;

export const INSTITUTION_STATUSES = [
  'ACTIVE',
  'SUSPENDED',
] as const;
export const InstitutionStatusSchema = z.enum(INSTITUTION_STATUSES);
export type InstitutionStatus = z.infer<typeof InstitutionStatusSchema>;

export const CONSENT_STATUSES = [
  'PENDING',
  'GRANTED',
  'REVOKED',
] as const;
export const ConsentStatusSchema = z.enum(CONSENT_STATUSES);
export type ConsentStatus = z.infer<typeof ConsentStatusSchema>;

export const ACCOUNT_TYPES = [
  'PARENT_WALLET',
  'STUDENT_ALLOCATION',
  'KIOSK_BALANCE',
  'PLATFORM_CLEARING',
] as const;
export const AccountTypeSchema = z.enum(ACCOUNT_TYPES);
export type AccountType = z.infer<typeof AccountTypeSchema>;

export const LEDGER_ENTRY_DIRECTIONS = [
  'DEBIT',
  'CREDIT',
] as const;
export const LedgerEntryDirectionSchema = z.enum(LEDGER_ENTRY_DIRECTIONS);
export type LedgerEntryDirection = z.infer<typeof LedgerEntryDirectionSchema>;

export const PRODUCT_CATEGORIES = [
  'HEALTHY_SNACK',
  'DRINK',
  'CANDY',
  'HOT_MEAL',
  'STATIONERY',
] as const;
export const ProductCategorySchema = z.enum(PRODUCT_CATEGORIES);
export type ProductCategory = z.infer<typeof ProductCategorySchema>;

export const EXCHANGE_MODES = [
  'BARTER',
  'DONATION',
  'LOAN',
] as const;
export const ExchangeModeSchema = z.enum(EXCHANGE_MODES);
export type ExchangeMode = z.infer<typeof ExchangeModeSchema>;

export const MODERATION_STATUSES = [
  'PENDING',
  'APPROVED',
  'REJECTED',
  'DELIVERED',
] as const;
export const ModerationStatusSchema = z.enum(MODERATION_STATUSES);
export type ModerationStatus = z.infer<typeof ModerationStatusSchema>;
