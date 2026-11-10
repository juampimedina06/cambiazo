import { describe, it, expect, beforeEach } from 'vitest';
import { CreateExchangeItemSchema } from '@cambiazo/shared';
import { mockApiClient } from '../src/shared/api/mock-client';

describe('Student Community Exchange Feed & Publish Form (WAVE-3-MOBILE-03)', () => {
  const institutionId = 'e28bb18a-66fe-4f8e-9092-2df283f55001'; // Colegio Manuel Belgrano
  const studentId = '22222222-2222-4222-8222-222222222222';

  beforeEach(() => {
    mockApiClient.resetToDefault();
  });

  it('retrieves only approved items for student school institution', () => {
    const items = mockApiClient.getExchangeItems(institutionId);
    expect(items.length).toBeGreaterThanOrEqual(4);

    // Every item in feed must belong to this institution and be APPROVED
    items.forEach((item) => {
      expect(item.institutionId).toBe(institutionId);
      expect(item.status).toBe('APPROVED');
      expect(item.pickupLocation).toContain('Punto de Entrega Escolar Moderado');
    });
  });

  it('filters exchange items by mode (BARTER, DONATION, LOAN)', () => {
    const all = mockApiClient.getExchangeItems(institutionId);
    const barterOnly = mockApiClient.getExchangeItems(institutionId, 'BARTER');
    const donationOnly = mockApiClient.getExchangeItems(institutionId, 'DONATION');
    const loanOnly = mockApiClient.getExchangeItems(institutionId, 'LOAN');

    expect(all.length).toBe(barterOnly.length + donationOnly.length + loanOnly.length);

    barterOnly.forEach((item) => expect(item.mode).toBe('BARTER'));
    donationOnly.forEach((item) => expect(item.mode).toBe('DONATION'));
    loanOnly.forEach((item) => expect(item.mode).toBe('LOAN'));
  });

  it('isolates feed per school institution', () => {
    const belgranoItems = mockApiClient.getExchangeItems(institutionId);
    expect(belgranoItems.length).toBeGreaterThan(0);

    // Another institution has no approved items by default
    const otherInstitutionItems = mockApiClient.getExchangeItems('f39cc29b-77fa-5a9f-8183-3ef394f66002');
    expect(otherInstitutionItems.length).toBe(0);
  });

  it('validates publication payload with CreateExchangeItemSchema', () => {
    const valid = {
      title: 'Manual de Historia Argentina 6° Grado',
      description: 'Libro en perfecto estado, forrado, sin escrituras en lapicera.',
      category: 'Libros',
      mode: 'DONATION' as const,
      photoUrls: ['https://ejemplo.com/libro.jpg'],
    };
    expect(CreateExchangeItemSchema.safeParse(valid).success).toBe(true);

    const invalidShortTitle = {
      ...valid,
      title: 'A',
    };
    expect(CreateExchangeItemSchema.safeParse(invalidShortTitle).success).toBe(false);

    const invalidShortDesc = {
      ...valid,
      description: 'Hola',
    };
    expect(CreateExchangeItemSchema.safeParse(invalidShortDesc).success).toBe(false);

    const invalidMode = {
      ...valid,
      mode: 'SALE', // Not allowed (only BARTER, DONATION, LOAN)
    };
    expect(CreateExchangeItemSchema.safeParse(invalidMode).success).toBe(false);
  });

  it('creates exchange item in PENDING status awaiting school moderator approval', async () => {
    const createRes = await mockApiClient.createExchangeItem(studentId, institutionId, {
      title: 'Compás Metálico Escolar',
      description: 'Compás de precisión con repuestos de minas y tornillo de ajuste.',
      category: 'Útiles',
      mode: 'DONATION',
      photoUrls: ['https://images.unsplash.com/photo-1583485088034-697b5bc54ccd?w=400'],
    });

    expect(createRes.success).toBe(true);
    expect(createRes.item).toBeDefined();
    expect(createRes.item?.status).toBe('PENDING'); // Crucial: PENDING until moderated
    expect(createRes.item?.pickupLocation).toContain('Punto de Entrega Escolar Moderado');

    // Pending item is NOT visible in the public student feed yet
    const feed = mockApiClient.getExchangeItems(institutionId);
    const inFeed = feed.some((i) => i.id === createRes.item?.id);
    expect(inFeed).toBe(false);
  });
});
