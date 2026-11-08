import { Inject, Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import type { CreateCatalogProductDto } from '@cambiazo/shared';
import {
  type CatalogProductRepositoryPort,
  CATALOG_PRODUCT_REPOSITORY,
} from '../../domain/ports/catalog-product.repository.port.js';
import type { CatalogProduct } from '../../domain/entities/catalog-product.entity.js';

@Injectable()
export class CreateCatalogProductUseCase {
  constructor(
    @Inject(CATALOG_PRODUCT_REPOSITORY)
    private readonly catalogRepo: CatalogProductRepositoryPort,
  ) {}

  async execute(
    institutionId: string,
    dto: CreateCatalogProductDto,
  ): Promise<CatalogProduct> {
    const product: CatalogProduct = {
      id: randomUUID(),
      institutionId: dto.institutionId || institutionId,
      name: dto.name,
      category: dto.category,
      priceCents: dto.priceCents,
      stock: dto.stock,
      isActive: dto.isActive ?? true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    return this.catalogRepo.create(product);
  }
}
