import { describe, it, expect, beforeEach } from 'vitest';
import { ApiClient } from '../src/shared/api/api-client';
import { mockAdapter, DEFAULT_KIOSK_INSTITUTION_ID } from '../src/shared/api/mock-adapter';
import { CreateCatalogProductInput } from '../src/shared/api/types';
import { isParentBlockable, CATEGORY_LABELS } from '../src/entities/catalog';
import { CreateCatalogProductSchema } from '@cambiazo/shared';

describe('Kiosk Catalog Management (WAVE-2-WEB-02)', () => {
  let client: ApiClient;

  beforeEach(() => {
    mockAdapter.reset();
    client = new ApiClient(true);
  });

  describe('Catalog Listing & Category Filtering', () => {
    it('should list all initial seeded catalog products for the school kiosk', async () => {
      const products = await client.getCatalogProducts(DEFAULT_KIOSK_INSTITUTION_ID);
      expect(products.length).toBeGreaterThanOrEqual(10);

      const alfajor = products.find((p) => p.name === 'Alfajor de Arroz y Miel');
      expect(alfajor).toBeDefined();
      expect(alfajor?.category).toBe('HEALTHY_SNACK');
      expect(alfajor?.priceCents).toBe(120000); // $1.200 ARS
      expect(alfajor?.stock).toBe(45);
      expect(alfajor?.isActive).toBe(true);
    });

    it('should filter catalog products by specific category', async () => {
      const drinks = await client.getCatalogProducts(
        DEFAULT_KIOSK_INSTITUTION_ID,
        'DRINK'
      );
      expect(drinks.length).toBeGreaterThan(0);
      drinks.forEach((d) => expect(d.category).toBe('DRINK'));

      const candies = await client.getCatalogProducts(
        DEFAULT_KIOSK_INSTITUTION_ID,
        'CANDY'
      );
      expect(candies.length).toBeGreaterThan(0);
      candies.forEach((c) => expect(c.category).toBe('CANDY'));
    });
  });

  describe('Parent-Blockable Categories Classification', () => {
    it('should identify CANDY as a parent-blockable category with dedicated badge', () => {
      expect(isParentBlockable('CANDY')).toBe(true);
      expect(isParentBlockable('HEALTHY_SNACK')).toBe(false);
      expect(isParentBlockable('DRINK')).toBe(false);
      expect(isParentBlockable('HOT_MEAL')).toBe(false);
      expect(isParentBlockable('STATIONERY')).toBe(false);
    });

    it('should map Spanish labels correctly for all 5 product categories', () => {
      expect(CATEGORY_LABELS.HEALTHY_SNACK).toBe('Snack Saludable');
      expect(CATEGORY_LABELS.DRINK).toBe('Bebida');
      expect(CATEGORY_LABELS.CANDY).toBe('Golosina');
      expect(CATEGORY_LABELS.HOT_MEAL).toBe('Comida Caliente');
      expect(CATEGORY_LABELS.STATIONERY).toBe('Librería / Útiles');
    });
  });

  describe('Product Creation with Zod Schema & Pesos-to-Cents Conversion', () => {
    it('should create a valid catalog product with client pesos-to-cents conversion', async () => {
      const inputPesos = 1750; // $1.750 ARS entered by kiosk user
      const convertedCents = Math.round(inputPesos * 100); // 175000 cents

      const payload: CreateCatalogProductInput = {
        institutionId: DEFAULT_KIOSK_INSTITUTION_ID,
        name: 'Turrón de Maní Crocante',
        category: 'CANDY',
        priceCents: convertedCents,
        stock: 35,
        isActive: true,
      };

      // Direct Zod validation check
      expect(() => CreateCatalogProductSchema.parse(payload)).not.toThrow();

      const created = await client.createCatalogProduct(payload);
      expect(created.id).toBeDefined();
      expect(created.name).toBe('Turrón de Maní Crocante');
      expect(created.priceCents).toBe(175000);
      expect(created.stock).toBe(35);
      expect(created.category).toBe('CANDY');

      // Verify it appears in catalog list
      const products = await client.getCatalogProducts(DEFAULT_KIOSK_INSTITUTION_ID);
      expect(products.some((p) => p.id === created.id)).toBe(true);
    });

    it('should reject invalid payloads violating CreateCatalogProductSchema', async () => {
      const invalidNegativePrice = {
        institutionId: DEFAULT_KIOSK_INSTITUTION_ID,
        name: 'Producto Invalido',
        category: 'DRINK' as const,
        priceCents: -500, // Negative cents rejected
        stock: 10,
        isActive: true,
      };

      await expect(client.createCatalogProduct(invalidNegativePrice)).rejects.toThrow();

      const invalidEmptyName = {
        institutionId: DEFAULT_KIOSK_INSTITUTION_ID,
        name: 'A', // Too short (min 2)
        category: 'HEALTHY_SNACK' as const,
        priceCents: 10000,
        stock: 10,
        isActive: true,
      };

      await expect(client.createCatalogProduct(invalidEmptyName)).rejects.toThrow();
    });
  });

  describe('Product Update & Status Toggling', () => {
    it('should update product details and toggle active status', async () => {
      const products = await client.getCatalogProducts(DEFAULT_KIOSK_INSTITUTION_ID);
      const target = products[0]!;

      const updated = await client.updateCatalogProduct(target.id, {
        priceCents: 135000, // $1.350 ARS
        stock: 52,
        isActive: false,
      });

      expect(updated.priceCents).toBe(135000);
      expect(updated.stock).toBe(52);
      expect(updated.isActive).toBe(false);

      const fetched = await client.getCatalogProductById(target.id);
      expect(fetched?.priceCents).toBe(135000);
      expect(fetched?.isActive).toBe(false);
    });

    it('should delete a product from the catalog', async () => {
      const products = await client.getCatalogProducts(DEFAULT_KIOSK_INSTITUTION_ID);
      const toDelete = products[products.length - 1]!;

      const deleted = await client.deleteCatalogProduct(toDelete.id);
      expect(deleted).toBe(true);

      const fetched = await client.getCatalogProductById(toDelete.id);
      expect(fetched).toBeNull();
    });
  });
});
