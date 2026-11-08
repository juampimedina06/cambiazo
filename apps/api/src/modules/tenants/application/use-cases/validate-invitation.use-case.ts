import { Inject, Injectable } from '@nestjs/common';
import { InvalidInvitationCodeException } from '../../../../common/errors/domain.exception.js';
import {
  type InstitutionRepositoryPort,
  INSTITUTION_REPOSITORY,
} from '../../domain/ports/institution.repository.port.js';
import {
  type InvitationRepositoryPort,
  INVITATION_REPOSITORY,
} from '../../domain/ports/invitation.repository.port.js';

export interface ValidatedInvitationResult {
  valid: true;
  institution: {
    id: string;
    name: string;
    cuit: string;
    address: string;
    status: string;
  };
  invitation: {
    id: string;
    code: string;
    expiresAt: string | null;
    maxUses: number | null;
    usedCount: number;
  };
}

@Injectable()
export class ValidateInvitationUseCase {
  constructor(
    @Inject(INVITATION_REPOSITORY)
    private readonly invitationRepo: InvitationRepositoryPort,
    @Inject(INSTITUTION_REPOSITORY)
    private readonly institutionRepo: InstitutionRepositoryPort,
  ) {}

  async execute(code: string): Promise<ValidatedInvitationResult> {
    if (!code || typeof code !== 'string') {
      throw new InvalidInvitationCodeException('Invitation code must be provided');
    }

    const normalizedCode = code.trim().toUpperCase();
    const invitation = await this.invitationRepo.findByCode(normalizedCode);

    if (!invitation) {
      throw new InvalidInvitationCodeException(`Invitation code '${code}' not found`);
    }

    const now = new Date();
    if (invitation.expiresAt && invitation.expiresAt < now) {
      throw new InvalidInvitationCodeException('Invitation code has expired');
    }

    if (invitation.maxUses !== null && invitation.usedCount >= invitation.maxUses) {
      throw new InvalidInvitationCodeException('Invitation code has reached its maximum uses');
    }

    const institution = await this.institutionRepo.findById(invitation.institutionId);
    if (!institution || institution.status !== 'ACTIVE') {
      throw new InvalidInvitationCodeException(
        'The institution associated with this invitation is inactive or not found',
      );
    }

    return {
      valid: true,
      institution: {
        id: institution.id,
        name: institution.name,
        cuit: institution.cuit,
        address: institution.address,
        status: institution.status,
      },
      invitation: {
        id: invitation.id,
        code: invitation.code,
        expiresAt: invitation.expiresAt ? invitation.expiresAt.toISOString() : null,
        maxUses: invitation.maxUses,
        usedCount: invitation.usedCount,
      },
    };
  }
}
