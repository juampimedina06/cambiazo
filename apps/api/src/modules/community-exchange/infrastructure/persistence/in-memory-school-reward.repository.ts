import { Injectable } from '@nestjs/common';
import {
  isPersistenceDisabled,
  readJsonDataFile,
  writeJsonDataFile,
} from '../../../../common/persistence/json-file-store.js';
import type { SchoolReward } from '../../domain/entities/school-reward.entity.js';
import type { SchoolRewardRepositoryPort } from '../../domain/ports/school-reward.repository.port.js';

const STORAGE_FILE = 'school-rewards.json';

@Injectable()
export class InMemorySchoolRewardRepository implements SchoolRewardRepositoryPort {
  private readonly rewards = new Map<string, SchoolReward>();

  constructor() {
    if (!isPersistenceDisabled()) {
      this.seedDefault();
      this.loadFromDisk();
    }
  }

  private loadFromDisk(): void {
    const parsed = readJsonDataFile<SchoolReward[]>(STORAGE_FILE);
    if (!parsed) return;
    this.rewards.clear();
    for (const r of parsed) {
      this.rewards.set(r.id, r);
    }
  }

  private saveToDisk(): void {
    writeJsonDataFile(STORAGE_FILE, Array.from(this.rewards.values()));
  }

  public seedDefault(): void {
    const institutionId = 'e28bb18a-66fe-4f8e-9092-2df283f55001';
    const now = new Date();
    const rewardsList: SchoolReward[] = [
      {
        id: '66666666-6666-4666-8666-111111111111',
        institutionId,
        title: 'Pase Libre de Biblioteca por 1 Mes',
        description: 'Acceso ilimitado a préstamo especial de libros y cómics escolares.',
        pointsCost: 50,
        stock: 15,
        isActive: true,
        createdAt: now,
      },
      {
        id: '66666666-6666-4666-8666-222222222222',
        institutionId,
        title: 'Kit de Marcadores Ecológicos',
        description: 'Set de 6 marcadores escolares recargables con tinta al agua.',
        pointsCost: 80,
        stock: 8,
        isActive: true,
        createdAt: now,
      },
      {
        id: '66666666-6666-4666-8666-333333333333',
        institutionId,
        title: 'Mención de Honor al Mérito Solidario',
        description: 'Diploma escolar oficial firmado por dirección en el acto escolar.',
        pointsCost: 100,
        stock: 25,
        isActive: true,
        createdAt: now,
      },
      {
        id: '66666666-6666-4666-8666-444444444444',
        institutionId,
        title: 'Almuerzo Saludable Especial en Kiosco',
        description: 'Tostado especial + jugo natural en el recreo largo como reconocimiento escolar.',
        pointsCost: 150,
        stock: 5,
        isActive: true,
        createdAt: now,
      },
    ];
    for (const r of rewardsList) {
      this.rewards.set(r.id, r);
    }
  }

  async update(id: string, partial: Partial<SchoolReward>): Promise<SchoolReward | null> {
    const current = this.rewards.get(id);
    if (!current) return null;
    const updated: SchoolReward = { ...current, ...partial, id: current.id };
    this.rewards.set(id, updated);
    this.saveToDisk();
    return { ...updated };
  }

  async delete(id: string): Promise<boolean> {
    const deleted = this.rewards.delete(id);
    if (deleted) this.saveToDisk();
    return deleted;
  }

  async save(reward: SchoolReward): Promise<SchoolReward> {
    const copy = { ...reward };
    this.rewards.set(reward.id, copy);
    this.saveToDisk();
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
      this.saveToDisk();
    }
  }

  clear(): void {
    this.rewards.clear();
  }
}
