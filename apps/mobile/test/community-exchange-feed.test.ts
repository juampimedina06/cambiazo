import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { CreateExchangeItemSchema } from '@cambiazo/shared';
import {
  createExchangeItemAction,
  fetchExchangeItemsAction,
} from '../src/core';
import {
  installTestBackend,
  TEST_INSTITUTION_ID,
  TEST_OTHER_INSTITUTION_ID,
  TEST_STUDENT_ID,
} from './helpers/test-backend';

describe('Student Community Exchange Feed & Publish Form (WAVE-3-MOBILE-03)', () => {
  const institutionId = TEST_INSTITUTION_ID;
  const studentId = TEST_STUDENT_ID;
  let restoreFetch: (() => void) | null = null;

  beforeEach(() => {
    restoreFetch = installTestBackend().restore;
  });

  afterEach(() => {
    restoreFetch?.();
  });

  it('retrieves only approved items for student school institution', async () => {
    const items = await fetchExchangeItemsAction(institutionId);
    expect(items.length).toBeGreaterThanOrEqual(4);

    items.forEach((item) => {
      expect(item.institutionId).toBe(institutionId);
      expect(item.status).toBe('APPROVED');
      expect(item.pickupLocation).toContain('Punto de Entrega Escolar Moderado');
    });
  });

  it('filters exchange items by mode (BARTER, DONATION, LOAN)', async () => {
    const all = await fetchExchangeItemsAction(institutionId);
    const barterOnly = await fetchExchangeItemsAction(institutionId, 'BARTER');
    const donationOnly = await fetchExchangeItemsAction(institutionId, 'DONATION');
    const loanOnly = await fetchExchangeItemsAction(institutionId, 'LOAN');

    expect(all.length).toBe(
      barterOnly.length + donationOnly.length + loanOnly.length
    );

    barterOnly.forEach((item) => expect(item.mode).toBe('BARTER'));
    donationOnly.forEach((item) => expect(item.mode).toBe('DONATION'));
    loanOnly.forEach((item) => expect(item.mode).toBe('LOAN'));
  });

  it('isolates feed per school institution', async () => {
    const belgranoItems = await fetchExchangeItemsAction(institutionId);
    expect(belgranoItems.length).toBeGreaterThan(0);

    const otherInstitutionItems = await fetchExchangeItemsAction(
      TEST_OTHER_INSTITUTION_ID
    );
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

    expect(
      CreateExchangeItemSchema.safeParse({ ...valid, title: 'A' }).success
    ).toBe(false);
    expect(
      CreateExchangeItemSchema.safeParse({ ...valid, description: 'Hola' }).success
    ).toBe(false);
    expect(
      CreateExchangeItemSchema.safeParse({ ...valid, mode: 'SALE' }).success
    ).toBe(false);
  });

  it('creates exchange item in PENDING status awaiting school moderator approval', async () => {
    const createRes = await createExchangeItemAction(studentId, institutionId, {
      title: 'Compás Metálico Escolar',
      description: 'Compás de precisión con repuestos de minas y tornillo de ajuste.',
      category: 'Útiles',
      mode: 'DONATION',
      photoUrls: ['https://images.unsplash.com/photo-1583485088034-697b5bc54ccd?w=400'],
    });

    expect(createRes.success).toBe(true);
    expect(createRes.item).toBeDefined();
    expect(createRes.item?.status).toBe('PENDING');
    expect(createRes.item?.pickupLocation).toContain('Punto de Entrega Escolar Moderado');

    const feed = await fetchExchangeItemsAction(institutionId);
    const inFeed = feed.some((i) => i.id === createRes.item?.id);
    expect(inFeed).toBe(false);
  });
});
