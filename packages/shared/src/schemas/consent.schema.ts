import { z } from 'zod';
import { ProductCategorySchema } from '../enums';

export const RegisterParentAndStudentSchema = z.object({
  inviteCode: z.string().min(4).max(32),
  parent: z.object({
    fullName: z.string().min(2).max(100),
    email: z.string().email(),
    password: z.string().min(8).max(100),
    phone: z.string().min(6).max(25).optional(),
    dni: z.string().min(6).max(15),
  }),
  student: z.object({
    fullName: z.string().min(2).max(100),
    dni: z.string().min(6).max(15),
    grade: z.string().min(1).max(50),
    dateOfBirth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date of birth must be in YYYY-MM-DD format'),
  }),
});

export const GrantParentalConsentSchema = z.object({
  studentId: z.string().uuid(),
  acceptedTermsVersion: z.string().min(1).max(20),
  acceptedAt: z.string().datetime(),
  signatureIp: z.string().ip({ message: 'Valid IPv4 or IPv6 required' }),
});

export const RevokeParentalConsentSchema = z.object({
  studentId: z.string().uuid(),
  reason: z.string().min(3).max(500),
});

export const SpendingLimitsSchema = z.object({
  studentId: z.string().uuid().optional(),
  dailyLimitCents: z.number().int().nonnegative(),
  weeklyLimitCents: z.number().int().nonnegative(),
  blockedCategories: z.array(ProductCategorySchema),
  isPaused: z.boolean(),
});

