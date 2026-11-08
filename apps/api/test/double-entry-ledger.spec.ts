import { describe, it, expect, beforeEach } from 'vitest';
import { InMemoryLedgerRepository } from '../src/modules/wallet-ledger/infrastructure/persistence/in-memory-ledger.repository.js';
import { LedgerService } from '../src/modules/wallet-ledger/application/services/ledger.service.js';
import {
  UnbalancedTransactionException,
  ProhibitedTransferException,
  InsufficientFundsException,
  ImmutableRecordViolationException,
} from '../src/common/errors/domain.exception.js';

describe('Double-Entry Ledger Engine (LedgerService)', () => {
  let ledgerRepo: InMemoryLedgerRepository;
  let ledgerService: LedgerService;

  const institutionId = '11111111-1111-1111-1111-111111111111';
  const student1Id = 'student-uuid-1';
  const student2Id = 'student-uuid-2';
  const kioskUserId = 'kiosk-uuid-1';

  beforeEach(async () => {
    ledgerRepo = new InMemoryLedgerRepository();
    ledgerService = new LedgerService(ledgerRepo);
  });

  describe('Invariant: SUM(DEBIT) === SUM(CREDIT)', () => {
    it('executes a balanced transaction and updates account balances', async () => {
      const studentAcc = await ledgerService.getStudentAccount(student1Id, institutionId);
      const clearingAcc = await ledgerService.getPlatformClearingAccount(institutionId);

      const result = await ledgerService.recordTransaction({
        institutionId,
        referenceType: 'TOP_UP',
        description: 'Initial top-up',
        entries: [
          { accountId: clearingAcc.id, direction: 'DEBIT', amountCents: 500000 },
          { accountId: studentAcc.id, direction: 'CREDIT', amountCents: 500000 },
        ],
      });

      expect(result.transaction).toBeDefined();
      expect(result.entries).toHaveLength(2);
      expect(result.isDuplicate).toBe(false);

      const updatedStudent = await ledgerRepo.getAccountById(studentAcc.id);
      expect(updatedStudent?.balanceCents).toBe(500000);

      const updatedClearing = await ledgerRepo.getAccountById(clearingAcc.id);
      expect(updatedClearing?.balanceCents).toBe(500000);
    });

    it('rejects an unbalanced transaction when debits do not equal credits', async () => {
      const studentAcc = await ledgerService.getStudentAccount(student1Id, institutionId);
      const clearingAcc = await ledgerService.getPlatformClearingAccount(institutionId);

      await expect(
        ledgerService.recordTransaction({
          institutionId,
          referenceType: 'TOP_UP',
          description: 'Unbalanced top-up',
          entries: [
            { accountId: clearingAcc.id, direction: 'DEBIT', amountCents: 500000 },
            { accountId: studentAcc.id, direction: 'CREDIT', amountCents: 400000 }, // Discrepancy!
          ],
        }),
      ).rejects.toThrowError(UnbalancedTransactionException);
    });

    it('rejects transactions with fewer than 2 entries or non-positive amounts', async () => {
      const studentAcc = await ledgerService.getStudentAccount(student1Id, institutionId);

      await expect(
        ledgerService.recordTransaction({
          institutionId,
          referenceType: 'TOP_UP',
          description: 'Single entry',
          entries: [{ accountId: studentAcc.id, direction: 'CREDIT', amountCents: 1000 }],
        }),
      ).rejects.toThrowError(UnbalancedTransactionException);

      const clearingAcc = await ledgerService.getPlatformClearingAccount(institutionId);

      await expect(
        ledgerService.recordTransaction({
          institutionId,
          referenceType: 'TOP_UP',
          description: 'Zero amount',
          entries: [
            { accountId: clearingAcc.id, direction: 'DEBIT', amountCents: 0 },
            { accountId: studentAcc.id, direction: 'CREDIT', amountCents: 0 },
          ],
        }),
      ).rejects.toThrowError(UnbalancedTransactionException);
    });
  });

  describe('Strict Immutability (Append-Only Ledger)', () => {
    it('throws ImmutableRecordViolationException on any attempt to UPDATE ledger entries or transactions', async () => {
      await expect(ledgerRepo.updateEntry('entry-1', {})).rejects.toThrowError(
        ImmutableRecordViolationException,
      );

      await expect(ledgerRepo.updateTransaction('tx-1', {})).rejects.toThrowError(
        ImmutableRecordViolationException,
      );
    });

    it('throws ImmutableRecordViolationException on any attempt to DELETE ledger entries or transactions', async () => {
      await expect(ledgerRepo.deleteEntry('entry-1')).rejects.toThrowError(
        ImmutableRecordViolationException,
      );

      await expect(ledgerRepo.deleteTransaction('tx-1')).rejects.toThrowError(
        ImmutableRecordViolationException,
      );
    });
  });

  describe('Prohibited Transfers & Operations', () => {
    it('strictly prohibits student-to-student balance transfers (STUDENT_ALLOCATION -> STUDENT_ALLOCATION)', async () => {
      const student1Acc = await ledgerService.getStudentAccount(student1Id, institutionId);
      const student2Acc = await ledgerService.getStudentAccount(student2Id, institutionId);
      const clearingAcc = await ledgerService.getPlatformClearingAccount(institutionId);

      // Top up student 1
      await ledgerService.recordTransaction({
        institutionId,
        referenceType: 'TOP_UP',
        description: 'Top up student 1',
        entries: [
          { accountId: clearingAcc.id, direction: 'DEBIT', amountCents: 200000 },
          { accountId: student1Acc.id, direction: 'CREDIT', amountCents: 200000 },
        ],
      });

      // Attempt transfer from student 1 to student 2
      await expect(
        ledgerService.recordTransaction({
          institutionId,
          referenceType: 'PEER_TRANSFER',
          description: 'Transfer between students',
          entries: [
            { accountId: student1Acc.id, direction: 'DEBIT', amountCents: 50000 },
            { accountId: student2Acc.id, direction: 'CREDIT', amountCents: 50000 },
          ],
        }),
      ).rejects.toThrowError(ProhibitedTransferException);
    });

    it('strictly prohibits cash withdrawals for student or parent accounts', async () => {
      const student1Acc = await ledgerService.getStudentAccount(student1Id, institutionId);
      const clearingAcc = await ledgerService.getPlatformClearingAccount(institutionId);

      await ledgerService.recordTransaction({
        institutionId,
        referenceType: 'TOP_UP',
        description: 'Top up',
        entries: [
          { accountId: clearingAcc.id, direction: 'DEBIT', amountCents: 100000 },
          { accountId: student1Acc.id, direction: 'CREDIT', amountCents: 100000 },
        ],
      });

      await expect(
        ledgerService.recordTransaction({
          institutionId,
          referenceType: 'CASH_WITHDRAWAL',
          description: 'Student attempting cash withdrawal',
          entries: [
            { accountId: student1Acc.id, direction: 'DEBIT', amountCents: 20000 },
            { accountId: clearingAcc.id, direction: 'CREDIT', amountCents: 20000 },
          ],
        }),
      ).rejects.toThrowError(ProhibitedTransferException);
    });
  });

  describe('Balance Validation & Insufficient Funds', () => {
    it('throws InsufficientFundsException when student has insufficient balance to cover a debit', async () => {
      const studentAcc = await ledgerService.getStudentAccount(student1Id, institutionId);
      const kioskAcc = await ledgerService.getKioskAccount(kioskUserId, institutionId);

      // Student has 0 balance, attempts to spend 150000 cents ($1500)
      await expect(
        ledgerService.recordTransaction({
          institutionId,
          referenceType: 'KIOSK_PURCHASE',
          description: 'Purchase with zero balance',
          entries: [
            { accountId: studentAcc.id, direction: 'DEBIT', amountCents: 150000 },
            { accountId: kioskAcc.id, direction: 'CREDIT', amountCents: 150000 },
          ],
        }),
      ).rejects.toThrowError(InsufficientFundsException);
    });
  });

  describe('Idempotency & Concurrency', () => {
    it('returns the existing transaction when receiving duplicate idempotency keys without duplicate accounting entries', async () => {
      const studentAcc = await ledgerService.getStudentAccount(student1Id, institutionId);
      const clearingAcc = await ledgerService.getPlatformClearingAccount(institutionId);

      const idempotencyKey = 'unique-idemp-key-12345';

      const firstCall = await ledgerService.recordTransaction({
        institutionId,
        referenceType: 'TOP_UP',
        idempotencyKey,
        description: 'First attempt',
        entries: [
          { accountId: clearingAcc.id, direction: 'DEBIT', amountCents: 100000 },
          { accountId: studentAcc.id, direction: 'CREDIT', amountCents: 100000 },
        ],
      });

      expect(firstCall.isDuplicate).toBe(false);

      const secondCall = await ledgerService.recordTransaction({
        institutionId,
        referenceType: 'TOP_UP',
        idempotencyKey,
        description: 'Duplicate attempt with same key',
        entries: [
          { accountId: clearingAcc.id, direction: 'DEBIT', amountCents: 100000 },
          { accountId: studentAcc.id, direction: 'CREDIT', amountCents: 100000 },
        ],
      });

      expect(secondCall.isDuplicate).toBe(true);
      expect(secondCall.transaction.id).toBe(firstCall.transaction.id);

      // Student balance should still be 100000 (NOT 200000)
      const studentInDb = await ledgerRepo.getAccountById(studentAcc.id);
      expect(studentInDb?.balanceCents).toBe(100000);
    });

    it('enforces balance integrity under concurrent transactions', async () => {
      const studentAcc = await ledgerService.getStudentAccount(student1Id, institutionId);
      const clearingAcc = await ledgerService.getPlatformClearingAccount(institutionId);
      const kioskAcc = await ledgerService.getKioskAccount(kioskUserId, institutionId);

      // Seed student with 100000 cents ($1000)
      await ledgerService.recordTransaction({
        institutionId,
        referenceType: 'TOP_UP',
        description: 'Seed balance',
        entries: [
          { accountId: clearingAcc.id, direction: 'DEBIT', amountCents: 100000 },
          { accountId: studentAcc.id, direction: 'CREDIT', amountCents: 100000 },
        ],
      });

      // Try 2 concurrent spends of 60000 cents ($600 each, total $1200 > $1000)
      const spend1 = ledgerService.recordTransaction({
        institutionId,
        referenceType: 'KIOSK_PURCHASE',
        idempotencyKey: 'concurrent-spend-1',
        description: 'Spend 1',
        entries: [
          { accountId: studentAcc.id, direction: 'DEBIT', amountCents: 60000 },
          { accountId: kioskAcc.id, direction: 'CREDIT', amountCents: 60000 },
        ],
      });

      const spend2 = ledgerService.recordTransaction({
        institutionId,
        referenceType: 'KIOSK_PURCHASE',
        idempotencyKey: 'concurrent-spend-2',
        description: 'Spend 2',
        entries: [
          { accountId: studentAcc.id, direction: 'DEBIT', amountCents: 60000 },
          { accountId: kioskAcc.id, direction: 'CREDIT', amountCents: 60000 },
        ],
      });

      const results = await Promise.allSettled([spend1, spend2]);
      const fulfilled = results.filter((r) => r.status === 'fulfilled');
      const rejected = results.filter((r) => r.status === 'rejected');

      // Exactly 1 must succeed and 1 must fail due to insufficient funds
      expect(fulfilled).toHaveLength(1);
      expect(rejected).toHaveLength(1);

      const finalStudent = await ledgerRepo.getAccountById(studentAcc.id);
      expect(finalStudent?.balanceCents).toBe(40000);
    });
  });
});
