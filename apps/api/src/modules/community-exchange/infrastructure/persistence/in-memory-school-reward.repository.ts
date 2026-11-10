import { Injectable } from '@nestjs/common';
import type { SchoolReward } from '../../domain/entities/school-reward.entity.js';
import type { SchoolRewardRepositoryPort } from '../../domain/ports/school-reward.repository.port.js';

@Injectable()
export class InMemorySchoolRewardRepository implements SchoolRewardRepositoryPort {
  private readonly rewards = new Map<string, SchoolReward>();

  constructor() {
    if (process.env.NODE_ENV !== 'test') {
      this.seedDefault();
    }
  }

  private seedDefault(): void {
    const reward1: SchoolReward = {
      id: 'reward-demo-1',
      institutionId: 'e28bb18a-66fe-4f8e-9092-2df283f55001',
      title: 'Llavero Conmemorativo Belgrano 2026',
      description: 'Edición limitada en acrílico con el logo de la escuela.',
      pointsCost: 50,
      stock: 30,
      isActive: true,
      createdAt: new Date(),
    };
    const reward2: SchoolReward = {
      id: 'reward-demo-2',
      institutionId: 'e28bb18a-66fe-4f8e-9092-2df283f55001',
      title: 'Pase Libre a la Biblioteca por 1 Mes',
      description: 'Prioridad de reserva en salas de computación y préstamo especial.',
      pointsCost: 120,
      stock: 15,
      isActive: true,
      createdAt: new Date(),
    };
    this.rewards.set(reward1.id, reward1);
    this.rewards.set(reward2.id, reward2);
  }

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
