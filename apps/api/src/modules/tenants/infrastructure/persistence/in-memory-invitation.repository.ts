import { Injectable } from '@nestjs/common';
import * as fs from 'node:fs';
import * as path from 'node:path';
import type { InstitutionInvitation } from '../../domain/entities/invitation.entity.js';
import type { InvitationRepositoryPort } from '../../domain/ports/invitation.repository.port.js';

@Injectable()
export class InMemoryInvitationRepository implements InvitationRepositoryPort {
  private readonly invitations = new Map<string, InstitutionInvitation>();
  private readonly storageFile = path.resolve(process.cwd(), '.data', 'invitations.json');

  constructor() {
    if (process.env.NODE_ENV !== 'test') {
      this.seedDefault();
      this.loadFromDisk();
    }
  }

  private loadFromDisk(): void {
    if (process.env.NODE_ENV === 'test') return;
    try {
      if (fs.existsSync(this.storageFile)) {
        const raw = fs.readFileSync(this.storageFile, 'utf-8');
        const parsed = JSON.parse(raw) as Array<
          InstitutionInvitation & { expiresAt: string | null; createdAt: string }
        >;
        for (const item of parsed) {
          this.invitations.set(item.id, {
            ...item,
            expiresAt: item.expiresAt ? new Date(item.expiresAt) : null,
            createdAt: new Date(item.createdAt),
          });
        }
      }
    } catch {
      // Ignore disk read errors in dev
    }
  }

  private saveToDisk(): void {
    if (process.env.NODE_ENV === 'test') return;
    try {
      const dir = path.dirname(this.storageFile);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      const data = Array.from(this.invitations.values());
      fs.writeFileSync(this.storageFile, JSON.stringify(data, null, 2), 'utf-8');
    } catch {
      // Ignore disk write errors in dev
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
