import type { SchoolReward } from '../entities/school-reward.entity.js';

export const SCHOOL_REWARD_REPOSITORY = Symbol('SCHOOL_REWARD_REPOSITORY');

export interface SchoolRewardRepositoryPort {
  save(reward: SchoolReward): Promise<SchoolReward>;
  findById(id: string): Promise<SchoolReward | null>;
  findByInstitution(institutionId: string, activeOnly?: boolean): Promise<SchoolReward[]>;
  decrementStock(id: string): Promise<void>;
}
