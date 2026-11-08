import { Inject, Injectable, HttpStatus } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import type { RevokeParentalConsentDto } from '@cambiazo/shared';
import { DOMAIN_ERROR_CODES } from '@cambiazo/shared';
import type { AuthUser } from '../../../../common/auth/auth-user.interface.js';
import {
  DomainException,
  TenantMismatchException,
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

export interface RevokeParentalConsentResult {
  success: true;
  consentId: string;
  status: 'REVOKED';
  studentId: string;
  reason: string;
  revokedAt: string;
}

@Injectable()
export class RevokeParentalConsentUseCase {
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepo: UserRepositoryPort,
    @Inject(PARENT_STUDENT_LINK_REPOSITORY)
    private readonly linkRepo: ParentStudentLinkRepositoryPort,
    @Inject(PARENTAL_CONSENT_REPOSITORY)
    private readonly consentRepo: ParentalConsentRepositoryPort,
  ) {}

  async execute(
    parentUser: AuthUser,
    dto: RevokeParentalConsentDto,
    fallbackIp = '127.0.0.1',
    userAgent = 'Unknown Client',
  ): Promise<RevokeParentalConsentResult> {
    if (!parentUser.institutionId) {
      throw new TenantMismatchException('Parent user has no associated institution');
    }

    const student = await this.userRepo.findById(dto.studentId);
    if (!student) {
      throw new DomainException(
        DOMAIN_ERROR_CODES.USER_NOT_FOUND,
        `Student with ID ${dto.studentId} not found`,
        HttpStatus.NOT_FOUND,
      );
    }

    // Strict multi-tenant isolation
    if (student.institutionId !== parentUser.institutionId) {
      throw new TenantMismatchException(
        `Cross-institution revocation attempt: Parent institution ${parentUser.institutionId} does not match student institution ${student.institutionId}`,
      );
    }

    // Check parent-student link
    const link = await this.linkRepo.findLink(
      parentUser.institutionId,
      parentUser.id,
      dto.studentId,
    );
    if (!link) {
      throw new DomainException(
        DOMAIN_ERROR_CODES.STUDENT_NOT_LINKED_TO_PARENT,
        `Parent ${parentUser.id} is not linked to student ${dto.studentId}`,
        HttpStatus.FORBIDDEN,
      );
    }

    // Create immutable revocation record under Ley 25.326
    const consent: ParentalConsent = {
      id: randomUUID(),
      institutionId: parentUser.institutionId,
      parentUserId: parentUser.id,
      studentUserId: dto.studentId,
      action: 'REVOKED',
      termsVersion: 'REVOCATION',
      ipAddress: fallbackIp,
      userAgent: userAgent || 'Unknown Client',
      reason: dto.reason,
      createdAt: new Date(),
    };

    const saved = await this.consentRepo.append(consent);

    // Immediately suspend all minor operations per Ley 25.326
    await this.userRepo.updateIsActive(student.id, false);

    return {
      success: true,
      consentId: saved.id,
      status: 'REVOKED',
      studentId: student.id,
      reason: dto.reason,
      revokedAt: saved.createdAt.toISOString(),
    };
  }
}
