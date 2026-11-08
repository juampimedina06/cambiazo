import { Injectable } from '@nestjs/common';
import type { BlockedPurchaseAttempt } from '../../domain/entities/blocked-purchase-attempt.entity.js';
import type { BlockedPurchaseRepositoryPort } from '../../domain/ports/blocked-purchase.repository.port.js';

@Injectable()
export class InMemoryBlockedPurchaseRepository implements BlockedPurchaseRepositoryPort {
  private readonly attempts: BlockedPurchaseAttempt[] = [];

  async recordAttempt(attempt: BlockedPurchaseAttempt): Promise<BlockedPurchaseAttempt> {
    const copy = { ...attempt };
    this.attempts.push(copy);
    return { ...copy };
  }

  async countAttempts(studentId: string, sinceDate: Date): Promise<number> {
    let count = 0;
    for (const a of this.attempts) {
      if (a.studentId === studentId && a.createdAt >= sinceDate) {
        count++;
      }
    }
    return count;
  }

  async getAttempts(studentId: string, sinceDate: Date): Promise<BlockedPurchaseAttempt[]> {
    return this.attempts
      .filter((a) => a.studentId === studentId && a.createdAt >= sinceDate)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .map((a) => ({ ...a }));
  }

  clear(): void {
    this.attempts.length = 0;
  }
}
