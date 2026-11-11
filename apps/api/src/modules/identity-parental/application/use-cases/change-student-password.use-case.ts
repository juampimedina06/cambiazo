import { Inject, Injectable, HttpStatus } from '@nestjs/common';
import {
  DOMAIN_ERROR_CODES,
  type ChangeStudentPasswordDto,
} from '@cambiazo/shared';
import type { AuthUser } from '../../../../common/auth/auth-user.interface.js';
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

export interface ChangeStudentPasswordResult {
  success: true;
  studentId: string;
}

@Injectable()
export class ChangeStudentPasswordUseCase {
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepo: UserRepositoryPort,
    @Inject(PARENT_STUDENT_LINK_REPOSITORY)
    private readonly linkRepo: ParentStudentLinkRepositoryPort,
  ) {}

  async execute(
    actor: AuthUser,
    dto: ChangeStudentPasswordDto,
  ): Promise<ChangeStudentPasswordResult> {
    if (!actor.institutionId) {
      throw new TenantMismatchException(
        'Authenticated user has no associated institution',
      );
    }

    let targetStudentId: string;

    if (actor.role === 'STUDENT') {
      if (dto.studentId && dto.studentId !== actor.id) {
        throw new DomainException(
          DOMAIN_ERROR_CODES.STUDENT_NOT_LINKED_TO_PARENT,
          'Students can only change their own password',
          HttpStatus.FORBIDDEN,
        );
      }
      targetStudentId = actor.id;
    } else if (actor.role === 'PARENT') {
      if (!dto.studentId) {
        throw new DomainException(
          DOMAIN_ERROR_CODES.USER_NOT_FOUND,
          'studentId is required when parent updates student password',
          HttpStatus.BAD_REQUEST,
        );
      }
      targetStudentId = dto.studentId;
    } else {
      throw new DomainException(
        DOMAIN_ERROR_CODES.STUDENT_NOT_LINKED_TO_PARENT,
        'Only parents or students can update a student password',
        HttpStatus.FORBIDDEN,
      );
    }

    const student = await this.userRepo.findById(targetStudentId);
    if (!student || student.role !== 'STUDENT') {
      throw new DomainException(
        DOMAIN_ERROR_CODES.USER_NOT_FOUND,
        `Student with ID ${targetStudentId} not found`,
        HttpStatus.NOT_FOUND,
      );
    }

    if (student.institutionId !== actor.institutionId) {
      throw new TenantMismatchException(
        'Cross-institution password update is forbidden',
      );
    }

    if (actor.role === 'PARENT') {
      const link = await this.linkRepo.findLink(
        actor.institutionId,
        actor.id,
        student.id,
      );
      if (!link) {
        throw new DomainException(
          DOMAIN_ERROR_CODES.STUDENT_NOT_LINKED_TO_PARENT,
          `Parent ${actor.id} is not linked to student ${student.id}`,
          HttpStatus.FORBIDDEN,
        );
      }
    }

    await this.userRepo.updatePasswordHash(
      student.id,
      `hash_${dto.newPassword}`,
    );

    return {
      success: true,
      studentId: student.id,
    };
  }
}

