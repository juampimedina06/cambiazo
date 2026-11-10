import { Injectable } from '@nestjs/common';
import type { SpendingLimitsRepositoryPort } from '../../domain/ports/spending-limits.repository.port.js';
import type { SpendingLimits } from '../../domain/entities/spending-limits.entity.js';

@Injectable()
export class InMemorySpendingLimitsRepository implements SpendingLimitsRepositoryPort {
  private readonly limitsByStudent = new Map<string, SpendingLimits>();

  constructor() {
    if (process.env.NODE_ENV !== 'test') {
      this.seedDefault();
    }
  }

  public seedDefault(): void {
    const defaultLimits: SpendingLimits = {
      studentId: '22222222-2222-4222-8222-222222222222',
      institutionId: 'e28bb18a-66fe-4f8e-9092-2df283f55001',
      dailyLimitCents: 200000,
      weeklyLimitCents: 1000000,
      blockedCategories: [],
      isPaused: false,
      updatedAt: new Date(),
    };
    this.limitsByStudent.set(defaultLimits.studentId, defaultLimits);
  }

  async findByStudentId(studentId: string): Promise<SpendingLimits | null> {
    const found = this.limitsByStudent.get(studentId);
    if (!found) return null;
    return { ...found };
  }

  async save(limits: SpendingLimits): Promise<SpendingLimits> {
    const updated: SpendingLimits = {
      ...limits,
      updatedAt: new Date(),
    };
    this.limitsByStudent.set(limits.studentId, updated);
    return { ...updated };
  }

  clear(): void {
    this.limitsByStudent.clear();
  }
}
