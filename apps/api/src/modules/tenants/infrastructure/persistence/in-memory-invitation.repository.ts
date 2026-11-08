import { Injectable } from '@nestjs/common';
import type { InstitutionInvitation } from '../../domain/entities/invitation.entity.js';
import type { InvitationRepositoryPort } from '../../domain/ports/invitation.repository.port.js';

@Injectable()
export class InMemoryInvitationRepository implements InvitationRepositoryPort {
  private readonly invitations = new Map<string, InstitutionInvitation>();

  async create(invitation: InstitutionInvitation): Promise<InstitutionInvitation> {
    const clone = { ...invitation };
    this.invitations.set(clone.id, clone);
    return clone;
  }

  async findByCode(code: string): Promise<InstitutionInvitation | null> {
    const normalized = code.trim().toUpperCase();
    for (const inv of this.invitations.values()) {
      if (inv.code.toUpperCase() === normalized) {
        return { ...inv };
      }
    }
    return null;
  }

  async findById(id: string): Promise<InstitutionInvitation | null> {
    const inv = this.invitations.get(id);
    return inv ? { ...inv } : null;
  }

  async incrementUsedCount(id: string): Promise<void> {
    const inv = this.invitations.get(id);
    if (inv) {
      inv.usedCount += 1;
    }
  }

  // Clear helper for tests
  clear(): void {
    this.invitations.clear();
  }
}
