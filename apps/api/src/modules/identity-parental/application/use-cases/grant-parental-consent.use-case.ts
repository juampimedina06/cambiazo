import { Inject, Injectable, HttpStatus } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import type { GrantParentalConsentDto } from '@cambiazo/shared';
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

export interface GrantParentalConsentResult {
  success: true;
  consentId: string;
  status: 'GRANTED';
  studentId: string;
  institutionId: string;
  acceptedTermsVersion: string;
  grantedAt: string;
}

@Injectable()
export class GrantParentalConsentUseCase {
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
    dto: GrantParentalConsentDto,
    fallbackIp = '127.0.0.1',
    userAgent = 'Unknown Client',
  ): Promise<GrantParentalConsentResult> {
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

    // Strict multi-tenant check
    if (student.institutionId !== parentUser.institutionId) {
      throw new TenantMismatchException(
        `Cross-institution consent attempt: Parent institution ${parentUser.institutionId} does not match student institution ${student.institutionId}`,
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

    // Create immutable audit record under Ley 25.326
    const consent: ParentalConsent = {
      id: randomUUID(),
      institutionId: parentUser.institutionId,
      parentUserId: parentUser.id,
      studentUserId: dto.studentId,
      action: 'GRANTED',
      termsVersion: dto.acceptedTermsVersion,
      ipAddress: dto.signatureIp || fallbackIp,
      userAgent: userAgent || 'Unknown Client',
      createdAt: new Date(dto.acceptedAt),
    };

    const savedConsent = await this.consentRepo.append(consent);

    // Activate student account to allow operations
    await this.userRepo.updateIsActive(student.id, true);

    return {
      success: true,
      consentId: savedConsent.id,
      status: 'GRANTED',
      studentId: student.id,
      institutionId: student.institutionId,
      acceptedTermsVersion: savedConsent.termsVersion,
      grantedAt: savedConsent.createdAt.toISOString(),
    };
  }
}
