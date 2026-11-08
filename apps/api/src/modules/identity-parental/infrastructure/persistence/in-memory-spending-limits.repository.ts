import { Injectable } from '@nestjs/common';
import type { SpendingLimitsRepositoryPort } from '../../domain/ports/spending-limits.repository.port.js';
import type { SpendingLimits } from '../../domain/entities/spending-limits.entity.js';

@Injectable()
export class InMemorySpendingLimitsRepository implements SpendingLimitsRepositoryPort {
  private readonly limitsByStudent = new Map<string, SpendingLimits>();

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
