import { Inject, Injectable, HttpStatus } from '@nestjs/common';
import { DOMAIN_ERROR_CODES } from '@cambiazo/shared';
import type { AuthUser } from '../../../../common/auth/auth-user.interface.js';
import {
  DomainException,
  TenantMismatchException,
  UnauthorizedRoleException,
} from '../../../../common/errors/domain.exception.js';
import type { ParentalConsent } from '../../domain/entities/parental-consent.entity.js';
import {
  type UserRepositoryPort,
  USER_REPOSITORY,
} from '../../domain/ports/user.repository.port.js';
import {
  type ParentStudentLinkRepositoryPort,
  PARENT_STUDENT_LINK_REPOSITORY,
} from '../../domain/ports/parent-student-link.repository.port.js';
import {
  type ParentalConsentRepositoryPort,
  PARENTAL_CONSENT_REPOSITORY,
} from '../../domain/ports/parental-consent.repository.port.js';

@Injectable()
export class GetParentalConsentAuditUseCase {
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepo: UserRepositoryPort,
    @Inject(PARENT_STUDENT_LINK_REPOSITORY)
    private readonly linkRepo: ParentStudentLinkRepositoryPort,
    @Inject(PARENTAL_CONSENT_REPOSITORY)
    private readonly consentRepo: ParentalConsentRepositoryPort,
  ) {}

  async execute(studentId: string, requester: AuthUser): Promise<ParentalConsent[]> {
    const student = await this.userRepo.findById(studentId);
    if (!student || student.role !== 'STUDENT') {
      throw new DomainException(
        DOMAIN_ERROR_CODES.USER_NOT_FOUND,
        `Student with ID ${studentId} not found`,
        HttpStatus.NOT_FOUND,
      );
    }

    if (requester.role === 'SUPER_ADMIN') {
      return this.consentRepo.getAuditTrail(studentId);
    }

    if (student.institutionId !== requester.institutionId) {
      throw new TenantMismatchException(
        `Cross-institution audit access is forbidden: Requester is from ${requester.institutionId}, student is from ${student.institutionId}`,
      );
    }

    if (requester.role === 'PARENT') {
      const link = await this.linkRepo.findLink(
        requester.institutionId!,
        requester.id,
        studentId,
      );
      if (!link) {
        throw new DomainException(
          DOMAIN_ERROR_CODES.STUDENT_NOT_LINKED_TO_PARENT,
          `Parent ${requester.id} is not authorized to view audit trail for student ${studentId}`,
          HttpStatus.FORBIDDEN,
        );
      }
    } else if (requester.role !== 'SCHOOL_ADMIN') {
      throw new UnauthorizedRoleException(
        `Role ${requester.role} is not permitted to view parental consent audit trail`,
      );
    }

    return this.consentRepo.getAuditTrail(studentId);
  }
}
