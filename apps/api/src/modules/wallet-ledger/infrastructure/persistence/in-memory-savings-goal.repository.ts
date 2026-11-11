import { Injectable } from '@nestjs/common';
import {
  isPersistenceDisabled,
  readJsonDataFile,
  writeJsonDataFile,
} from '../../../../common/persistence/json-file-store.js';
import type { StudentSavingsGoal } from '../../domain/entities/student-savings-goal.entity.js';
import type { SavingsGoalRepositoryPort } from '../../domain/ports/savings-goal.repository.port.js';

const STORAGE_FILE = 'savings-goals.json';

@Injectable()
export class InMemorySavingsGoalRepository implements SavingsGoalRepositoryPort {
  private readonly goals = new Map<string, StudentSavingsGoal>();

  constructor() {
    if (!isPersistenceDisabled()) {
      this.seedDefault();
      this.loadFromDisk();
    }
  }

  private loadFromDisk(): void {
    const parsed = readJsonDataFile<StudentSavingsGoal[]>(STORAGE_FILE);
    if (!parsed) return;
    this.goals.clear();
    for (const g of parsed) {
      this.goals.set(g.id, g);
    }
  }

  private saveToDisk(): void {
    writeJsonDataFile(STORAGE_FILE, Array.from(this.goals.values()));
  }

  public seedDefault(): void {
    const institutionId = 'e28bb18a-66fe-4f8e-9092-2df283f55001';
    const studentUserId = '22222222-2222-4222-8222-222222222222';
    const now = new Date();
    const defaultGoals: StudentSavingsGoal[] = [
      {
        id: 'goal-1',
        institutionId,
        studentUserId,
        title: 'Libro de Aventuras Escolar',
        targetAmountCents: 300000,
        reservedAmountCents: 180000,
        isAchieved: false,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'goal-2',
        institutionId,
        studentUserId,
        title: 'Almuerzo Especial de Fin de Mes',
        targetAmountCents: 250000,
        reservedAmountCents: 100000,
        isAchieved: false,
        createdAt: now,
        updatedAt: now,
      },
    ];
    for (const g of defaultGoals) {
      this.goals.set(g.id, g);
    }
  }

  async save(goal: StudentSavingsGoal): Promise<StudentSavingsGoal> {
    const copy = { ...goal };
    this.goals.set(goal.id, copy);
    this.saveToDisk();
    return { ...copy };
  }

  async findById(id: string): Promise<StudentSavingsGoal | null> {
    const found = this.goals.get(id);
    return found ? { ...found } : null;
  }

  async findByStudent(
    studentUserId: string,
    institutionId: string,
  ): Promise<StudentSavingsGoal[]> {
    const results: StudentSavingsGoal[] = [];

    for (const goal of this.goals.values()) {
      if (goal.studentUserId === studentUserId && goal.institutionId === institutionId) {
        results.push({ ...goal });
      }
    }

    return results.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async getTotalReservedCents(
    studentUserId: string,
    institutionId: string,
  ): Promise<number> {
    let total = 0;
    for (const goal of this.goals.values()) {
      if (
        goal.studentUserId === studentUserId &&
        goal.institutionId === institutionId
      ) {
        total += goal.reservedAmountCents;
      }
    }
    return total;
  }


  async update(id: string, updates: Partial<StudentSavingsGoal>): Promise<StudentSavingsGoal> {
    const current = this.goals.get(id);
    if (!current) {
      throw new Error(`Savings goal ${id} not found`);
    }

    const updated: StudentSavingsGoal = {
      ...current,
      ...updates,
      updatedAt: new Date(),
    };

    this.goals.set(id, updated);
    this.saveToDisk();
    return { ...updated };
  }

  async delete(id: string): Promise<void> {
    this.goals.delete(id);
    this.saveToDisk();
  }

  clear(): void {
    this.goals.clear();
  }
}
