import type { RewardRedemption } from '../entities/reward-redemption.entity.js';

export const REWARD_REDEMPTION_REPOSITORY = Symbol('REWARD_REDEMPTION_REPOSITORY');

export interface RewardRedemptionRepositoryPort {
  save(redemption: RewardRedemption): Promise<RewardRedemption>;
  findById(id: string): Promise<RewardRedemption | null>;
  findByStudent(studentUserId: string, institutionId: string): Promise<RewardRedemption[]>;
  findByInstitution(institutionId: string): Promise<RewardRedemption[]>;
}
