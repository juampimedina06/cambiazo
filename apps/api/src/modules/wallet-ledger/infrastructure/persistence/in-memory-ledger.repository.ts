import { Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import type { AccountType } from '@cambiazo/shared';
import {
  isPersistenceDisabled,
  readJsonDataFile,
  writeJsonDataFile,
} from '../../../../common/persistence/json-file-store.js';
import {
  ImmutableRecordViolationException,
  AccountNotFoundException,
  InsufficientFundsException,
} from '../../../../common/errors/domain.exception.js';

import type { Account } from '../../domain/entities/account.entity.js';
import type { LedgerTransaction } from '../../domain/entities/ledger-transaction.entity.js';
import type { LedgerEntry } from '../../domain/entities/ledger-entry.entity.js';
import type { LedgerRepositoryPort } from '../../domain/ports/ledger.repository.port.js';

const STORAGE_FILE = 'ledger.json';

interface PersistedLedgerSnapshot {
  accounts: Account[];
  transactions: LedgerTransaction[];
  entries: LedgerEntry[];
}

@Injectable()
export class InMemoryLedgerRepository implements LedgerRepositoryPort {
  private readonly accounts = new Map<string, Account>();
  private readonly transactions = new Map<string, LedgerTransaction>();
  private readonly idempotencyMap = new Map<string, LedgerTransaction>();
  private readonly entries: LedgerEntry[] = [];

  constructor() {
    if (!isPersistenceDisabled()) {
      this.seedDefault();
      this.loadFromDisk();
    }
  }

  private loadFromDisk(): void {
    const snapshot = readJsonDataFile<PersistedLedgerSnapshot>(STORAGE_FILE);
    if (!snapshot) return;

    if (Array.isArray(snapshot.accounts)) {
      for (const acc of snapshot.accounts) {
        this.accounts.set(acc.id, acc);
      }
    }
    if (Array.isArray(snapshot.transactions)) {
      for (const tx of snapshot.transactions) {
        this.transactions.set(tx.id, tx);
        if (tx.idempotencyKey) {
          this.idempotencyMap.set(tx.idempotencyKey, tx);
        }
      }
    }
    if (Array.isArray(snapshot.entries)) {
      this.entries.length = 0;
      this.entries.push(...snapshot.entries);
    }
  }

  private saveToDisk(): void {
    writeJsonDataFile<PersistedLedgerSnapshot>(STORAGE_FILE, {
      accounts: Array.from(this.accounts.values()),
      transactions: Array.from(this.transactions.values()),
      entries: this.entries,
    });
  }

  public seedDefault(): void {
    const institutionId = 'e28bb18a-66fe-4f8e-9092-2df283f55001';
    const now = new Date();
    const studentAcc: Account = {
      id: 'acc-student-default',
      institutionId,
      userId: '22222222-2222-4222-8222-222222222222',
      type: 'STUDENT_ALLOCATION',
      currency: 'ARS',
      balanceCents: 730000, // $4.500 spendable + $2.800 reserved in savings goals
      createdAt: now,
      updatedAt: now,
    };
    const kioskAcc: Account = {
      id: 'acc-kiosk-default',
      institutionId,
      userId: 'kiosk-user-1',
      type: 'KIOSK_BALANCE',
      currency: 'ARS',
      balanceCents: 8500000,
      createdAt: now,
      updatedAt: now,
    };
    const clearingAcc: Account = {
      id: 'acc-clearing-default',
      institutionId,
      userId: null,
      type: 'PLATFORM_CLEARING',
      currency: 'ARS',
      balanceCents: -9230000,
      createdAt: now,
      updatedAt: now,
    };
    this.accounts.set(studentAcc.id, studentAcc);
    this.accounts.set(kioskAcc.id, kioskAcc);
    this.accounts.set(clearingAcc.id, clearingAcc);
  }

  async getAccountById(id: string): Promise<Account | null> {
    const acc = this.accounts.get(id);
    return acc ? { ...acc } : null;
  }

  async getAccountByUserAndType(
    userId: string,
    type: AccountType,
    institutionId: string,
  ): Promise<Account | null> {
    for (const acc of this.accounts.values()) {
      if (
        acc.userId === userId &&
        acc.type === type &&
        acc.institutionId === institutionId
      ) {
        return { ...acc };
      }
    }
    return null;
  }

  async getOrCreateAccount(params: {
    userId: string | null;
    type: AccountType;
    institutionId: string;
  }): Promise<Account> {
    const existing = await this.getAccountByUserAndType(
      params.userId || '',
      params.type,
      params.institutionId,
    );
    if (existing) {
      return existing;
    }

    const newAccount: Account = {
      id: randomUUID(),
      institutionId: params.institutionId,
      userId: params.userId,
      type: params.type,
      currency: 'ARS',
      balanceCents: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.accounts.set(newAccount.id, newAccount);
    this.saveToDisk();
    return { ...newAccount };
  }

  async getPlatformClearingAccount(institutionId: string): Promise<Account> {
    for (const acc of this.accounts.values()) {
      if (acc.type === 'PLATFORM_CLEARING' && acc.institutionId === institutionId) {
        return { ...acc };
      }
    }

    const clearingAccount: Account = {
      id: randomUUID(),
      institutionId,
      userId: null,
      type: 'PLATFORM_CLEARING',
      currency: 'ARS',
      balanceCents: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.accounts.set(clearingAccount.id, clearingAccount);
    this.saveToDisk();
    return { ...clearingAccount };
  }

  async findTransactionById(id: string): Promise<LedgerTransaction | null> {
    const tx = this.transactions.get(id);
    return tx ? { ...tx } : null;
  }

  async findTransactionByIdempotencyKey(key: string): Promise<LedgerTransaction | null> {
    const tx = this.idempotencyMap.get(key);
    return tx ? { ...tx } : null;
  }

  async executeTransaction(
    transaction: LedgerTransaction,
    entries: LedgerEntry[],
  ): Promise<{ transaction: LedgerTransaction; entries: LedgerEntry[] }> {
    // 1. Validate that all accounts exist
    for (const entry of entries) {
      if (!this.accounts.has(entry.accountId)) {
        throw new AccountNotFoundException(
          `Account ${entry.accountId} not found in ledger`,
        );
      }
    }

    // 2. Validate sufficient funds for all debited accounts before applying any updates
    const netDebitsByAccount = new Map<string, number>();
    for (const entry of entries) {
      const current = netDebitsByAccount.get(entry.accountId) || 0;
      if (entry.direction === 'DEBIT') {
        netDebitsByAccount.set(entry.accountId, current + entry.amountCents);
      } else {
        netDebitsByAccount.set(entry.accountId, current - entry.amountCents);
      }
    }

    for (const [accountId, netDebit] of netDebitsByAccount.entries()) {
      if (netDebit > 0) {
        const acc = this.accounts.get(accountId)!;
        if (
          acc.type === 'STUDENT_ALLOCATION' ||
          acc.type === 'KIOSK_BALANCE' ||
          acc.type === 'PARENT_WALLET'
        ) {
          if (acc.balanceCents < netDebit) {
            throw new InsufficientFundsException(
              `Insufficient balance in account ${acc.type}. Available: $${(acc.balanceCents / 100).toFixed(2)}, Required: $${(netDebit / 100).toFixed(2)}`,
            );
          }
        }
      }
    }

    // 3. Apply balance updates atomically

    for (const entry of entries) {
      const acc = this.accounts.get(entry.accountId)!;
      if (acc.type === 'PLATFORM_CLEARING') {
        if (entry.direction === 'DEBIT') {
          acc.balanceCents += entry.amountCents;
        } else {
          acc.balanceCents -= entry.amountCents;
        }
      } else {
        // STUDENT_ALLOCATION, KIOSK_BALANCE, PARENT_WALLET
        if (entry.direction === 'CREDIT') {
          acc.balanceCents += entry.amountCents;
        } else {
          acc.balanceCents -= entry.amountCents;
        }
      }
      acc.updatedAt = new Date();
      this.accounts.set(acc.id, acc);
    }

    // 3. Store transaction and entries
    this.transactions.set(transaction.id, { ...transaction });
    if (transaction.idempotencyKey) {
      this.idempotencyMap.set(transaction.idempotencyKey, { ...transaction });
    }

    for (const entry of entries) {
      this.entries.push({ ...entry });
    }

    this.saveToDisk();

    return {
      transaction: { ...transaction },
      entries: entries.map((e) => ({ ...e })),
    };
  }

  async getEntriesByAccountId(
    accountId: string,
    options?: { from?: Date; to?: Date },
  ): Promise<LedgerEntry[]> {
    return this.entries
      .filter((e) => {
        if (e.accountId !== accountId) return false;
        if (options?.from && e.createdAt < options.from) return false;
        if (options?.to && e.createdAt > options.to) return false;
        return true;
      })
      .map((e) => ({ ...e }));
  }

  async getEntriesByTransactionId(transactionId: string): Promise<LedgerEntry[]> {
    return this.entries
      .filter((e) => e.transactionId === transactionId)
      .map((e) => ({ ...e }));
  }

  async listTransactionsByInstitution(institutionId: string): Promise<LedgerTransaction[]> {
    return Array.from(this.transactions.values())
      .filter((t) => t.institutionId === institutionId)
      .map((t) => ({ ...t }));
  }

  // Strict immutability rules: any UPDATE or DELETE must throw
  async updateEntry(_id: string, _update: Partial<LedgerEntry>): Promise<never> {
    throw new ImmutableRecordViolationException(
      'Ledger entries are strictly immutable (append-only). UPDATE operations are forbidden.',
    );
  }

  async deleteEntry(_id: string): Promise<never> {
    throw new ImmutableRecordViolationException(
      'Ledger entries are strictly immutable (append-only). DELETE operations are forbidden.',
    );
  }

  async updateTransaction(
    _id: string,
    _update: Partial<LedgerTransaction>,
  ): Promise<never> {
    throw new ImmutableRecordViolationException(
      'Ledger transactions are strictly immutable (append-only). UPDATE operations are forbidden.',
    );
  }

  async deleteTransaction(_id: string): Promise<never> {
    throw new ImmutableRecordViolationException(
      'Ledger transactions are strictly immutable (append-only). DELETE operations are forbidden.',
    );
  }

  clear(): void {
    this.accounts.clear();
    this.transactions.clear();
    this.idempotencyMap.clear();
    this.entries.length = 0;
  }
}
