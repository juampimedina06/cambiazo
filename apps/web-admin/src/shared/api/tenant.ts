export const DEFAULT_INSTITUTION_ID = 'e28bb18a-66fe-4f8e-9092-2df283f55001';

export function getActiveInstitutionId(): string {
  if (typeof window === 'undefined') {
    return DEFAULT_INSTITUTION_ID;
  }
  return window.localStorage.getItem('cambiazo_institution_id') || DEFAULT_INSTITUTION_ID;
}

