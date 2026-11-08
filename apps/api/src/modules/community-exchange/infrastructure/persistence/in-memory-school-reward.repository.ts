import { Injectable } from '@nestjs/common';
import type { SchoolReward } from '../../domain/entities/school-reward.entity.js';
import type { SchoolRewardRepositoryPort } from '../../domain/ports/school-reward.repository.port.js';

@Injectable()
export class InMemorySchoolRewardRepository implements SchoolRewardRepositoryPort {
  private readonly rewards = new Map<string, SchoolReward>();

  async save(reward: SchoolReward): Promise<SchoolReward> {
    const copy = { ...reward };
    this.rewards.set(reward.id, copy);
    return { ...copy };
  }

  async findById(id: string): Promise<SchoolReward | null> {
    const found = this.rewards.get(id);
    return found ? { ...found } : null;
  }

  async findByInstitution(institutionId: string, activeOnly = true): Promise<SchoolReward[]> {
    const results: SchoolReward[] = [];

    for (const reward of this.rewards.values()) {
      if (reward.institutionId !== institutionId) {
        continue;
      }
      if (activeOnly && !reward.isActive) {
        continue;
      }
      results.push({ ...reward });
    }

    return results.sort((a, b) => a.pointsCost - b.pointsCost);
  }

  async decrementStock(id: string): Promise<void> {
    const current = this.rewards.get(id);
    if (!current) {
      return;
    }
    if (typeof current.stock === 'number' && current.stock > 0) {
      this.rewards.set(id, {
        ...current,
        stock: current.stock - 1,
      });
    }
  }

  clear(): void {
    this.rewards.clear();
  }
}
