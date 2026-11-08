import { z } from 'zod';
import {
  InstitutionDtoSchema,
  CreateInstitutionSchema,
  CreateInvitationSchema,
  InstitutionStatusSchema,
  ConsentStatusSchema,
  BillingPlanTypeSchema,
  UserRoleSchema,
} from '@cambiazo/shared';

export type Institution = z.infer<typeof InstitutionDtoSchema>;
export type CreateInstitutionInput = z.infer<typeof CreateInstitutionSchema>;
export type CreateInvitationInput = z.infer<typeof CreateInvitationSchema>;
export type InstitutionStatus = z.infer<typeof InstitutionStatusSchema>;
export type ConsentStatus = z.infer<typeof ConsentStatusSchema>;
export type BillingPlanType = z.infer<typeof BillingPlanTypeSchema>;
export type UserRole = z.infer<typeof UserRoleSchema>;

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
