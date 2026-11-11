import { Injectable } from '@nestjs/common';
import {
  isPersistenceDisabled,
  readJsonDataFile,
  writeJsonDataFile,
} from '../../../../common/persistence/json-file-store.js';
import type { RewardRedemption } from '../../domain/entities/reward-redemption.entity.js';
import type { RewardRedemptionRepositoryPort } from '../../domain/ports/reward-redemption.repository.port.js';

const STORAGE_FILE = 'reward-redemptions.json';

@Injectable()
export class InMemoryRewardRedemptionRepository implements RewardRedemptionRepositoryPort {
  private readonly redemptions: RewardRedemption[] = [];

  constructor() {
    if (!isPersistenceDisabled()) {
      const parsed = readJsonDataFile<RewardRedemption[]>(STORAGE_FILE);
      if (parsed) {
        this.redemptions.push(...parsed);
      }
    }
  }

  async save(redemption: RewardRedemption): Promise<RewardRedemption> {
    const copy = { ...redemption };
    const existingIdx = this.redemptions.findIndex((r) => r.id === redemption.id);
    if (existingIdx >= 0) {
      this.redemptions[existingIdx] = copy;
    } else {
      this.redemptions.push(copy);
    }
    writeJsonDataFile(STORAGE_FILE, this.redemptions);
    return { ...copy };
  }

  async findById(id: string): Promise<RewardRedemption | null> {
    const found = this.redemptions.find((r) => r.id === id);
    return found ? { ...found } : null;
  }

  async findByStudent(
    studentUserId: string,
    institutionId: string,
  ): Promise<RewardRedemption[]> {
    return this.redemptions
      .filter((r) => r.studentUserId === studentUserId && r.institutionId === institutionId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .map((r) => ({ ...r }));
  }

  async findByInstitution(institutionId: string): Promise<RewardRedemption[]> {
    return this.redemptions
      .filter((r) => r.institutionId === institutionId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .map((r) => ({ ...r }));
  }

  clear(): void {
    this.redemptions.length = 0;
  }
}
