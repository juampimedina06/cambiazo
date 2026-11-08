import type { AccountType } from '@cambiazo/shared';
import type { Account } from '../entities/account.entity.js';
import type { LedgerTransaction } from '../entities/ledger-transaction.entity.js';
import type { LedgerEntry } from '../entities/ledger-entry.entity.js';

export interface LedgerRepositoryPort {
  getAccountById(id: string): Promise<Account | null>;
  getAccountByUserAndType(
    userId: string,
    type: AccountType,
    institutionId: string,
  ): Promise<Account | null>;
  getOrCreateAccount(params: {
    userId: string | null;
    type: AccountType;
    institutionId: string;
  }): Promise<Account>;
  getPlatformClearingAccount(institutionId: string): Promise<Account>;
  findTransactionById(id: string): Promise<LedgerTransaction | null>;
  findTransactionByIdempotencyKey(key: string): Promise<LedgerTransaction | null>;
  executeTransaction(
    transaction: LedgerTransaction,
    entries: LedgerEntry[],
  ): Promise<{ transaction: LedgerTransaction; entries: LedgerEntry[] }>;
  getEntriesByAccountId(
    accountId: string,
    options?: { from?: Date; to?: Date },
  ): Promise<LedgerEntry[]>;
  getEntriesByTransactionId(transactionId: string): Promise<LedgerEntry[]>;
  listTransactionsByInstitution(institutionId: string): Promise<LedgerTransaction[]>;

  // Append-only immutability contract (must throw ImmutableRecordViolationException)
  updateEntry(id: string, update: Partial<LedgerEntry>): Promise<never>;
  deleteEntry(id: string): Promise<never>;
  updateTransaction(id: string, update: Partial<LedgerTransaction>): Promise<never>;
  deleteTransaction(id: string): Promise<never>;
}

export const LEDGER_REPOSITORY = Symbol('LEDGER_REPOSITORY');
