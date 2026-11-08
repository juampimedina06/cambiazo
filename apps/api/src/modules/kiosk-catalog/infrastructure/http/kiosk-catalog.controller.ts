import {
  Controller,
  Post,
  Get,
  Body,
  Query,
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
import type { CatalogProduct } from '../../domain/entities/catalog-product.entity.js';

@Controller('api/v1/kiosk')
export class KioskCatalogController {
  constructor(
    private readonly createCatalogProductUseCase: CreateCatalogProductUseCase,
    private readonly listCatalogProductsUseCase: ListCatalogProductsUseCase,
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
}
