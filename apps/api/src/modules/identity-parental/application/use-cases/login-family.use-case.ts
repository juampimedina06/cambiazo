import { Inject, Injectable, HttpStatus } from '@nestjs/common';
import type { ConsentStatus, LoginFamilyDto } from '@cambiazo/shared';
import { DOMAIN_ERROR_CODES } from '@cambiazo/shared';
import {
  DomainException,
  InvalidInvitationCodeException,
} from '../../../../common/errors/domain.exception.js';
import {
  INVITATION_REPOSITORY,
  type InvitationRepositoryPort,
} from '../../../tenants/domain/ports/invitation.repository.port.js';
import {
  INSTITUTION_REPOSITORY,
  type InstitutionRepositoryPort,
} from '../../../tenants/domain/ports/institution.repository.port.js';
import {
  USER_REPOSITORY,
  type UserRepositoryPort,
} from '../../domain/ports/user.repository.port.js';
import {
  PARENT_STUDENT_LINK_REPOSITORY,
  type ParentStudentLinkRepositoryPort,
} from '../../domain/ports/parent-student-link.repository.port.js';
import {
  PARENTAL_CONSENT_REPOSITORY,
  type ParentalConsentRepositoryPort,
} from '../../domain/ports/parental-consent.repository.port.js';
import type { User } from '../../domain/entities/user.entity.js';

export interface LoginFamilyStudentView {
  id: string;
  institutionId: string;
  role: 'STUDENT';
  fullName: string;
  email: string;
  dni?: string;
  grade?: string;
  dateOfBirth?: string;
  isActive: boolean;
  consentStatus: ConsentStatus;
}

export interface LoginFamilyResult {
  role: 'PARENT' | 'STUDENT';
  institutionId: string;
  institutionName: string;
  user: {
    id: string;
    institutionId: string;
    role: 'PARENT' | 'STUDENT';
    fullName: string;
    email: string;
    dni?: string;
    phone?: string;
    grade?: string;
    dateOfBirth?: string;
    isActive: boolean;
    consentStatus?: ConsentStatus;
  };
  students: LoginFamilyStudentView[];
}

@Injectable()
export class LoginFamilyUseCase {
  constructor(
    @Inject(INVITATION_REPOSITORY)
    private readonly invitationRepo: InvitationRepositoryPort,
    @Inject(INSTITUTION_REPOSITORY)
    private readonly institutionRepo: InstitutionRepositoryPort,
    @Inject(USER_REPOSITORY)
    private readonly userRepo: UserRepositoryPort,
    @Inject(PARENT_STUDENT_LINK_REPOSITORY)
    private readonly linkRepo: ParentStudentLinkRepositoryPort,
    @Inject(PARENTAL_CONSENT_REPOSITORY)
    private readonly consentRepo: ParentalConsentRepositoryPort,
  ) {}

  async execute(dto: LoginFamilyDto): Promise<LoginFamilyResult> {
    const normalizedCode = dto.inviteCode.trim().toUpperCase();
    const invitation = await this.invitationRepo.findByCode(normalizedCode);

    if (!invitation) {
      throw new InvalidInvitationCodeException(
        `Invitation code '${dto.inviteCode}' is not valid`,
      );
    }

    if (invitation.expiresAt && invitation.expiresAt < new Date()) {
      throw new InvalidInvitationCodeException('Invitation code has expired');
    }

    const institution = await this.institutionRepo.findById(
      invitation.institutionId,
    );
    if (!institution || institution.status !== 'ACTIVE') {
      throw new DomainException(
        DOMAIN_ERROR_CODES.INSTITUTION_NOT_FOUND,
        'Institution is not active',
        HttpStatus.FORBIDDEN,
      );
    }

    const identifier = dto.identifier.trim();
    let user: User | null = null;

    if (identifier.includes('@')) {
      const byEmail = await this.userRepo.findByEmail(identifier.toLowerCase());
      if (byEmail && byEmail.institutionId === invitation.institutionId) {
        user = byEmail;
      }
    }

    if (!user) {
      user = await this.userRepo.findByDniAndInstitution(
        identifier,
        invitation.institutionId,
      );
    }

    if (
      !user ||
      user.institutionId !== invitation.institutionId ||
      (user.role !== 'PARENT' && user.role !== 'STUDENT')
    ) {
      throw new DomainException(
        DOMAIN_ERROR_CODES.USER_NOT_FOUND,
        'Invalid credentials for this institution',
        HttpStatus.UNAUTHORIZED,
      );
    }

    if (!this.matchesPassword(user, dto.password)) {
      throw new DomainException(
        DOMAIN_ERROR_CODES.UNAUTHORIZED_ROLE,
        'Invalid credentials',
        HttpStatus.UNAUTHORIZED,
      );
    }

    if (user.role === 'PARENT') {
      const links = await this.linkRepo.findByParentId(user.id);
      const linkedStudents = await Promise.all(
        links.map((link) => this.userRepo.findById(link.studentUserId)),
      );

      const students: LoginFamilyStudentView[] = [];
      for (const student of linkedStudents) {
        if (!student || student.institutionId !== invitation.institutionId) {
          continue;
        }
        const consentStatus = await this.resolveConsentStatus(student.id);
        students.push({
          id: student.id,
          institutionId: student.institutionId,
          role: 'STUDENT',
          fullName: student.fullName,
          email: student.email,
          dni: student.dni,
          grade: student.grade,
          dateOfBirth: student.dateOfBirth,
          isActive: student.isActive,
          consentStatus,
        });
      }

      return {
        role: 'PARENT',
        institutionId: invitation.institutionId,
        institutionName: institution.name,
        user: {
          id: user.id,
          institutionId: user.institutionId,
          role: 'PARENT',
          fullName: user.fullName,
          email: user.email,
          dni: user.dni,
          phone: user.phone,
          isActive: user.isActive,
        },
        students,
      };
    }

    const consentStatus = await this.resolveConsentStatus(user.id);
    return {
      role: 'STUDENT',
      institutionId: invitation.institutionId,
      institutionName: institution.name,
      user: {
        id: user.id,
        institutionId: user.institutionId,
        role: 'STUDENT',
        fullName: user.fullName,
        email: user.email,
        dni: user.dni,
        grade: user.grade,
        dateOfBirth: user.dateOfBirth,
        isActive: user.isActive,
        consentStatus,
      },
      students: [],
    };
  }

  private matchesPassword(user: User, rawPassword: string): boolean {
    return (
      user.passwordHash === `hash_${rawPassword}` ||
      user.passwordHash === `hash_student_${rawPassword}` ||
      user.passwordHash === rawPassword
    );
  }

  private async resolveConsentStatus(
    studentUserId: string,
  ): Promise<ConsentStatus> {
    const latest = await this.consentRepo.getLatestConsent(studentUserId);
    if (!latest) {
      return 'PENDING';
    }
    return latest.action === 'GRANTED' ? 'GRANTED' : 'REVOKED';
  }
}
