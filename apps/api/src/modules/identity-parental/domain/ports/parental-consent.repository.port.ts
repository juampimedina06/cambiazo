import type { ParentalConsent } from '../entities/parental-consent.entity.js';

export interface ParentalConsentRepositoryPort {
  // Ley 25.326: Append-only immutable log
  append(consent: ParentalConsent): Promise<ParentalConsent>;
  getLatestConsent(studentUserId: string): Promise<ParentalConsent | null>;
  getAuditTrail(studentUserId: string): Promise<ParentalConsent[]>;
}

export const PARENTAL_CONSENT_REPOSITORY = Symbol(
  'PARENTAL_CONSENT_REPOSITORY',
);
