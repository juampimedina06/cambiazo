import {
  type ProductCategory,
  type TopUpPreferenceRequestDto,
} from '@cambiazo/shared';
import type { ApiAuthContext } from '../../api/cambiazoApi';

export interface WalletPurchase {
  id: string;
  studentId: string;
  studentName: string;
  amountCents: number;
  itemsSummary: string;
  category: ProductCategory;
  icon: string;
  timestamp: string;
  createdAtIso?: string;
  referenceType?: string;
  direction?: 'CREDIT' | 'DEBIT';
  kioskName: string;
}

export interface SavingsGoal {
  id: string;
  studentId: string;
  title: string;
  targetAmountCents: number;
  savedAmountCents: number;
  icon: string;
  createdAt: string;
}

export interface WalletApiOptions {
  auth?: ApiAuthContext;
}

export interface TopUpPreferenceResult {
  success: boolean;
  preferenceId?: string;
  initPoint?: string;
  externalReference?: string;
  sandboxMode?: boolean;
  amountCents?: number;
  studentId?: string;
  error?: string;
}

export interface VerifyTopUpParams {
  studentId: string;
  externalReference: string;
  preferenceId?: string;
}

export interface VerifyTopUpResult {
  success: boolean;
  verified: boolean;
  status?: 'APPROVED' | 'PENDING';
  newBalanceArsCents?: number;
  error?: string;
}

export interface CompleteTopUpParams {
  studentId: string;
  amountCents: number;
  preferenceId: string;
}

export interface CompleteTopUpResult {
  success: boolean;
  newBalanceArsCents?: number;
  error?: string;
}

export interface CreateSavingsGoalInput {
  studentId: string;
  title: string;
  targetAmountCents: number;
  icon?: string;
}

export interface SavingsGoalActionResult {
  success: boolean;
  goal?: SavingsGoal;
  error?: string;
}

export interface BackendWalletTransaction {
  id: string | number;
  amountCents?: number;
  direction?: 'CREDIT' | 'DEBIT';
  referenceType?: string;
  description?: string;
  createdAt?: string;
  metadata?: {
    category?: ProductCategory;
  };
}

export interface BackendSavingsGoal {
  id: string;
  studentUserId?: string;
  title: string;
  targetAmountCents?: number;
  reservedAmountCents?: number;
  savedAmountCents?: number;
  icon?: string;
  createdAt?: string;
}

export type { TopUpPreferenceRequestDto };

