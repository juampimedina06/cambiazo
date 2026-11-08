import { Inject, Injectable, HttpStatus } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import type { RegisterParentAndStudentDto } from '@cambiazo/shared';
import { DOMAIN_ERROR_CODES } from '@cambiazo/shared';
import {
  DomainException,
  InvalidInvitationCodeException,
} from '../../../../common/errors/domain.exception.js';
import {
  type InvitationRepositoryPort,
  INVITATION_REPOSITORY,
} from '../../../tenants/domain/ports/invitation.repository.port.js';
import type { User } from '../../domain/entities/user.entity.js';
import type { ParentStudentLink } from '../../domain/entities/parent-student-link.entity.js';
import {
  type UserRepositoryPort,
  USER_REPOSITORY,
} from '../../domain/ports/user.repository.port.js';
import {
  type ParentStudentLinkRepositoryPort,
  PARENT_STUDENT_LINK_REPOSITORY,
} from '../../domain/ports/parent-student-link.repository.port.js';

export interface RegisterFamilyResult {
  parentId: string;
  studentId: string;
  institutionId: string;
  status: 'PENDING_CONSENT';
  message: string;
}

@Injectable()
export class RegisterFamilyUseCase {
  constructor(
    @Inject(INVITATION_REPOSITORY)
    private readonly invitationRepo: InvitationRepositoryPort,
    @Inject(USER_REPOSITORY)
    private readonly userRepo: UserRepositoryPort,
    @Inject(PARENT_STUDENT_LINK_REPOSITORY)
    private readonly linkRepo: ParentStudentLinkRepositoryPort,
  ) {}

  async execute(dto: RegisterParentAndStudentDto): Promise<RegisterFamilyResult> {
    const code = dto.inviteCode.trim().toUpperCase();
    const invitation = await this.invitationRepo.findByCode(code);

    if (!invitation) {
      throw new InvalidInvitationCodeException(`Invitation code '${dto.inviteCode}' is not valid`);
    }

    const now = new Date();
    if (invitation.expiresAt && invitation.expiresAt < now) {
      throw new InvalidInvitationCodeException('Invitation code has expired');
    }

    if (invitation.maxUses !== null && invitation.usedCount >= invitation.maxUses) {
      throw new InvalidInvitationCodeException('Invitation code has reached maximum uses');
    }

    const institutionId = invitation.institutionId;

    // Check if parent email already exists
    const existingParentEmail = await this.userRepo.findByEmail(dto.parent.email);
    if (existingParentEmail) {
      throw new DomainException(
        DOMAIN_ERROR_CODES.USER_NOT_FOUND,
        `User with email ${dto.parent.email} is already registered`,
        HttpStatus.CONFLICT,
      );
    }

    // Check parent DNI in this institution
    const existingParentDni = await this.userRepo.findByDniAndInstitution(
      dto.parent.dni,
      institutionId,
    );
    if (existingParentDni) {
      throw new DomainException(
        DOMAIN_ERROR_CODES.USER_NOT_FOUND,
        `Parent with DNI ${dto.parent.dni} is already registered in this institution`,
        HttpStatus.CONFLICT,
      );
    }

    // Check student DNI in this institution
    const existingStudentDni = await this.userRepo.findByDniAndInstitution(
      dto.student.dni,
      institutionId,
    );
    if (existingStudentDni) {
      throw new DomainException(
        DOMAIN_ERROR_CODES.USER_NOT_FOUND,
        `Student with DNI ${dto.student.dni} is already registered in this institution`,
        HttpStatus.CONFLICT,
      );
    }

    const parentId = randomUUID();
    const studentId = randomUUID();
    const createdAt = new Date();

    const parentUser: User = {
      id: parentId,
      institutionId,
      role: 'PARENT',
      email: dto.parent.email.toLowerCase(),
      passwordHash: `hash_${dto.parent.password}`, // Mock hash for local storage
      fullName: dto.parent.fullName,
      dni: dto.parent.dni,
      phone: dto.parent.phone,
      isActive: true,
      createdAt,
    };

    // Student account is created with isActive = false (pending Ley 25.326 consent)
    const studentUser: User = {
      id: studentId,
      institutionId,
      role: 'STUDENT',
      email: `${dto.student.dni}@student.cambiazo.internal`,
      passwordHash: `hash_student_${dto.student.dni}`,
      fullName: dto.student.fullName,
      dni: dto.student.dni,
      grade: dto.student.grade,
      dateOfBirth: dto.student.dateOfBirth,
      isActive: false,
      createdAt,
    };

    const link: ParentStudentLink = {
      id: randomUUID(),
      institutionId,
      parentUserId: parentId,
      studentUserId: studentId,
      createdAt,
    };

    await this.userRepo.create(parentUser);
    await this.userRepo.create(studentUser);
    await this.linkRepo.create(link);
    await this.invitationRepo.incrementUsedCount(invitation.id);

    return {
      parentId,
      studentId,
      institutionId,
      status: 'PENDING_CONSENT',
      message: 'Family successfully registered. Explicit parental consent is required before student can operate.',
    };
  }
}
