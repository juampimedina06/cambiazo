import { Inject, Injectable, HttpStatus } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import type { CreateInvitationDto } from '@cambiazo/shared';
import { DOMAIN_ERROR_CODES } from '@cambiazo/shared';
import type { AuthUser } from '../../../../common/auth/auth-user.interface.js';
import {
  DomainException,
  TenantMismatchException,
} from '../../../../common/errors/domain.exception.js';
import type { InstitutionInvitation } from '../../domain/entities/invitation.entity.js';
import {
  type InstitutionRepositoryPort,
  INSTITUTION_REPOSITORY,
} from '../../domain/ports/institution.repository.port.js';
import {
  type InvitationRepositoryPort,
  INVITATION_REPOSITORY,
} from '../../domain/ports/invitation.repository.port.js';

@Injectable()
export class CreateInvitationUseCase {
  constructor(
    @Inject(INSTITUTION_REPOSITORY)
    private readonly institutionRepo: InstitutionRepositoryPort,
    @Inject(INVITATION_REPOSITORY)
    private readonly invitationRepo: InvitationRepositoryPort,
  ) {}

  async execute(
    dto: CreateInvitationDto,
    creator: AuthUser,
  ): Promise<InstitutionInvitation> {
    const targetInstitutionId = dto.institutionId || creator.institutionId;

    if (!targetInstitutionId) {
      throw new DomainException(
        DOMAIN_ERROR_CODES.INSTITUTION_NOT_FOUND,
        'Institution ID is required',
        HttpStatus.BAD_REQUEST,
      );
    }

    if (creator.role !== 'SUPER_ADMIN' && creator.institutionId !== targetInstitutionId) {
      throw new TenantMismatchException(
        `User from institution ${creator.institutionId} cannot create invitations for ${targetInstitutionId}`,
      );
    }

    const institution = await this.institutionRepo.findById(targetInstitutionId);
    if (!institution) {
      throw new DomainException(
        DOMAIN_ERROR_CODES.INSTITUTION_NOT_FOUND,
        `Institution with ID ${targetInstitutionId} does not exist`,
        HttpStatus.NOT_FOUND,
      );
    }

    let code = dto.code;
    if (!code) {
      code = `INV-${randomUUID().slice(0, 8).toUpperCase()}`;
    } else {
      code = code.trim().toUpperCase();
      const existing = await this.invitationRepo.findByCode(code);
      if (existing) {
        throw new DomainException(
          DOMAIN_ERROR_CODES.INVITATION_CODE_ALREADY_EXISTS,
          `Invitation code '${code}' is already in use`,
          HttpStatus.CONFLICT,
        );
      }
    }

    const expiresAt = dto.expiresAt ? new Date(dto.expiresAt) : null;
    const maxUses = dto.maxUses ?? null;

    const entity: InstitutionInvitation = {
      id: randomUUID(),
      institutionId: targetInstitutionId,
      code,
      expiresAt,
      maxUses,
      usedCount: 0,
      createdByUserId: creator.id,
      createdAt: new Date(),
    };

    return this.invitationRepo.create(entity);
  }
}
