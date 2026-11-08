import type { ProductCategory } from '@cambiazo/shared';

export interface CatalogProduct {
  id: string;
  institutionId: string;
  name: string;
  category: ProductCategory;
  priceCents: number;
  stock: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
