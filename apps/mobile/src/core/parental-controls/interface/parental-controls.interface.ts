import {
  type ProductCategory,
  type WeeklyParentSummaryDto,
} from '@cambiazo/shared';
import type { ApiAuthContext } from '../../api/cambiazoApi';

export interface SpendingLimits {
  studentId: string;
  dailyLimitCents: number;
  weeklyLimitCents: number;
  blockedCategories: ProductCategory[];
  isPaused: boolean;
}

export interface UpdateSpendingLimitsResult {
  success: boolean;
  limits?: SpendingLimits;
  error?: string;
}

export interface BlockedAttempt {
  id: string;
  studentId: string;
  reason: string;
  timestamp: string;
}

export interface ParentalControlsApiOptions {
  auth?: ApiAuthContext;
}

export type { WeeklyParentSummaryDto };

