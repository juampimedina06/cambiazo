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
} from '@cambiazo/shared';

export type Institution = z.infer<typeof InstitutionDtoSchema>;
export type CreateInstitutionInput = z.infer<typeof CreateInstitutionSchema>;
export type CreateInvitationInput = z.infer<typeof CreateInvitationSchema>;
export type InstitutionStatus = z.infer<typeof InstitutionStatusSchema>;
export type ConsentStatus = z.infer<typeof ConsentStatusSchema>;
export type BillingPlanType = z.infer<typeof BillingPlanTypeSchema>;
export type UserRole = z.infer<typeof UserRoleSchema>;

export type { ProductCategory };
export { PRODUCT_CATEGORIES };

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
