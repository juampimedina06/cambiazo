import { Inject, Injectable, forwardRef } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import type {
  CreateSavingsGoalDto,
  DepositSavingsGoalDto,
} from '@cambiazo/shared';
import {
  InsufficientFundsException,
  SavingsGoalNotFoundException,
  TenantMismatchException,
  ProhibitedCommunityConversionException,
  ProhibitedTransferException,
} from '../../../../common/errors/domain.exception.js';
import type { StudentSavingsGoal } from '../../domain/entities/student-savings-goal.entity.js';
import {
  type SavingsGoalRepositoryPort,
  SAVINGS_GOAL_REPOSITORY,
} from '../../domain/ports/savings-goal.repository.port.js';
import { LedgerService } from './ledger.service.js';

@Injectable()
export class SavingsGoalService {
  constructor(
    @Inject(SAVINGS_GOAL_REPOSITORY)
    private readonly goalRepo: SavingsGoalRepositoryPort,
    @Inject(forwardRef(() => LedgerService))
    private readonly ledgerService: LedgerService,
  ) {}

  async createGoal(
    studentUserId: string,
    institutionId: string,
    dto: CreateSavingsGoalDto,
  ): Promise<StudentSavingsGoal> {
    const initialReserved = dto.initialReservedCents || 0;

    if (initialReserved > 0) {
      const spendable = await this.getSpendableBalance(studentUserId, institutionId);
      if (initialReserved > spendable) {
        throw new InsufficientFundsException(
          `Cannot reserve $${(initialReserved / 100).toFixed(2)}: spendable wallet balance is only $${(spendable / 100).toFixed(2)}`,
        );
      }
    }

    const now = new Date();
    const isAchieved = initialReserved >= dto.targetAmountCents;

    const goal: StudentSavingsGoal = {
      id: randomUUID(),
      institutionId,
      studentUserId,
      title: dto.title,
      targetAmountCents: dto.targetAmountCents,
      reservedAmountCents: initialReserved,
      isAchieved,
      createdAt: now,
      updatedAt: now,
    };

    return this.goalRepo.save(goal);
  }

  async depositToGoal(
    studentUserId: string,
    institutionId: string,
    goalId: string,
    dto: DepositSavingsGoalDto,
  ): Promise<StudentSavingsGoal> {
    const goal = await this.goalRepo.findById(goalId);
    if (!goal) {
      throw new SavingsGoalNotFoundException(goalId);
    }

    if (goal.institutionId !== institutionId) {
      throw new TenantMismatchException('Cross-institution savings goal access');
    }

    if (goal.studentUserId !== studentUserId) {
      throw new TenantMismatchException('Cannot deposit into another student’s savings goal');
    }

    const spendable = await this.getSpendableBalance(studentUserId, institutionId);
    if (dto.amountCents > spendable) {
      throw new InsufficientFundsException(
        `Cannot deposit $${(dto.amountCents / 100).toFixed(2)}: spendable wallet balance is only $${(spendable / 100).toFixed(2)}`,
      );
    }

    const newReserved = goal.reservedAmountCents + dto.amountCents;
    const isAchieved = newReserved >= goal.targetAmountCents;

    return this.goalRepo.update(goalId, {
      reservedAmountCents: newReserved,
      isAchieved,
    });
  }

  async getStudentGoals(
    studentUserId: string,
    institutionId: string,
  ): Promise<StudentSavingsGoal[]> {
    return this.goalRepo.findByStudent(studentUserId, institutionId);
  }

  async cancelOrReleaseGoal(
    studentUserId: string,
    institutionId: string,
    goalId: string,
  ): Promise<void> {
    const goal = await this.goalRepo.findById(goalId);
    if (!goal) {
      throw new SavingsGoalNotFoundException(goalId);
    }

    if (goal.institutionId !== institutionId || goal.studentUserId !== studentUserId) {
      throw new TenantMismatchException('Unauthorized access to savings goal');
    }

    // Releasing goal returns reserved funds to available balance
    await this.goalRepo.delete(goalId);
  }

  async getSpendableBalance(
    studentUserId: string,
    institutionId: string,
  ): Promise<number> {
    const studentAccount = await this.ledgerService.getStudentAccount(
      studentUserId,
      institutionId,
    );
    const totalReserved = await this.goalRepo.getTotalReservedCents(
      studentUserId,
      institutionId,
    );
    return Math.max(0, studentAccount.balanceCents - totalReserved);
  }

  async getTotalReserved(
    studentUserId: string,
    institutionId: string,
  ): Promise<number> {
    return this.goalRepo.getTotalReservedCents(studentUserId, institutionId);
  }

  // Strict economy boundary enforcement
  prohibitConversionToPoints(): never {
    throw new ProhibitedCommunityConversionException(
      'Savings goals funds in ARS cannot be converted into community points',
    );
  }

  prohibitCashWithdrawal(): never {
    throw new ProhibitedTransferException(
      'Savings goals funds cannot be withdrawn as cash; funds only spend at the school kiosk',
    );
  }
}
