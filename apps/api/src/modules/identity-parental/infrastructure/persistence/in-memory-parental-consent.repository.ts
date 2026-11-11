import { Injectable } from '@nestjs/common';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { ImmutableRecordViolationException } from '../../../../common/errors/domain.exception.js';
import type { ParentalConsent } from '../../domain/entities/parental-consent.entity.js';
import type { ParentalConsentRepositoryPort } from '../../domain/ports/parental-consent.repository.port.js';

@Injectable()
export class InMemoryParentalConsentRepository
  implements ParentalConsentRepositoryPort
{
  // Ley 25.326: Append-only immutable log
  private readonly consents: ParentalConsent[] = [];
  private readonly storageFile = path.resolve(process.cwd(), '.data', 'parental-consents.json');

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
        const parsed = JSON.parse(raw) as Array<ParentalConsent & { createdAt: string }>;
        this.consents.length = 0;
        for (const item of parsed) {
          this.consents.push(
            Object.freeze({
              ...item,
              createdAt: new Date(item.createdAt),
            }),
          );
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
      fs.writeFileSync(
        this.storageFile,
        JSON.stringify(this.consents, null, 2),
        'utf-8',
      );
    } catch {
      // Ignore disk write errors in dev
    }
  }

  public seedDefault(): void {
    const defaultConsent: ParentalConsent = {
      id: 'consent-default-1',
      institutionId: 'e28bb18a-66fe-4f8e-9092-2df283f55001',
      parentUserId: '11111111-1111-4111-8111-111111111111',
      studentUserId: '22222222-2222-4222-8222-222222222222',
      action: 'GRANTED',
      termsVersion: 'v1.0-2026-AR-LEY25326',
      ipAddress: '127.0.0.1',
      userAgent: 'Seed Default',
      createdAt: new Date(Date.now() - 86400000),
    };
    this.consents.push(Object.freeze(defaultConsent));
  }

  async append(consent: ParentalConsent): Promise<ParentalConsent> {
    const record: ParentalConsent = {
      ...consent,
      createdAt: consent.createdAt instanceof Date ? consent.createdAt : new Date(consent.createdAt),
    };
    this.consents.push(Object.freeze(record));
    this.saveToDisk();
    return { ...record };
  }

  async getLatestConsent(studentUserId: string): Promise<ParentalConsent | null> {
    const studentConsents = this.consents
      .map((c, index) => ({ c, index }))
      .filter(({ c }) => c.studentUserId === studentUserId)
      .sort((a, b) => {
        const timeDiff = b.c.createdAt.getTime() - a.c.createdAt.getTime();
        if (timeDiff !== 0) return timeDiff;
        return b.index - a.index;
      });

    const latest = studentConsents[0];
    if (!latest) {
      return null;
    }
    return { ...latest.c };
  }

  async getAuditTrail(studentUserId: string): Promise<ParentalConsent[]> {
    return this.consents
      .map((c, index) => ({ c, index }))
      .filter(({ c }) => c.studentUserId === studentUserId)
      .sort((a, b) => {
        const timeDiff = a.c.createdAt.getTime() - b.c.createdAt.getTime();
        if (timeDiff !== 0) return timeDiff;
        return a.index - b.index;
      })
      .map(({ c }) => ({ ...c }));
  }

  // Ley 25.326 compliance: updates and deletions are strictly prohibited
  async update(): Promise<never> {
    throw new ImmutableRecordViolationException(
      'Ley 25.326 forbids modifying consent audit records.',
    );
  }

  async delete(): Promise<never> {
    throw new ImmutableRecordViolationException(
      'Ley 25.326 forbids deleting consent audit records.',
    );
  }

  // Clear helper for tests only
  clear(): void {
    this.consents.length = 0;
  }
}
