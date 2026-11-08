import { Injectable } from '@nestjs/common';
import type { RewardRedemption } from '../../domain/entities/reward-redemption.entity.js';
import type { RewardRedemptionRepositoryPort } from '../../domain/ports/reward-redemption.repository.port.js';

@Injectable()
export class InMemoryRewardRedemptionRepository implements RewardRedemptionRepositoryPort {
  private readonly redemptions: RewardRedemption[] = [];

  async save(redemption: RewardRedemption): Promise<RewardRedemption> {
    const copy = { ...redemption };
    this.redemptions.push(copy);
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
