import { Injectable } from '@nestjs/common';
import type { InstitutionInvitation } from '../../domain/entities/invitation.entity.js';
import type { InvitationRepositoryPort } from '../../domain/ports/invitation.repository.port.js';

@Injectable()
export class InMemoryInvitationRepository implements InvitationRepositoryPort {
  private readonly invitations = new Map<string, InstitutionInvitation>();

  constructor() {
    if (process.env.NODE_ENV !== 'test') {
      this.seedDefault();
    }
  }

  private seedDefault(): void {
    const defaultInv: InstitutionInvitation = {
      id: 'inv-belgrano-2026',
      institutionId: 'e28bb18a-66fe-4f8e-9092-2df283f55001',
      code: 'BELGRANO2026',
      expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      maxUses: 500,
      usedCount: 0,
      createdByUserId: 'admin-1',
      createdAt: new Date(),
    };
    const secondaryInv: InstitutionInvitation = {
      id: 'inv-belgrano-f47',
      institutionId: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
      code: 'BELGRANO2026',
      expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      maxUses: 500,
      usedCount: 0,
      createdByUserId: 'admin-1',
      createdAt: new Date(),
    };
    this.invitations.set(defaultInv.id, defaultInv);
    this.invitations.set(secondaryInv.id, secondaryInv);
  }

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

  async findByInstitutionId(institutionId: string): Promise<InstitutionInvitation[]> {
    const results: InstitutionInvitation[] = [];
    for (const inv of this.invitations.values()) {
      if (inv.institutionId === institutionId) {
        results.push({ ...inv });
      }
    }
    return results;
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
