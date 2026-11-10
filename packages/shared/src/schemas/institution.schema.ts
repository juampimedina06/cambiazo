import { z } from 'zod';
import { BillingPlanTypeSchema, InstitutionStatusSchema } from '../enums';

export const CUIT_REGEX = /^\d{2}-?\d{8}-?\d{1}$/;

export const CreateInstitutionSchema = z.object({
  name: z.string().min(2).max(100),
  cuit: z.string().regex(CUIT_REGEX, 'Invalid Argentine CUIT format'),
  address: z.string().min(3).max(255),
  billingPlanType: BillingPlanTypeSchema,
  monthlyFeeCents: z.number().int().positive(),
  schoolAdminEmail: z.string().email(),
  kioskEmail: z.string().email(),
});

export const InstitutionDtoSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(2).max(100),
  cuit: z.string(),
  address: z.string(),
  billingPlanType: BillingPlanTypeSchema,
  monthlyFeeCents: z.number().int().positive(),
  status: InstitutionStatusSchema,
  activeStudentsCount: z.number().int().nonnegative(),
  createdAt: z.string().datetime().or(z.date()),
});

export const CreateInvitationSchema = z.object({
  institutionId: z.string().uuid(),
  code: z.string().regex(/^[A-Za-z0-9_-]{4,32}$/, 'Invitation code must be alphanumeric (4-32 characters)').optional(),
  maxUses: z.number().int().positive().optional(),
  expiresAt: z.string().datetime().or(z.date()).optional(),
});

export const ValidateInviteCodeSchema = z.object({
  code: z.string().min(4).max(32),
});
