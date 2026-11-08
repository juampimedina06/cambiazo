import type { StudentSavingsGoal } from '../entities/student-savings-goal.entity.js';

export const SAVINGS_GOAL_REPOSITORY = Symbol('SAVINGS_GOAL_REPOSITORY');

export interface SavingsGoalRepositoryPort {
  save(goal: StudentSavingsGoal): Promise<StudentSavingsGoal>;
  findById(id: string): Promise<StudentSavingsGoal | null>;
  findByStudent(studentUserId: string, institutionId: string): Promise<StudentSavingsGoal[]>;
  getTotalReservedCents(studentUserId: string, institutionId: string): Promise<number>;
  update(id: string, updates: Partial<StudentSavingsGoal>): Promise<StudentSavingsGoal>;
  delete(id: string): Promise<void>;
}
