import { Injectable } from '@nestjs/common';
import type { ExchangeItem } from '../../domain/entities/exchange-item.entity.js';
import type {
  ExchangeItemRepositoryPort,
  FindExchangeItemsFilter,
} from '../../domain/ports/exchange-item.repository.port.js';

@Injectable()
export class InMemoryExchangeItemRepository implements ExchangeItemRepositoryPort {
  private readonly items = new Map<string, ExchangeItem>();

  async save(item: ExchangeItem): Promise<ExchangeItem> {
    const copy = { ...item };
    this.items.set(item.id, copy);
    return { ...copy };
  }

  async findById(id: string): Promise<ExchangeItem | null> {
    const found = this.items.get(id);
    return found ? { ...found } : null;
  }

  async findByInstitution(
    institutionId: string,
    filter?: FindExchangeItemsFilter,
  ): Promise<ExchangeItem[]> {
    const results: ExchangeItem[] = [];

    for (const item of this.items.values()) {
      if (item.institutionId !== institutionId) {
        continue;
      }

      if (filter?.status && item.moderationStatus !== filter.status) {
        continue;
      }

      if (filter?.studentUserId && item.studentUserId !== filter.studentUserId) {
        continue;
      }

      results.push({ ...item });
    }

    return results.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async update(id: string, updates: Partial<ExchangeItem>): Promise<ExchangeItem> {
    const current = this.items.get(id);
    if (!current) {
      throw new Error(`ExchangeItem ${id} not found`);
    }

    const updated: ExchangeItem = {
      ...current,
      ...updates,
      updatedAt: new Date(),
    };

    this.items.set(id, updated);
    return { ...updated };
  }

  clear(): void {
    this.items.clear();
  }
}
