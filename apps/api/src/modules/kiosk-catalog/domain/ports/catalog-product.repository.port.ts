import type { ProductCategory } from '@cambiazo/shared';
import type { CatalogProduct } from '../entities/catalog-product.entity.js';

export interface CatalogProductRepositoryPort {
  create(product: CatalogProduct): Promise<CatalogProduct>;
  findById(id: string): Promise<CatalogProduct | null>;
  findByInstitution(
    institutionId: string,
    filter?: { category?: ProductCategory; isActive?: boolean },
  ): Promise<CatalogProduct[]>;
  update(id: string, update: Partial<CatalogProduct>): Promise<CatalogProduct>;
  deductStock(id: string, quantity: number): Promise<CatalogProduct>;
}

export const CATALOG_PRODUCT_REPOSITORY = Symbol('CATALOG_PRODUCT_REPOSITORY');
