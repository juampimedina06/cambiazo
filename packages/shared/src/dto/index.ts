import { z } from 'zod';
import {
  CreateInstitutionSchema,
  InstitutionDtoSchema,
  CreateInvitationSchema,
  ValidateInviteCodeSchema,
} from '../schemas/institution.schema.js';

import {
  RegisterParentAndStudentSchema,
  GrantParentalConsentSchema,
  RevokeParentalConsentSchema,
  SpendingLimitsSchema,
} from '../schemas/consent.schema.js';

import {
  TopUpPreferenceRequestSchema,
  MercadoPagoWebhookPayloadSchema,
  CreateCatalogProductSchema,
  UpdateCatalogProductSchema,
  CatalogProductSchema,
  QrPaymentTokenSchema,
  ChargeQrItemSchema,
  ChargeQrRequestSchema,
  KioskWithdrawalRequestSchema,
  LedgerMovementDtoSchema,
} from '../schemas/ledger.schema.js';

import {
  CreateExchangeItemSchema,
  ModerateExchangeItemStatusSchema,
  ModerateExchangeItemSchema,
  SchoolRewardSchema,
  RedeemRewardSchema,
  LeaderboardEntryDtoSchema,
  CategorySpendingBreakdownSchema,
  WeeklyPurchaseItemDtoSchema,
  WeeklyParentSummaryDtoSchema,
} from '../schemas/community.schema.js';

// Institution DTOs
export type CreateInstitutionDto = z.infer<typeof CreateInstitutionSchema>;
export type InstitutionDto = z.infer<typeof InstitutionDtoSchema>;
export type CreateInvitationDto = z.infer<typeof CreateInvitationSchema>;
export type ValidateInviteCodeDto = z.infer<typeof ValidateInviteCodeSchema>;

// Consent DTOs
export type RegisterParentAndStudentDto = z.infer<typeof RegisterParentAndStudentSchema>;
export type GrantParentalConsentDto = z.infer<typeof GrantParentalConsentSchema>;
export type RevokeParentalConsentDto = z.infer<typeof RevokeParentalConsentSchema>;
export type SpendingLimitsDto = z.infer<typeof SpendingLimitsSchema>;

// Ledger DTOs
export type TopUpPreferenceRequestDto = z.infer<typeof TopUpPreferenceRequestSchema>;
export type MercadoPagoWebhookPayloadDto = z.infer<typeof MercadoPagoWebhookPayloadSchema>;
export type CreateCatalogProductDto = z.infer<typeof CreateCatalogProductSchema>;
export type UpdateCatalogProductDto = z.infer<typeof UpdateCatalogProductSchema>;
export type CatalogProductDto = z.infer<typeof CatalogProductSchema>;
export type QrPaymentTokenDto = z.infer<typeof QrPaymentTokenSchema>;
export type ChargeQrItemDto = z.infer<typeof ChargeQrItemSchema>;
export type ChargeQrRequestDto = z.infer<typeof ChargeQrRequestSchema>;
export type KioskWithdrawalRequestDto = z.infer<typeof KioskWithdrawalRequestSchema>;
export type LedgerMovementDto = z.infer<typeof LedgerMovementDtoSchema>;


// Community DTOs
export type CreateExchangeItemDto = z.infer<typeof CreateExchangeItemSchema>;
export type ModerateExchangeItemStatus = z.infer<typeof ModerateExchangeItemStatusSchema>;
export type ModerateExchangeItemDto = z.infer<typeof ModerateExchangeItemSchema>;
export type SchoolRewardDto = z.infer<typeof SchoolRewardSchema>;
export type RedeemRewardDto = z.infer<typeof RedeemRewardSchema>;
export type LeaderboardEntryDto = z.infer<typeof LeaderboardEntryDtoSchema>;
export type CategorySpendingBreakdownDto = z.infer<typeof CategorySpendingBreakdownSchema>;
export type WeeklyPurchaseItemDto = z.infer<typeof WeeklyPurchaseItemDtoSchema>;
export type WeeklyParentSummaryDto = z.infer<typeof WeeklyParentSummaryDtoSchema>;
