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

  public seedDefault(): void {
    const expiresAt = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);
    const createdAt = new Date();
    const list: InstitutionInvitation[] = [
      {
        id: 'inv-belgrano-2026',
        institutionId: 'e28bb18a-66fe-4f8e-9092-2df283f55001',
        code: 'BELGRANO2026',
        expiresAt,
        maxUses: 500,
        usedCount: 142,
        createdByUserId: 'admin-1',
        createdAt,
      },
      {
        id: 'inv-sanmartin-2026',
        institutionId: 'f39cc29b-77fa-5a9f-8183-3ef394f66002',
        code: 'SANMARTIN2026',
        expiresAt,
        maxUses: 500,
        usedCount: 84,
        createdByUserId: 'admin-1',
        createdAt,
      },
      {
        id: 'inv-normal1-2026',
        institutionId: 'a10dd30c-88ab-6b0a-9294-4fa405f77003',
        code: 'NORMAL12026',
        expiresAt,
        maxUses: 500,
        usedCount: 35,
        createdByUserId: 'admin-1',
        createdAt,
      },
    ];
    for (const inv of list) {
      this.invitations.set(inv.id, inv);
    }
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
    const isBelgrano =
      institutionId === 'e28bb18a-66fe-4f8e-9092-2df283f55001' ||
      institutionId === 'f47ac10b-58cc-4372-a567-0e02b2c3d479';

    for (const inv of this.invitations.values()) {
      if (
        inv.institutionId === institutionId ||
        (isBelgrano &&
          (inv.institutionId === 'e28bb18a-66fe-4f8e-9092-2df283f55001' ||
            inv.institutionId === 'f47ac10b-58cc-4372-a567-0e02b2c3d479'))
      ) {
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
