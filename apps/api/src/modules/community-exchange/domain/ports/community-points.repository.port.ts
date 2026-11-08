import type { CommunityPointsEntry } from '../entities/community-points-entry.entity.js';

export const COMMUNITY_POINTS_REPOSITORY = Symbol('COMMUNITY_POINTS_REPOSITORY');

export interface StudentPointsAggregate {
  studentUserId: string;
  accumulatedPoints: number;
}

export interface CommunityPointsRepositoryPort {
  save(entry: CommunityPointsEntry): Promise<CommunityPointsEntry>;
  getStudentBalance(studentUserId: string, institutionId: string): Promise<number>;
  getEntriesByStudent(studentUserId: string, institutionId: string): Promise<CommunityPointsEntry[]>;
  getPointsEarnedSince(studentUserId: string, sinceDate: Date): Promise<number>;
  getLeaderboardAggregates(institutionId: string): Promise<StudentPointsAggregate[]>;
}
