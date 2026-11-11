import { Injectable } from '@nestjs/common';
import {
  isPersistenceDisabled,
  readJsonDataFile,
  writeJsonDataFile,
} from '../../../../common/persistence/json-file-store.js';
import type { ExchangeItem } from '../../domain/entities/exchange-item.entity.js';
import type {
  ExchangeItemRepositoryPort,
  FindExchangeItemsFilter,
} from '../../domain/ports/exchange-item.repository.port.js';

const STORAGE_FILE = 'exchange-items.json';

@Injectable()
export class InMemoryExchangeItemRepository implements ExchangeItemRepositoryPort {
  private readonly items = new Map<string, ExchangeItem>();

  constructor() {
    if (!isPersistenceDisabled()) {
      this.seedDefault();
      this.loadFromDisk();
    }
  }

  private loadFromDisk(): void {
    const parsed = readJsonDataFile<ExchangeItem[]>(STORAGE_FILE);
    if (!parsed) return;
    this.items.clear();
    for (const item of parsed) {
      this.items.set(item.id, item);
    }
  }

  private saveToDisk(): void {
    writeJsonDataFile(STORAGE_FILE, Array.from(this.items.values()));
  }

  private seedDefault(): void {
    const item1: ExchangeItem = {
      id: 'item-demo-1',
      institutionId: 'e28bb18a-66fe-4f8e-9092-2df283f55001',
      studentUserId: 'student-demo-1',
      title: 'Manual de Biología 2do Año Kapelusz',
      description: 'En excelente estado, con fotos a color y ejercicios sin resolver.',
      category: 'BOOKS',
      mode: 'DONATION',
      photoUrls: ['https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c'],
      moderationStatus: 'PENDING',
      pickupPointNotes: 'Entregar en secretaría escolar',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const item2: ExchangeItem = {
      id: 'item-demo-2',
      institutionId: 'e28bb18a-66fe-4f8e-9092-2df283f55001',
      studentUserId: 'student-demo-2',
      title: 'Juego de Geometría Pizzini 30cm',
      description: 'Regla, escuadra y transportador nuevos en su estuche.',
      category: 'SCHOOL_SUPPLIES',
      mode: 'BARTER',
      photoUrls: ['https://images.unsplash.com/photo-1588072432836-e10032774350'],
      moderationStatus: 'APPROVED',
      pickupPointNotes: 'Punto de entrega Biblioteca escolar',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.items.set(item1.id, item1);
    this.items.set(item2.id, item2);
  }

  async save(item: ExchangeItem): Promise<ExchangeItem> {
    const copy = { ...item };
    this.items.set(item.id, copy);
    this.saveToDisk();
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
    this.saveToDisk();
    return { ...updated };
  }

  clear(): void {
    this.items.clear();
  }
}
