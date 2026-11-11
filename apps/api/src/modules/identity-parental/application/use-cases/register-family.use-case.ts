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

export interface RegisteredStudentSummary {
  id: string;
  institutionId: string;
  fullName: string;
  dni: string;
  grade: string;
  dateOfBirth: string;
  consentStatus: 'PENDING';
}

export interface RegisterFamilyResult {
  parentId: string;
  studentId: string;
  institutionId: string;
  status: 'PENDING_CONSENT';
  message: string;
  parent: {
    id: string;
    institutionId: string;
    fullName: string;
    email: string;
    dni: string;
    phone?: string;
  };
  students: RegisteredStudentSummary[];
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

    const allStudentInputs = [
      dto.student,
      ...(dto.additionalStudents ?? []),
    ];

    // Check duplicate DNIs across submitted children and existing institution users
    const seenDnis = new Set<string>();
    for (const sInput of allStudentInputs) {
      const normalizedDni = sInput.dni.trim();
      if (seenDnis.has(normalizedDni)) {
        throw new DomainException(
          DOMAIN_ERROR_CODES.USER_NOT_FOUND,
          `Duplicate student DNI ${normalizedDni} in registration`,
          HttpStatus.BAD_REQUEST,
        );
      }
      seenDnis.add(normalizedDni);

      const existingStudentDni = await this.userRepo.findByDniAndInstitution(
        normalizedDni,
        institutionId,
      );
      if (existingStudentDni) {
        throw new DomainException(
          DOMAIN_ERROR_CODES.USER_NOT_FOUND,
          `Student with DNI ${normalizedDni} is already registered in this institution`,
          HttpStatus.CONFLICT,
        );
      }
    }

    const parentId = randomUUID();
    const createdAt = new Date();

    const parentUser: User = {
      id: parentId,
      institutionId,
      role: 'PARENT',
      email: dto.parent.email.toLowerCase(),
      passwordHash: `hash_${dto.parent.password}`,
      fullName: dto.parent.fullName.trim(),
      dni: dto.parent.dni.trim(),
      phone: dto.parent.phone,
      isActive: true,
      createdAt,
    };

    await this.userRepo.create(parentUser);

    const registeredStudents: RegisteredStudentSummary[] = [];

    for (const sInput of allStudentInputs) {
      const studentId = randomUUID();
      const studentUser: User = {
        id: studentId,
        institutionId,
        role: 'STUDENT',
        email: `${sInput.dni.trim()}@student.cambiazo.internal`,
        passwordHash: `hash_${dto.parent.password}`,
        fullName: sInput.fullName.trim(),
        dni: sInput.dni.trim(),
        grade: sInput.grade.trim(),
        dateOfBirth: sInput.dateOfBirth.trim(),
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

      await this.userRepo.create(studentUser);
      await this.linkRepo.create(link);

      registeredStudents.push({
        id: studentId,
        institutionId,
        fullName: studentUser.fullName,
        dni: studentUser.dni || '',
        grade: studentUser.grade || '',
        dateOfBirth: studentUser.dateOfBirth || '',
        consentStatus: 'PENDING',
      });
    }

    await this.invitationRepo.incrementUsedCount(invitation.id);

    return {
      parentId,
      studentId: registeredStudents[0]!.id,
      institutionId,
      status: 'PENDING_CONSENT',
      message: 'Family successfully registered. Explicit parental consent is required before student can operate.',
      parent: {
        id: parentUser.id,
        institutionId,
        fullName: parentUser.fullName,
        email: parentUser.email,
        dni: parentUser.dni || '',
        phone: parentUser.phone,
      },
      students: registeredStudents,
    };
  }
}
