import { describe, it, expect, beforeEach } from 'vitest';
import { ApiClient } from '../src/shared/api/api-client';
import { mockAdapter, DEFAULT_KIOSK_INSTITUTION_ID } from '../src/shared/api/mock-adapter';
import { ModerateExchangeItemDto } from '../src/shared/api/types';
import { ModerateExchangeItemSchema } from '@cambiazo/shared';

describe('School Admin Moderation Desk & Pickup Point (WAVE-3-WEB-03)', () => {
  let client: ApiClient;

  beforeEach(() => {
    mockAdapter.reset();
    client = new ApiClient(true);
  });

  describe('Items Roster & Filters', () => {
    it('should list student publications with initial seeded data', async () => {
      const items = await client.getExchangeItems();
      expect(items.length).toBeGreaterThanOrEqual(6);

      const mapedSet = items.find((i) => i.title.includes('Reglas y Compás'));
      expect(mapedSet).toBeDefined();
      expect(mapedSet?.mode).toBe('BARTER');
      expect(mapedSet?.status).toBe('PENDING');
      expect(mapedSet?.studentName).toBe('Mateo Rossi');
    });

    it('should filter items by status: PENDING, APPROVED, DELIVERED, REJECTED', async () => {
      const pendingItems = await client.getExchangeItems(undefined, 'PENDING');
      expect(pendingItems.every((i) => i.status === 'PENDING')).toBe(true);
      expect(pendingItems.length).toBeGreaterThan(0);

      const approvedItems = await client.getExchangeItems(undefined, 'APPROVED');
      expect(approvedItems.every((i) => i.status === 'APPROVED')).toBe(true);
      expect(approvedItems.length).toBeGreaterThan(0);

      const deliveredItems = await client.getExchangeItems(undefined, 'DELIVERED');
      expect(deliveredItems.every((i) => i.status === 'DELIVERED')).toBe(true);
      expect(deliveredItems.length).toBeGreaterThan(0);

      const rejectedItems = await client.getExchangeItems(undefined, 'REJECTED');
      expect(rejectedItems.every((i) => i.status === 'REJECTED')).toBe(true);
      expect(rejectedItems.length).toBeGreaterThan(0);
    });

    it('should filter items by exchange mode: BARTER, DONATION, LOAN', async () => {
      const barterItems = await client.getExchangeItems(undefined, undefined, 'BARTER');
      expect(barterItems.every((i) => i.mode === 'BARTER')).toBe(true);

      const donationItems = await client.getExchangeItems(undefined, undefined, 'DONATION');
      expect(donationItems.every((i) => i.mode === 'DONATION')).toBe(true);

      const loanItems = await client.getExchangeItems(undefined, undefined, 'LOAN');
      expect(loanItems.every((i) => i.mode === 'LOAN')).toBe(true);
    });
  });

  describe('Quick Moderation Actions with ModerateExchangeItemSchema', () => {
    it('should approve a pending publication for school community view', async () => {
      const pendingItems = await client.getExchangeItems(undefined, 'PENDING');
      const targetItem = pendingItems[0]!;

      const payload: ModerateExchangeItemDto = {
        itemId: targetItem.id,
        status: 'APPROVED',
        moderatorNotes: 'Aprobado para intercambio escolar.',
        awardedPoints: 0,
      };

      // Ensure payload conforms to shared Zod contract
      const validated = ModerateExchangeItemSchema.parse(payload);
      expect(validated.status).toBe('APPROVED');

      const updated = await client.moderateExchangeItem(payload);
      expect(updated.status).toBe('APPROVED');
      expect(updated.moderatorNotes).toBe('Aprobado para intercambio escolar.');

      // Re-fetch to confirm persistence in mock state
      const reFetched = await client.getExchangeItemById(targetItem.id);
      expect(reFetched?.status).toBe('APPROVED');
    });

    it('should reject a publication with mandatory educational reason', async () => {
      const pendingItems = await client.getExchangeItems(undefined, 'PENDING');
      const targetItem = pendingItems[1]!;

      const educationalReason =
        'El manual escolar posee páginas rasgadas. Sugerimos reparar antes de publicar.';

      const payload: ModerateExchangeItemDto = {
        itemId: targetItem.id,
        status: 'REJECTED',
        moderatorNotes: educationalReason,
        awardedPoints: 0,
      };

      ModerateExchangeItemSchema.parse(payload);

      const updated = await client.moderateExchangeItem(payload);
      expect(updated.status).toBe('REJECTED');
      expect(updated.moderatorNotes).toBe(educationalReason);

      const reFetched = await client.getExchangeItemById(targetItem.id);
      expect(reFetched?.status).toBe('REJECTED');
      expect(reFetched?.moderatorNotes).toBe(educationalReason);
    });

    it('should confirm physical delivery at pickup point (DELIVERED) and award community points', async () => {
      const approvedItems = await client.getExchangeItems(undefined, 'APPROVED');
      const targetItem = approvedItems[0]!;

      // Check student points before delivery
      const rosterBefore = await client.getStudentsRoster();
      const studentBefore = rosterBefore.find((s) => s.studentId === targetItem.studentId);
      const initialPoints = studentBefore?.communityPoints ?? 0;

      const payload: ModerateExchangeItemDto = {
        itemId: targetItem.id,
        status: 'DELIVERED',
        moderatorNotes: 'Entregado en preceptoría y verificado con el alumno receptor.',
        awardedPoints: 75,
      };

      ModerateExchangeItemSchema.parse(payload);

      const updated = await client.moderateExchangeItem(payload);
      expect(updated.status).toBe('DELIVERED');
      expect(updated.awardedPoints).toBe(75);

      // Verify student's community points were credited
      const rosterAfter = await client.getStudentsRoster();
      const studentAfter = rosterAfter.find((s) => s.studentId === targetItem.studentId);
      expect(studentAfter?.communityPoints).toBe(initialPoints + 75);
    });

    it('should reject invalid status with ModerateExchangeItemSchema (e.g. PENDING is not a moderator action)', async () => {
      const invalidPayload = {
        itemId: 'c1a2b3c4-0001-4000-8000-000000000001',
        status: 'PENDING' as any,
        awardedPoints: 0,
      };

      expect(() => ModerateExchangeItemSchema.parse(invalidPayload)).toThrow();
    });

    it('should reject negative awardedPoints with ModerateExchangeItemSchema', async () => {
      const invalidPayload = {
        itemId: 'c1a2b3c4-0001-4000-8000-000000000001',
        status: 'DELIVERED' as const,
        awardedPoints: -20,
      };

      expect(() => ModerateExchangeItemSchema.parse(invalidPayload)).toThrow();
    });
  });
});
