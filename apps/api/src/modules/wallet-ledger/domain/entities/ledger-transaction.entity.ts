export type LedgerReferenceType =
  | 'TOP_UP'
  | 'KIOSK_PURCHASE'
  | 'KIOSK_WITHDRAWAL'
  | 'CORRECTION_REVERSAL';

export interface LedgerTransaction {
  id: string;
  institutionId: string;
  referenceType: LedgerReferenceType | string;
  referenceId?: string;
  idempotencyKey?: string;
  description: string;
  metadata?: Record<string, unknown>;
  createdAt: Date;
}
