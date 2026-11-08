import type { LedgerEntryDirection } from '@cambiazo/shared';

export interface LedgerEntry {
  id: string;
  transactionId: string;
  accountId: string;
  direction: LedgerEntryDirection; // 'DEBIT' | 'CREDIT'
  amountCents: number; // BIGINT > 0
  createdAt: Date;
}
