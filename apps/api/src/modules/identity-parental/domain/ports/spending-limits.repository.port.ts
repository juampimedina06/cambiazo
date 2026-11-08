import type { SpendingLimits } from '../entities/spending-limits.entity.js';

export interface SpendingLimitsRepositoryPort {
  findByStudentId(studentId: string): Promise<SpendingLimits | null>;
  save(limits: SpendingLimits): Promise<SpendingLimits>;
}

export const SPENDING_LIMITS_REPOSITORY = Symbol('SPENDING_LIMITS_REPOSITORY');
