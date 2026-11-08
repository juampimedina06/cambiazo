import { describe, it, expect, beforeEach } from 'vitest';
import { ApiClient } from '../src/shared/api/api-client';
import { mockAdapter } from '../src/shared/api/mock-adapter';
import { CreateInstitutionInput, CreateInvitationInput } from '../src/shared/api/types';

describe('ApiClient & Typed Mock Adapter (WAVE-1-WEB-01)', () => {
  let client: ApiClient;

  beforeEach(() => {
    mockAdapter.reset();
    client = new ApiClient(true); // force mock adapter
  });

  describe('Super Admin: Institutions Management', () => {
    it('should list seeded educational institutions', async () => {
      const institutions = await client.getInstitutions();
      expect(institutions.length).toBeGreaterThanOrEqual(3);

      const belgrano = institutions.find(
        (i) => i.name === 'Colegio Belgrano Day School'
      );
      expect(belgrano).toBeDefined();
      expect(belgrano?.status).toBe('ACTIVE');
      expect(belgrano?.billingPlanType).toBe('FIXED_MONTHLY');
      expect(belgrano?.activeStudentsCount).toBe(420);
    });

    it('should create a new institution with validated Argentine CUIT and plan', async () => {
      const newSchoolPayload: CreateInstitutionInput = {
        name: 'Instituto Manuel Belgrano',
        cuit: '30-99887766-5',
        address: 'Juramento 2100, CABA',
        billingPlanType: 'PER_ACTIVE_STUDENT',
        monthlyFeeCents: 18000,
        schoolAdminEmail: 'directorio@manuelbelgrano.edu.ar',
        kioskEmail: 'kiosco@manuelbelgrano.edu.ar',
      };

      const created = await client.createInstitution(newSchoolPayload);
      expect(created.id).toBeDefined();
      expect(created.name).toBe('Instituto Manuel Belgrano');
      expect(created.status).toBe('ACTIVE');
      expect(created.activeStudentsCount).toBe(0);

      // Verify it appears in the list
      const institutions = await client.getInstitutions();
      const found = institutions.find((i) => i.id === created.id);
      expect(found).toBeDefined();
      expect(found?.cuit).toBe('30-99887766-5');
    });

    it('should reject invalid CUIT format with Zod validation error', async () => {
      const invalidPayload = {
        name: 'Escuela Invalida',
        cuit: 'invalid-cuit-format',
        address: 'Calle Falsa 123',
        billingPlanType: 'FIXED_MONTHLY' as const,
        monthlyFeeCents: 50000,
        schoolAdminEmail: 'admin@escuela.edu.ar',
        kioskEmail: 'kiosk@escuela.edu.ar',
      };

      await expect(client.createInstitution(invalidPayload)).rejects.toThrow();
    });

    it('should toggle institution status between ACTIVE and SUSPENDED', async () => {
      const institutions = await client.getInstitutions();
      const first = institutions[0]!;
      expect(first.status).toBe('ACTIVE');

      const updated = await client.updateInstitutionStatus(first.id, 'SUSPENDED');
      expect(updated.status).toBe('SUSPENDED');

      // Check re-fetch
      const refreshed = await client.getInstitutionById(first.id);
      expect(refreshed?.status).toBe('SUSPENDED');
    });
  });

  describe('School Admin: Invitations Generator', () => {
    it('should generate a custom invitation code with expiration and limits', async () => {
      const payload: CreateInvitationInput = {
        institutionId: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
        code: 'BELGRANO-PRIMARIA-2026',
        maxUses: 250,
        expiresAt: '2026-11-30T23:59:59.000Z',
      };

      const created = await client.createInvitation(payload);
      expect(created.code).toBe('BELGRANO-PRIMARIA-2026');
      expect(created.maxUses).toBe(250);
      expect(created.currentUses).toBe(0);
      expect(created.isActive).toBe(true);

      const list = await client.getInvitations(payload.institutionId);
      expect(list.some((inv) => inv.code === 'BELGRANO-PRIMARIA-2026')).toBe(true);
    });

    it('should autogenerate a code if not specified', async () => {
      const payload: CreateInvitationInput = {
        institutionId: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
        maxUses: 100,
      };

      const created = await client.createInvitation(payload);
      expect(created.code).toMatch(/^CAMBIAZO-[A-Z0-9]+$/);
    });
  });

  describe('School Admin: Students Roster & Parental Consent (Ley 25.326)', () => {
    it('should list students and audit trails of parental consent', async () => {
      const roster = await client.getStudentsRoster();
      expect(roster.length).toBeGreaterThan(0);

      const mateo = roster.find((s) => s.studentName === 'Mateo Rossi');
      expect(mateo).toBeDefined();
      expect(mateo?.consentStatus).toBe('GRANTED');
      expect(mateo?.consentAudit.acceptedTermsVersion).toBe('v1.2-2026');
      expect(mateo?.consentAudit.signatureIp).toBeDefined();
    });

    it('should allow revoking parental consent with mandatory reason', async () => {
      const roster = await client.getStudentsRoster();
      const grantedStudent = roster.find((s) => s.consentStatus === 'GRANTED')!;

      const updated = await client.updateStudentConsent(
        grantedStudent.studentId,
        'REVOKED',
        'Baja formal solicitada por la madre.'
      );

      expect(updated.consentStatus).toBe('REVOKED');
      expect(updated.consentAudit.revocationReason).toBe(
        'Baja formal solicitada por la madre.'
      );
      expect(updated.consentAudit.revokedAt).toBeDefined();
    });

    it('should allow granting parental consent with audit timestamp', async () => {
      const roster = await client.getStudentsRoster();
      const pendingStudent = roster.find((s) => s.consentStatus === 'PENDING')!;

      const updated = await client.updateStudentConsent(
        pendingStudent.studentId,
        'GRANTED'
      );

      expect(updated.consentStatus).toBe('GRANTED');
      expect(updated.consentAudit.acceptedTermsVersion).toBe('v1.2-2026');
      expect(updated.consentAudit.signedAt).toBeDefined();
    });
  });
});
