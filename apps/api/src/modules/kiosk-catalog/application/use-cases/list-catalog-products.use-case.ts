import { Inject, Injectable } from '@nestjs/common';
import type { ProductCategory } from '@cambiazo/shared';
import {
  type CatalogProductRepositoryPort,
  CATALOG_PRODUCT_REPOSITORY,
} from '../../domain/ports/catalog-product.repository.port.js';
import type { CatalogProduct } from '../../domain/entities/catalog-product.entity.js';

@Injectable()
export class ListCatalogProductsUseCase {
  constructor(
    @Inject(CATALOG_PRODUCT_REPOSITORY)
    private readonly catalogRepo: CatalogProductRepositoryPort,
  ) {}

  async execute(
    institutionId: string,
    filter?: { category?: ProductCategory; isActive?: boolean },
  ): Promise<CatalogProduct[]> {
    return this.catalogRepo.findByInstitution(institutionId, filter);
  }
}
