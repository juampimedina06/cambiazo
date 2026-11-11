import { z } from 'zod';
import { ProductCategorySchema, LedgerEntryDirectionSchema } from '../enums';

export const TopUpPreferenceRequestSchema = z.object({
  studentId: z.string().uuid(),
  amountCents: z.number().int().positive(),
});

export const VerifyTopUpRequestSchema = z.object({
  studentId: z.string().uuid(),
  externalReference: z.string().min(1),
  preferenceId: z.string().optional(),
});

export const MercadoPagoWebhookPayloadSchema = z.object({
  id: z.union([z.string(), z.number()]),
  type: z.string(),
  data: z.object({
    id: z.union([z.string(), z.number()]),
  }),
  externalReference: z.string().optional(),
  external_reference: z.string().optional(),
});

export const CreateCatalogProductSchema = z.object({
  institutionId: z.string().uuid(),
  name: z.string().min(2).max(100),
  category: ProductCategorySchema,
  priceCents: z.number().int().positive(),
  stock: z.number().int().nonnegative(),
  isActive: z.boolean().default(true),
});

export const UpdateCatalogProductSchema = CreateCatalogProductSchema.partial();

export const CatalogProductSchema = CreateCatalogProductSchema.extend({
  id: z.string().uuid(),
  createdAt: z.string().datetime().or(z.date()).optional(),
  updatedAt: z.string().datetime().or(z.date()).optional(),
});

export const QrPaymentTokenSchema = z.object({
  token: z.string().min(8),
  studentId: z.string().uuid(),
  institutionId: z.string().uuid(),
  expiresAt: z.string().datetime(),
});

export const ChargeQrItemSchema = z.object({
  productId: z.string().uuid(),
  quantity: z.number().int().positive(),
});

export const ChargeQrRequestSchema = z.object({
  paymentTokenOrCode: z.string().min(4),
  items: z.array(ChargeQrItemSchema).min(1),
  idempotencyKey: z.string().min(8),
});

export const KioskWithdrawalRequestSchema = z.object({
  amountCents: z.number().int().positive(),
  mercadoPagoAliasOrCvu: z.string().min(6).max(50),
  idempotencyKey: z.string().min(8),
});

export const LedgerMovementDtoSchema = z.object({
  id: z.string().uuid(),
  transactionId: z.string().uuid(),
  accountId: z.string().uuid(),
  accountType: z.string().optional(),
  direction: LedgerEntryDirectionSchema,
  amountCents: z.number().int().positive(),
  description: z.string().optional(),
  createdAt: z.string().datetime().or(z.date()),
});

