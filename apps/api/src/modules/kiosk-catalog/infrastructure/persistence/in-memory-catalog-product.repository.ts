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
