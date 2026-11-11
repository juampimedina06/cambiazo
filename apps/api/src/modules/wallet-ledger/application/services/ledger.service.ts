import { Inject, Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import type { AccountType, LedgerEntryDirection } from '@cambiazo/shared';
import {
  UnbalancedTransactionException,
  ProhibitedTransferException,
  InsufficientFundsException,
  ImmutableRecordViolationException,
} from '../../../../common/errors/domain.exception.js';
import {
  type LedgerRepositoryPort,
  LEDGER_REPOSITORY,
} from '../../domain/ports/ledger.repository.port.js';
import type { Account } from '../../domain/entities/account.entity.js';
import type {
  LedgerTransaction,
  LedgerReferenceType,
} from '../../domain/entities/ledger-transaction.entity.js';
import type { LedgerEntry } from '../../domain/entities/ledger-entry.entity.js';

export interface EntryDraft {
  accountId: string;
  direction: LedgerEntryDirection;
  amountCents: number;
}

export interface TransactionDraft {
  institutionId: string;
  referenceType: LedgerReferenceType | string;
  referenceId?: string;
  idempotencyKey?: string;
  description: string;
  metadata?: Record<string, unknown>;
  entries: EntryDraft[];
}

export interface ExecutedTransactionResult {
  transaction: LedgerTransaction;
  entries: LedgerEntry[];
  isDuplicate?: boolean;
}

@Injectable()
export class LedgerService {
  private mutex: Promise<void> = Promise.resolve();

  constructor(
    @Inject(LEDGER_REPOSITORY)
    private readonly ledgerRepo: LedgerRepositoryPort,
  ) {}

  private async acquireLock(): Promise<() => void> {
    let release!: () => void;
    const waitPromise = new Promise<void>((resolve) => {
      release = resolve;
    });
    const currentLock = this.mutex;
    this.mutex = currentLock.then(() => waitPromise);
    await currentLock;
    return release;
  }

  async recordTransaction(draft: TransactionDraft): Promise<ExecutedTransactionResult> {
    const releaseLock = await this.acquireLock();
    try {
      return await this.executeRecordTransaction(draft);
    } finally {
      releaseLock();
    }
  }

  private async executeRecordTransaction(draft: TransactionDraft): Promise<ExecutedTransactionResult> {
    // 1. Idempotency check
    if (draft.idempotencyKey) {

      const existingTx = await this.ledgerRepo.findTransactionByIdempotencyKey(
        draft.idempotencyKey,
      );
      if (existingTx) {
        const existingEntries = await this.ledgerRepo.getEntriesByTransactionId(
          existingTx.id,
        );
        return {
          transaction: existingTx,
          entries: existingEntries,
          isDuplicate: true,
        };
      }
    }

    // 2. Validate entries count and amounts
    if (!draft.entries || draft.entries.length < 2) {
      throw new UnbalancedTransactionException(
        'A double-entry transaction must have at least 2 entries',
      );
    }

    let totalDebits = 0;
    let totalCredits = 0;

    for (const entry of draft.entries) {
      if (entry.amountCents <= 0 || !Number.isInteger(entry.amountCents)) {
        throw new UnbalancedTransactionException(
          `Entry amount must be a positive integer in cents, received: ${entry.amountCents}`,
        );
      }

      if (entry.direction === 'DEBIT') {
        totalDebits += entry.amountCents;
      } else if (entry.direction === 'CREDIT') {
        totalCredits += entry.amountCents;
      } else {
        throw new UnbalancedTransactionException(`Invalid direction: ${entry.direction}`);
      }
    }

    // 3. Double-entry invariant: SUM(DEBIT) === SUM(CREDIT)
    if (totalDebits !== totalCredits) {
      throw new UnbalancedTransactionException(
        `Ledger invariant violated: SUM(DEBIT) [${totalDebits}] !== SUM(CREDIT) [${totalCredits}]`,
      );
    }

    // 4. Resolve accounts and validate business constraints
    const accountsById = new Map<string, Account>();
    for (const entry of draft.entries) {
      if (!accountsById.has(entry.accountId)) {
        const acc = await this.ledgerRepo.getAccountById(entry.accountId);
        if (!acc) {
          throw new UnbalancedTransactionException(
            `Account ${entry.accountId} not found in ledger`,
          );
        }
        accountsById.set(entry.accountId, acc);
      }
    }

    // Check prohibited transfers:
    // a) Student-to-student balance transfers (STUDENT_ALLOCATION -> STUDENT_ALLOCATION)
    const debitStudentAccounts = draft.entries.filter((e) => {
      const acc = accountsById.get(e.accountId)!;
      return e.direction === 'DEBIT' && acc.type === 'STUDENT_ALLOCATION';
    });

    const creditStudentAccounts = draft.entries.filter((e) => {
      const acc = accountsById.get(e.accountId)!;
      return e.direction === 'CREDIT' && acc.type === 'STUDENT_ALLOCATION';
    });

    if (debitStudentAccounts.length > 0 && creditStudentAccounts.length > 0) {
      throw new ProhibitedTransferException(
        'Student-to-student balance transfers (STUDENT_ALLOCATION -> STUDENT_ALLOCATION) are strictly prohibited',
      );
    }

    // b) Student or parent cash withdrawals
    if (draft.referenceType === 'CASH_WITHDRAWAL' || draft.referenceType === 'STUDENT_WITHDRAWAL') {
      throw new ProhibitedTransferException(
        'Cash withdrawals by students or parents are strictly prohibited',
      );
    }

    for (const entry of draft.entries) {
      const acc = accountsById.get(entry.accountId)!;
      if (
        (acc.type === 'STUDENT_ALLOCATION' || acc.type === 'PARENT_WALLET') &&
        draft.referenceType === 'KIOSK_WITHDRAWAL'
      ) {
        throw new ProhibitedTransferException(
          'Student and parent accounts cannot perform kiosk withdrawals',
        );
      }
    }

    // 5. Sufficient funds validation for debited accounts
    // Calculate net debit per account
    const netDebitsByAccount = new Map<string, number>();
    for (const entry of draft.entries) {
      const current = netDebitsByAccount.get(entry.accountId) || 0;
      if (entry.direction === 'DEBIT') {
        netDebitsByAccount.set(entry.accountId, current + entry.amountCents);
      } else {
        netDebitsByAccount.set(entry.accountId, current - entry.amountCents);
      }
    }

    for (const [accountId, netDebit] of netDebitsByAccount.entries()) {
      if (netDebit > 0) {
        const acc = accountsById.get(accountId)!;
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

    // 6. Build transaction and entries
    const transactionId = randomUUID();
    const transaction: LedgerTransaction = {
      id: transactionId,
      institutionId: draft.institutionId,
      referenceType: draft.referenceType,
      referenceId: draft.referenceId,
      idempotencyKey: draft.idempotencyKey,
      description: draft.description,
      metadata: draft.metadata,
      createdAt: new Date(),
    };

    const entries: LedgerEntry[] = draft.entries.map((e) => ({
      id: randomUUID(),
      transactionId,
      accountId: e.accountId,
      direction: e.direction,
      amountCents: e.amountCents,
      createdAt: new Date(),
    }));

    const result = await this.ledgerRepo.executeTransaction(transaction, entries);
    return {
      transaction: result.transaction,
      entries: result.entries,
      isDuplicate: false,
    };
  }

  async getStudentAccount(
    studentId: string,
    institutionId: string,
  ): Promise<Account> {
    return this.ledgerRepo.getOrCreateAccount({
      userId: studentId,
      type: 'STUDENT_ALLOCATION',
      institutionId,
    });
  }

  async getKioskAccount(
    kioskUserId: string,
    institutionId: string,
  ): Promise<Account> {
    return this.ledgerRepo.getOrCreateAccount({
      userId: kioskUserId,
      type: 'KIOSK_BALANCE',
      institutionId,
    });
  }

  async getPlatformClearingAccount(institutionId: string): Promise<Account> {
    return this.ledgerRepo.getPlatformClearingAccount(institutionId);
  }

  async calculateStudentSpending(
    studentId: string,
    institutionId: string,
  ): Promise<{ spentTodayCents: number; spentThisWeekCents: number }> {
    const studentAccount = await this.getStudentAccount(studentId, institutionId);

    // Start of today UTC
    const now = new Date();
    const startOfDay = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0, 0),
    );

    // Start of current week (Monday) UTC
    const dayOfWeek = now.getUTCDay(); // 0 is Sunday
    const distanceToMonday = (dayOfWeek + 6) % 7;
    const startOfWeek = new Date(startOfDay);
    startOfWeek.setUTCDate(startOfWeek.getUTCDate() - distanceToMonday);

    const entries = await this.ledgerRepo.getEntriesByAccountId(studentAccount.id, {
      from: startOfWeek,
    });

    let spentTodayCents = 0;
    let spentThisWeekCents = 0;

    for (const entry of entries) {
      if (entry.direction === 'DEBIT') {
        const tx = await this.ledgerRepo.findTransactionById(entry.transactionId);
        if (tx && tx.referenceType === 'KIOSK_PURCHASE') {
          spentThisWeekCents += entry.amountCents;
          if (entry.createdAt >= startOfDay) {
            spentTodayCents += entry.amountCents;
          }
        }
      }
    }

    return { spentTodayCents, spentThisWeekCents };
  }

  async getStudentTransactions(
    studentId: string,
    institutionId: string,
    limit = 30,
  ): Promise<
    Array<{
      id: string;
      referenceType: string;
      referenceId?: string;
      direction: LedgerEntryDirection;
      amountCents: number;
      description: string;
      metadata?: Record<string, unknown>;
      createdAt: Date;
    }>
  > {
    const studentAccount = await this.getStudentAccount(studentId, institutionId);
    const entries = await this.ledgerRepo.getEntriesByAccountId(studentAccount.id);

    const results: Array<{
      id: string;
      referenceType: string;
      referenceId?: string;
      direction: LedgerEntryDirection;
      amountCents: number;
      description: string;
      metadata?: Record<string, unknown>;
      createdAt: Date;
    }> = [];

    for (const entry of entries) {
      const tx = await this.ledgerRepo.findTransactionById(entry.transactionId);
      if (!tx) continue;
      results.push({
        id: tx.id,
        referenceType: String(tx.referenceType),
        referenceId: tx.referenceId,
        direction: entry.direction,
        amountCents: entry.amountCents,
        description: tx.description,
        metadata: tx.metadata,
        createdAt: tx.createdAt,
      });
    }

    return results
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, limit);
  }

  // Immutability checks
  async attemptUpdateEntry(): Promise<never> {
    return this.ledgerRepo.updateEntry('any-id', {});
  }

  async attemptDeleteEntry(): Promise<never> {
    return this.ledgerRepo.deleteEntry('any-id');
  }
}
