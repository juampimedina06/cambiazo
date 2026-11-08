import { Inject, Injectable } from '@nestjs/common';
import type { ProductCategory } from '@cambiazo/shared';
import {
  AccountPausedException,
  CategoryBlockedException,
  DailyLimitExceededException,
  WeeklyLimitExceededException,
} from '../../../../common/errors/domain.exception.js';
import {
  type SpendingLimitsRepositoryPort,
  SPENDING_LIMITS_REPOSITORY,
} from '../../domain/ports/spending-limits.repository.port.js';
import { CheckStudentConsentUseCase } from '../use-cases/check-student-consent.use-case.js';

export interface PurchaseItemValidation {
  category: ProductCategory;
  priceCents: number;
  quantity: number;
}

@Injectable()
export class ParentalControlsService {
  constructor(
    @Inject(SPENDING_LIMITS_REPOSITORY)
    private readonly limitsRepo: SpendingLimitsRepositoryPort,
    private readonly checkStudentConsentUseCase: CheckStudentConsentUseCase,
  ) {}

  async validateStudentEligibility(studentId: string, institutionId: string): Promise<void> {
    // Check consent and base active status
    await this.checkStudentConsentUseCase.execute(studentId, institutionId);

    // Check spending limits pause flag
    const limits = await this.limitsRepo.findByStudentId(studentId);
    if (limits && limits.isPaused) {
      throw new AccountPausedException('Student account is paused by parent');
    }
  }

  async validatePurchaseItemsAndLimits(
    studentId: string,
    institutionId: string,
    items: PurchaseItemValidation[],
    cumulativeSpendingTodayCents: number,
    cumulativeSpendingThisWeekCents: number,
  ): Promise<void> {
    await this.validateStudentEligibility(studentId, institutionId);

    const limits = await this.limitsRepo.findByStudentId(studentId);
    if (!limits) {
      return;
    }

    if (limits.isPaused) {
      throw new AccountPausedException('Student account is paused by parent');
    }

    const totalCents = items.reduce(
      (sum, item) => sum + item.priceCents * item.quantity,
      0,
    );

    // 1. Category blocking check
    for (const item of items) {
      if (limits.blockedCategories.includes(item.category)) {
        throw new CategoryBlockedException(item.category);
      }
    }

    // 2. Daily spending limit check
    if (limits.dailyLimitCents > 0) {
      if (cumulativeSpendingTodayCents + totalCents > limits.dailyLimitCents) {
        throw new DailyLimitExceededException(
          `Daily spending limit of $${(limits.dailyLimitCents / 100).toFixed(2)} exceeded. Already spent $${(cumulativeSpendingTodayCents / 100).toFixed(2)} today, attempted purchase $${(totalCents / 100).toFixed(2)}`,
        );
      }
    }

    // 3. Weekly spending limit check
    if (limits.weeklyLimitCents > 0) {
      if (cumulativeSpendingThisWeekCents + totalCents > limits.weeklyLimitCents) {
        throw new WeeklyLimitExceededException(
          `Weekly spending limit of $${(limits.weeklyLimitCents / 100).toFixed(2)} exceeded. Already spent $${(cumulativeSpendingThisWeekCents / 100).toFixed(2)} this week, attempted purchase $${(totalCents / 100).toFixed(2)}`,
        );
      }
    }
  }
}
