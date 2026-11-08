import { Inject, Injectable, HttpStatus } from '@nestjs/common';
import { DOMAIN_ERROR_CODES } from '@cambiazo/shared';
import {
  DomainException,
  TenantMismatchException,
  ParentalConsentRequiredException,
  ParentalConsentRevokedException,
  AccountPausedException,
} from '../../../../common/errors/domain.exception.js';
import {
  type UserRepositoryPort,
  USER_REPOSITORY,
} from '../../domain/ports/user.repository.port.js';
import {
  type ParentalConsentRepositoryPort,
  PARENTAL_CONSENT_REPOSITORY,
} from '../../domain/ports/parental-consent.repository.port.js';

export interface CheckStudentConsentResult {
  canOperate: true;
  consentStatus: 'GRANTED';
  studentId: string;
  institutionId: string;
  consentId: string;
  termsVersion: string;
}

@Injectable()
export class CheckStudentConsentUseCase {
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepo: UserRepositoryPort,
    @Inject(PARENTAL_CONSENT_REPOSITORY)
    private readonly consentRepo: ParentalConsentRepositoryPort,
  ) {}

  async execute(
    studentId: string,
    currentTenantId?: string | null,
  ): Promise<CheckStudentConsentResult> {
    const student = await this.userRepo.findById(studentId);
    if (!student || student.role !== 'STUDENT') {
      throw new DomainException(
        DOMAIN_ERROR_CODES.USER_NOT_FOUND,
        `Student with ID ${studentId} not found`,
        HttpStatus.NOT_FOUND,
      );
    }

    // Strict multi-tenant verification
    if (currentTenantId && student.institutionId !== currentTenantId) {
      throw new TenantMismatchException(
        `Cross-institution student access: Student belongs to ${student.institutionId}, requested tenant is ${currentTenantId}`,
      );
    }

    const latestConsent = await this.consentRepo.getLatestConsent(studentId);

    if (!latestConsent) {
      throw new ParentalConsentRequiredException(
        'Student cannot operate without parental consent (Ley 25.326)',
      );
    }

    if (latestConsent.action === 'REVOKED') {
      throw new ParentalConsentRevokedException(
        'Student consent has been revoked by parent (Ley 25.326)',
      );
    }

    if (!student.isActive) {
      throw new AccountPausedException(
        'Student account is currently suspended or paused',
      );
    }

    return {
      canOperate: true,
      consentStatus: 'GRANTED',
      studentId: student.id,
      institutionId: student.institutionId || '',
      consentId: latestConsent.id,
      termsVersion: latestConsent.termsVersion,
    };
  }
}
