import type { ExchangeItem } from '../entities/exchange-item.entity.js';

export const EXCHANGE_ITEM_REPOSITORY = Symbol('EXCHANGE_ITEM_REPOSITORY');

export interface FindExchangeItemsFilter {
  status?: string;
  studentUserId?: string;
}

export interface ExchangeItemRepositoryPort {
  save(item: ExchangeItem): Promise<ExchangeItem>;
  findById(id: string): Promise<ExchangeItem | null>;
  findByInstitution(
    institutionId: string,
    filter?: FindExchangeItemsFilter,
  ): Promise<ExchangeItem[]>;
  update(id: string, updates: Partial<ExchangeItem>): Promise<ExchangeItem>;
}
