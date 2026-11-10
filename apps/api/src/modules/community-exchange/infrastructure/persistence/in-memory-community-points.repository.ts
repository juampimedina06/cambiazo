import { Injectable } from '@nestjs/common';
import type { CommunityPointsEntry } from '../../domain/entities/community-points-entry.entity.js';
import type {
  CommunityPointsRepositoryPort,
  StudentPointsAggregate,
} from '../../domain/ports/community-points.repository.port.js';

@Injectable()
export class InMemoryCommunityPointsRepository implements CommunityPointsRepositoryPort {
  private readonly entries: CommunityPointsEntry[] = [];

  constructor() {
    if (process.env.NODE_ENV !== 'test') {
      this.seedDefault();
    }
  }

  public seedDefault(): void {
    const institutionId = 'e28bb18a-66fe-4f8e-9092-2df283f55001';
    const now = new Date();
    this.entries.push(
      {
        id: 'pts-seed-1',
        institutionId,
        studentUserId: '77777777-7777-4777-8777-111111111111',
        pointsDelta: 250,
        reason: 'EXCHANGE_DELIVERED',
        referenceId: 'item-1',
        createdAt: now,
      },
      {
        id: 'pts-seed-2',
        institutionId,
        studentUserId: '22222222-2222-4222-8222-222222222222',
        pointsDelta: 120,
        reason: 'EXCHANGE_DELIVERED',
        referenceId: 'item-3',
        createdAt: now,
      },
      {
        id: 'pts-seed-3',
        institutionId,
        studentUserId: '77777777-7777-4777-8777-333333333333',
        pointsDelta: 95,
        reason: 'EXCHANGE_DELIVERED',
        referenceId: 'item-2',
        createdAt: now,
      },
    );
  }

  async save(entry: CommunityPointsEntry): Promise<CommunityPointsEntry> {
    const copy = { ...entry };
    this.entries.push(copy);
    return { ...copy };
  }

  async getStudentBalance(studentUserId: string, institutionId: string): Promise<number> {
    let balance = 0;
    for (const e of this.entries) {
      if (e.studentUserId === studentUserId && e.institutionId === institutionId) {
        balance += e.pointsDelta;
      }
    }
    return balance;
  }

  async getEntriesByStudent(
    studentUserId: string,
    institutionId: string,
  ): Promise<CommunityPointsEntry[]> {
    return this.entries
      .filter((e) => e.studentUserId === studentUserId && e.institutionId === institutionId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .map((e) => ({ ...e }));
  }

  async getPointsEarnedSince(studentUserId: string, sinceDate: Date): Promise<number> {
    let earned = 0;
    for (const e of this.entries) {
      if (
        e.studentUserId === studentUserId &&
        e.pointsDelta > 0 &&
        e.createdAt >= sinceDate
      ) {
        earned += e.pointsDelta;
      }
    }
    return earned;
  }

  async getLeaderboardAggregates(institutionId: string): Promise<StudentPointsAggregate[]> {
    const totalsByStudent = new Map<string, number>();

    for (const e of this.entries) {
      if (e.institutionId !== institutionId) {
        continue;
      }
      const current = totalsByStudent.get(e.studentUserId) || 0;
      totalsByStudent.set(e.studentUserId, current + e.pointsDelta);
    }

    const aggregates: StudentPointsAggregate[] = [];
    for (const [studentUserId, accumulatedPoints] of totalsByStudent.entries()) {
      if (accumulatedPoints > 0) {
        aggregates.push({ studentUserId, accumulatedPoints });
      }
    }

    return aggregates.sort((a, b) => b.accumulatedPoints - a.accumulatedPoints);
  }

  clear(): void {
    this.entries.length = 0;
  }
}
