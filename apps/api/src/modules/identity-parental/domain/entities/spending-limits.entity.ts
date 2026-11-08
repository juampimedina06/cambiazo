import type { ProductCategory } from '@cambiazo/shared';

export interface SpendingLimits {
  studentId: string;
  institutionId: string;
  dailyLimitCents: number;
  weeklyLimitCents: number;
  blockedCategories: ProductCategory[];
  isPaused: boolean;
  updatedAt: Date;
}
