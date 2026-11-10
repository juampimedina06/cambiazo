import {
  Controller,
  Post,
  Get,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  Inject,
  Optional,
  NotFoundException,
  UsePipes,
} from '@nestjs/common';
import {
  CreateCatalogProductSchema,
  type CreateCatalogProductDto,
  type ProductCategory,
} from '@cambiazo/shared';
import { Roles } from '../../../../common/auth/roles.decorator.js';
import { TenantId } from '../../../../common/tenant/tenant.guard.js';
import { ZodValidationPipe } from '../../../../common/pipes/zod-validation.pipe.js';
import { CreateCatalogProductUseCase } from '../../application/use-cases/create-catalog-product.use-case.js';
import { ListCatalogProductsUseCase } from '../../application/use-cases/list-catalog-products.use-case.js';
import {
  CATALOG_PRODUCT_REPOSITORY,
  type CatalogProductRepositoryPort,
} from '../../domain/ports/catalog-product.repository.port.js';
import type { CatalogProduct } from '../../domain/entities/catalog-product.entity.js';

@Controller('api/v1/kiosk')
export class KioskCatalogController {
  constructor(
    private readonly createCatalogProductUseCase: CreateCatalogProductUseCase,
    private readonly listCatalogProductsUseCase: ListCatalogProductsUseCase,
    @Optional()
    @Inject(CATALOG_PRODUCT_REPOSITORY)
    private readonly catalogRepo?: CatalogProductRepositoryPort & {
      delete?: (id: string) => Promise<boolean>;
    },
  ) {}

  @Post('products')
  @Roles('KIOSK', 'SCHOOL_ADMIN', 'SUPER_ADMIN')
  @UsePipes(new ZodValidationPipe(CreateCatalogProductSchema))
  async createProduct(
    @Body() body: CreateCatalogProductDto,
    @TenantId() institutionId: string,
  ): Promise<CatalogProduct> {
    return this.createCatalogProductUseCase.execute(institutionId, body);
  }

  @Get('products')
  @Roles('KIOSK', 'STUDENT', 'PARENT', 'SCHOOL_ADMIN', 'SUPER_ADMIN')
  async listProducts(
    @TenantId() institutionId: string,
    @Query('category') category?: ProductCategory,
  ): Promise<CatalogProduct[]> {
    return this.listCatalogProductsUseCase.execute(institutionId, {
      category,
      isActive: true,
    });
  }

  @Get('products/:id')
  @Roles('KIOSK', 'STUDENT', 'PARENT', 'SCHOOL_ADMIN', 'SUPER_ADMIN')
  async getProductById(@Param('id') id: string): Promise<CatalogProduct> {
    if (!this.catalogRepo) {
      throw new NotFoundException(`Product ${id} not found`);
    }
    const product = await this.catalogRepo.findById(id);
    if (!product) {
      throw new NotFoundException(`Product ${id} not found`);
    }
    return product;
  }

  @Patch('products/:id')
  @Roles('KIOSK', 'SCHOOL_ADMIN', 'SUPER_ADMIN')
  async updateProduct(
    @Param('id') id: string,
    @Body() body: Partial<CatalogProduct>,
  ): Promise<CatalogProduct> {
    if (!this.catalogRepo) {
      throw new NotFoundException(`Product ${id} not found`);
    }
    return this.catalogRepo.update(id, body);
  }

  @Delete('products/:id')
  @Roles('KIOSK', 'SCHOOL_ADMIN', 'SUPER_ADMIN')
  async deleteProduct(@Param('id') id: string): Promise<{ deleted: boolean }> {
    if (this.catalogRepo?.delete) {
      await this.catalogRepo.delete(id);
    }
    return { deleted: true };
  }
}
