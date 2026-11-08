import { Inject, Injectable, HttpStatus } from '@nestjs/common';
import { DOMAIN_ERROR_CODES, type SpendingLimitsDto } from '@cambiazo/shared';
import {
  DomainException,
  TenantMismatchException,
} from '../../../../common/errors/domain.exception.js';
import {
  type UserRepositoryPort,
  USER_REPOSITORY,
} from '../../domain/ports/user.repository.port.js';
import {
  type ParentStudentLinkRepositoryPort,
  PARENT_STUDENT_LINK_REPOSITORY,
} from '../../domain/ports/parent-student-link.repository.port.js';
import {
  type SpendingLimitsRepositoryPort,
  SPENDING_LIMITS_REPOSITORY,
} from '../../domain/ports/spending-limits.repository.port.js';
import type { SpendingLimits } from '../../domain/entities/spending-limits.entity.js';

@Injectable()
export class UpdateSpendingLimitsUseCase {
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepo: UserRepositoryPort,
    @Inject(PARENT_STUDENT_LINK_REPOSITORY)
    private readonly linkRepo: ParentStudentLinkRepositoryPort,
    @Inject(SPENDING_LIMITS_REPOSITORY)
    private readonly limitsRepo: SpendingLimitsRepositoryPort,
  ) {}

  async execute(
    parentUserId: string,
    studentId: string,
    currentTenantId: string,
    dto: SpendingLimitsDto,
  ): Promise<SpendingLimits> {
    const student = await this.userRepo.findById(studentId);
    if (!student || student.role !== 'STUDENT') {
      throw new DomainException(
        DOMAIN_ERROR_CODES.USER_NOT_FOUND,
        `Student with ID ${studentId} not found`,
        HttpStatus.NOT_FOUND,
      );
    }

    if (student.institutionId !== currentTenantId) {
      throw new TenantMismatchException(
        `Cross-institution access: student ${student.institutionId} vs ${currentTenantId}`,
      );
    }

    const link = await this.linkRepo.findLink(
      currentTenantId,
      parentUserId,
      studentId,
    );

    if (!link) {
      throw new DomainException(
        DOMAIN_ERROR_CODES.STUDENT_NOT_LINKED_TO_PARENT,
        'Parent is not linked to this student',
        HttpStatus.FORBIDDEN,
      );
    }

    // Update student's isActive status to match !isPaused
    await this.userRepo.updateIsActive(studentId, !dto.isPaused);

    const saved = await this.limitsRepo.save({
      studentId,
      institutionId: currentTenantId,
      dailyLimitCents: dto.dailyLimitCents,
      weeklyLimitCents: dto.weeklyLimitCents,
      blockedCategories: dto.blockedCategories,
      isPaused: dto.isPaused,
      updatedAt: new Date(),
    });

    return saved;
  }
}
