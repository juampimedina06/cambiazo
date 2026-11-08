import { Inject, Injectable, HttpStatus } from '@nestjs/common';
import { DOMAIN_ERROR_CODES, type UserRole } from '@cambiazo/shared';
import {
  DomainException,
  TenantMismatchException,
  UnauthorizedRoleException,
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
export class GetSpendingLimitsUseCase {
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepo: UserRepositoryPort,
    @Inject(PARENT_STUDENT_LINK_REPOSITORY)
    private readonly linkRepo: ParentStudentLinkRepositoryPort,
    @Inject(SPENDING_LIMITS_REPOSITORY)
    private readonly limitsRepo: SpendingLimitsRepositoryPort,
  ) {}

  async execute(
    userId: string,
    userRole: UserRole,
    studentId: string,
    currentTenantId?: string | null,
  ): Promise<SpendingLimits> {
    const student = await this.userRepo.findById(studentId);
    if (!student || student.role !== 'STUDENT') {
      throw new DomainException(
        DOMAIN_ERROR_CODES.USER_NOT_FOUND,
        `Student with ID ${studentId} not found`,
        HttpStatus.NOT_FOUND,
      );
    }

    if (currentTenantId && student.institutionId !== currentTenantId && userRole !== 'SUPER_ADMIN') {
      throw new TenantMismatchException(
        `Cross-institution access: student ${student.institutionId} vs ${currentTenantId}`,
      );
    }

    if (userRole === 'PARENT') {
      const link = await this.linkRepo.findLink(
        student.institutionId || '',
        userId,
        studentId,
      );
      if (!link) {
        throw new DomainException(
          DOMAIN_ERROR_CODES.STUDENT_NOT_LINKED_TO_PARENT,
          'Parent is not linked to this student',
          HttpStatus.FORBIDDEN,
        );
      }
    } else if (userRole === 'STUDENT') {
      if (userId !== studentId) {
        throw new UnauthorizedRoleException('Student can only view their own spending limits');
      }
    }

    const limits = await this.limitsRepo.findByStudentId(studentId);
    if (!limits) {
      return {
        studentId,
        institutionId: student.institutionId || '',
        dailyLimitCents: 0,
        weeklyLimitCents: 0,
        blockedCategories: [],
        isPaused: !student.isActive,
        updatedAt: new Date(),
      };
    }

    return limits;
  }
}
