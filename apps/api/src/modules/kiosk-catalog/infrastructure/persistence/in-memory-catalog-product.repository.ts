import { Injectable } from '@nestjs/common';
import type { ProductCategory } from '@cambiazo/shared';
import {
  ProductNotFoundException,
  InsufficientStockException,
} from '../../../../common/errors/domain.exception.js';
import type { CatalogProduct } from '../../domain/entities/catalog-product.entity.js';
import type { CatalogProductRepositoryPort } from '../../domain/ports/catalog-product.repository.port.js';

@Injectable()
export class InMemoryCatalogProductRepository implements CatalogProductRepositoryPort {
  private readonly products = new Map<string, CatalogProduct>();

  constructor() {
    if (process.env.NODE_ENV !== 'test') {
      this.seedDefault();
    }
  }

  public seedDefault(): void {
    const institutionId = 'e28bb18a-66fe-4f8e-9092-2df283f55001';
    const now = new Date();
    const defaultProducts: CatalogProduct[] = [
      {
        id: '10000000-0000-4000-8000-000000000001',
        institutionId,
        name: 'Alfajor Triple Chocolate',
        category: 'CANDY',
        priceCents: 120000,
        stock: 50,
        isActive: true,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: '10000000-0000-4000-8000-000000000002',
        institutionId,
        name: 'Tostado Jamón y Queso',
        category: 'HOT_MEAL',
        priceCents: 200000,
        stock: 30,
        isActive: true,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: '10000000-0000-4000-8000-000000000003',
        institutionId,
        name: 'Jugo Natural de Naranja',
        category: 'DRINK',
        priceCents: 100000,
        stock: 45,
        isActive: true,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: '10000000-0000-4000-8000-000000000004',
        institutionId,
        name: 'Manzana Roja Fresca',
        category: 'HEALTHY_SNACK',
        priceCents: 60000,
        stock: 40,
        isActive: true,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: '10000000-0000-4000-8000-000000000005',
        institutionId,
        name: 'Barra de Cereal con Miel',
        category: 'HEALTHY_SNACK',
        priceCents: 80000,
        stock: 35,
        isActive: true,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: '10000000-0000-4000-8000-000000000006',
        institutionId,
        name: 'Cuaderno Rayado Escolar',
        category: 'STATIONERY',
        priceCents: 150000,
        stock: 20,
        isActive: true,
        createdAt: now,
        updatedAt: now,
      },
    ];
    for (const p of defaultProducts) {
      this.products.set(p.id, p);
    }
  }

  async delete(id: string): Promise<boolean> {
    return this.products.delete(id);
  }

  async create(product: CatalogProduct): Promise<CatalogProduct> {
    this.products.set(product.id, { ...product });
    return { ...product };
  }

  async findById(id: string): Promise<CatalogProduct | null> {
    const prod = this.products.get(id);
    return prod ? { ...prod } : null;
  }

  async findByInstitution(
    institutionId: string,
    filter?: { category?: ProductCategory; isActive?: boolean },
  ): Promise<CatalogProduct[]> {
    return Array.from(this.products.values())
      .filter((p) => {
        if (p.institutionId !== institutionId) return false;
        if (filter?.category && p.category !== filter.category) return false;
        if (filter?.isActive !== undefined && p.isActive !== filter.isActive) return false;
        return true;
      })
      .map((p) => ({ ...p }));
  }

  async update(id: string, update: Partial<CatalogProduct>): Promise<CatalogProduct> {
    const existing = this.products.get(id);
    if (!existing) {
      throw new ProductNotFoundException(id);
    }

    const updated: CatalogProduct = {
      ...existing,
      ...update,
      id: existing.id,
      institutionId: existing.institutionId,
      updatedAt: new Date(),
    };

    this.products.set(id, updated);
    return { ...updated };
  }

  async deductStock(id: string, quantity: number): Promise<CatalogProduct> {
    const existing = this.products.get(id);
    if (!existing) {
      throw new ProductNotFoundException(id);
    }

    if (existing.stock < quantity) {
      throw new InsufficientStockException(id);
    }

    const updated: CatalogProduct = {
      ...existing,
      stock: existing.stock - quantity,
      updatedAt: new Date(),
    };

    this.products.set(id, updated);
    return { ...updated };
  }

  clear(): void {
    this.products.clear();
  }
}
