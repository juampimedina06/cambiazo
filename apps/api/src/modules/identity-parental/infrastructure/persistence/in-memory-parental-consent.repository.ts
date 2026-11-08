import { Injectable } from '@nestjs/common';
import { ImmutableRecordViolationException } from '../../../../common/errors/domain.exception.js';
import type { ParentalConsent } from '../../domain/entities/parental-consent.entity.js';
import type { ParentalConsentRepositoryPort } from '../../domain/ports/parental-consent.repository.port.js';

@Injectable()
export class InMemoryParentalConsentRepository
  implements ParentalConsentRepositoryPort
{
  // Ley 25.326: Append-only immutable log
  private readonly consents: ParentalConsent[] = [];

  async append(consent: ParentalConsent): Promise<ParentalConsent> {
    const record: ParentalConsent = {
      ...consent,
      createdAt: consent.createdAt instanceof Date ? consent.createdAt : new Date(consent.createdAt),
    };
    this.consents.push(Object.freeze(record));
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
