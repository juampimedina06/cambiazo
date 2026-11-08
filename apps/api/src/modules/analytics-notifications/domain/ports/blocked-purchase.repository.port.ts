import type { BlockedPurchaseAttempt } from '../entities/blocked-purchase-attempt.entity.js';

export const BLOCKED_PURCHASE_REPOSITORY = Symbol('BLOCKED_PURCHASE_REPOSITORY');

export interface BlockedPurchaseRepositoryPort {
  recordAttempt(attempt: BlockedPurchaseAttempt): Promise<BlockedPurchaseAttempt>;
  countAttempts(studentId: string, sinceDate: Date): Promise<number>;
  getAttempts(studentId: string, sinceDate: Date): Promise<BlockedPurchaseAttempt[]>;
}
