import type { InstitutionInvitation } from '../entities/invitation.entity.js';

export interface InvitationRepositoryPort {
  create(invitation: InstitutionInvitation): Promise<InstitutionInvitation>;
  findByCode(code: string): Promise<InstitutionInvitation | null>;
  findById(id: string): Promise<InstitutionInvitation | null>;
  incrementUsedCount(id: string): Promise<void>;
}

export const INVITATION_REPOSITORY = Symbol('INVITATION_REPOSITORY');
