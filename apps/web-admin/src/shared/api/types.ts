import { z } from 'zod';
import {
  InstitutionDtoSchema,
  CreateInstitutionSchema,
  CreateInvitationSchema,
  InstitutionStatusSchema,
  ConsentStatusSchema,
  BillingPlanTypeSchema,
  UserRoleSchema,
  ProductCategorySchema,
  ProductCategory,
  PRODUCT_CATEGORIES,
  CatalogProductSchema,
  CreateCatalogProductSchema,
  ChargeQrRequestSchema,
  KioskWithdrawalRequestSchema,
  ExchangeModeSchema,
  ExchangeMode,
  EXCHANGE_MODES,
  ModerationStatusSchema,
  ModerationStatus,
  MODERATION_STATUSES,
  ModerateExchangeItemSchema,
  ModerateExchangeItemStatusSchema,
  SchoolRewardSchema,
  RedeemRewardSchema,
  LeaderboardEntryDtoSchema,
} from '@cambiazo/shared';

export type Institution = z.infer<typeof InstitutionDtoSchema>;
export type CreateInstitutionInput = z.infer<typeof CreateInstitutionSchema>;
export type CreateInvitationInput = z.infer<typeof CreateInvitationSchema>;
export type InstitutionStatus = z.infer<typeof InstitutionStatusSchema>;
export type ConsentStatus = z.infer<typeof ConsentStatusSchema>;
export type BillingPlanType = z.infer<typeof BillingPlanTypeSchema>;
export type UserRole = z.infer<typeof UserRoleSchema>;

export type { ProductCategory, ExchangeMode, ModerationStatus };
export { PRODUCT_CATEGORIES, EXCHANGE_MODES, MODERATION_STATUSES };

export type ModerateExchangeItemDto = z.infer<typeof ModerateExchangeItemSchema>;
export type ModerateExchangeItemStatus = z.infer<typeof ModerateExchangeItemStatusSchema>;
export type SchoolReward = z.infer<typeof SchoolRewardSchema>;
export type CreateSchoolRewardInput = z.infer<typeof SchoolRewardSchema>;
export type LeaderboardEntry = z.infer<typeof LeaderboardEntryDtoSchema>;


export type CatalogProduct = z.infer<typeof CatalogProductSchema>;
export type CreateCatalogProductInput = z.infer<typeof CreateCatalogProductSchema>;
export type ChargeQrRequestInput = z.infer<typeof ChargeQrRequestSchema>;
export type KioskWithdrawalRequestInput = z.infer<typeof KioskWithdrawalRequestSchema>;

export interface InvitationCode {
  id: string;
  institutionId: string;
  code: string;
  maxUses: number;
  currentUses: number;
  expiresAt: string;
  createdAt: string;
  isActive: boolean;
}

export interface StudentConsentAudit {
  acceptedTermsVersion?: string;
  signedAt?: string;
  signatureIp?: string;
  revocationReason?: string;
  revokedAt?: string;
}

export interface StudentRosterItem {
  id: string;
  studentId: string;
  institutionId: string;
  studentName: string;
  studentDni: string;
  grade: string;
  parentName: string;
  parentEmail: string;
  parentPhone: string;
  consentStatus: ConsentStatus;
  consentAudit: StudentConsentAudit;
  walletBalanceCents: number;
  communityPoints: number;
  createdAt: string;
}

export interface KioskSaleItem {
  productId: string;
  productName: string;
  category: ProductCategory;
  quantity: number;
  unitPriceCents: number;
  subtotalCents: number;
}

export interface KioskSale {
  id: string;
  institutionId: string;
  studentId?: string;
  studentName?: string;
  paymentCode: string;
  items: KioskSaleItem[];
  totalAmountCents: number;
  platformFeeCents: number; // 0% platform fee
  netAmountCents: number; // 100% net to kiosk
  idempotencyKey: string;
  createdAt: string;
  status: 'COMPLETED' | 'REFUNDED';
}

export interface KioskWithdrawal {
  id: string;
  institutionId: string;
  amountCents: number;
  mercadoPagoAliasOrCvu: string;
  idempotencyKey: string;
  status: 'PENDING' | 'PROCESSED' | 'FAILED';
  createdAt: string;
  processedAt?: string;
}

export interface KioskLedgerBalance {
  institutionId: string;
  totalSalesCents: number;
  totalWithdrawnCents: number;
  availableBalanceCents: number;
  currency: 'ARS';
  lastMovementAt: string;
}

export interface ExchangeItem {
  id: string;
  institutionId: string;
  studentId: string;
  studentName: string;
  studentGrade: string;
  title: string;
  description: string;
  category: string;
  mode: ExchangeMode;
  status: ModerationStatus;
  photoUrls: string[];
  moderatorNotes?: string;
  awardedPoints: number;
  createdAt: string;
  updatedAt: string;
}

export interface RewardRedemption {
  id: string;
  institutionId: string;
  rewardId: string;
  rewardTitle: string;
  pointsCost: number;
  studentId: string;
  studentName: string;
  studentGrade: string;
  status: 'PENDING' | 'FULFILLED';
  requestedAt: string;
  fulfilledAt?: string;
}

export interface SchoolReportMetrics {
  healthyCount: number;
  candyCount: number;
  healthyPercentage: number;
  candyPercentage: number;
  totalSpentCents: number;
  categoryBreakdown: {
    category: ProductCategory;
    itemCount: number;
    amountCents: number;
    percentage: number;
  }[];
  totalReusedItems: number;
  itemsByMode: {
    BARTER: number;
    DONATION: number;
    LOAN: number;
  };
  itemsByStatus: {
    PENDING: number;
    APPROVED: number;
    REJECTED: number;
    DELIVERED: number;
  };
  totalCommunityPointsAwarded: number;
  activeParticipantStudentsCount: number;
}

export interface InstitutionBillingRow {
  institutionId: string;
  institutionName: string;
  cuit: string;
  status: InstitutionStatus;
  billingPlanType: BillingPlanType;
  monthlyRateCents: number;
  activeStudentsCount: number;
  calculatedMonthlyFeeCents: number;
  kioskVolumeCents: number;
}

export interface SuperAdminGlobalMetrics {
  totalSchoolsCount: number;
  activeSchoolsCount: number;
  totalActiveStudents: number;
  totalKioskVolumeCents: number;
  totalMonthlyBillingCents: number;
  institutionsBilling: InstitutionBillingRow[];
}

