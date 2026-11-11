import { Injectable } from '@nestjs/common';
import {
  isPersistenceDisabled,
  readJsonDataFile,
  writeJsonDataFile,
} from '../../../../common/persistence/json-file-store.js';
import type { InstitutionInvitation } from '../../domain/entities/invitation.entity.js';
import type { InvitationRepositoryPort } from '../../domain/ports/invitation.repository.port.js';

const STORAGE_FILE = 'invitations.json';

@Injectable()
export class InMemoryInvitationRepository implements InvitationRepositoryPort {
  private readonly invitations = new Map<string, InstitutionInvitation>();

  constructor() {
    if (!isPersistenceDisabled()) {
      this.seedDefault();
      this.loadFromDisk();
    }
  }

  private loadFromDisk(): void {
    const parsed = readJsonDataFile<InstitutionInvitation[]>(STORAGE_FILE);
    if (!parsed) return;
    for (const item of parsed) {
      this.invitations.set(item.id, {
        ...item,
        expiresAt: item.expiresAt
          ? item.expiresAt instanceof Date
            ? item.expiresAt
            : new Date(item.expiresAt)
          : null,
        createdAt: item.createdAt instanceof Date ? item.createdAt : new Date(item.createdAt),
      });
    }
  }

  private saveToDisk(): void {
    writeJsonDataFile(STORAGE_FILE, Array.from(this.invitations.values()));
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
      {
        id: 'inv-sap-2026',
        institutionId: 'e28bb18a-66fe-4f8e-9092-2df283f55001',
        code: 'SAP2026',
        expiresAt,
        maxUses: 250,
        usedCount: 0,
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
    this.saveToDisk();
    return clone;
  }

  async findByCode(code: string): Promise<InstitutionInvitation | null> {
    this.loadFromDisk();
    const normalized = code.trim().toUpperCase();
    for (const inv of this.invitations.values()) {
      if (inv.code.toUpperCase() === normalized) {
        return { ...inv };
      }
    }
    return null;
  }

  async findById(id: string): Promise<InstitutionInvitation | null> {
    this.loadFromDisk();
    const inv = this.invitations.get(id);
    return inv ? { ...inv } : null;
  }

  async findByInstitutionId(institutionId: string): Promise<InstitutionInvitation[]> {
    this.loadFromDisk();
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
    this.loadFromDisk();
    const inv = this.invitations.get(id);
    if (inv) {
      inv.usedCount += 1;
      this.saveToDisk();
    }
  }

  // Clear helper for tests
  clear(): void {
    this.invitations.clear();
  }
}
