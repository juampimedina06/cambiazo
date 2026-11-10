import { describe, it, expect } from 'vitest';
import {
  CreateInstitutionSchema,
  InstitutionDtoSchema,
  CreateInvitationSchema,
  ValidateInviteCodeSchema,
} from '../src/schemas/institution.schema';

describe('Institution Schemas Validation', () => {
  const validInstitution = {
    name: 'Colegio San Martin',
    cuit: '30-11223344-5',
    address: 'Av. Libertador 1234, CABA',
    billingPlanType: 'FIXED_MONTHLY',
    monthlyFeeCents: 4500000,
    schoolAdminEmail: 'admin@colegiosanmartin.edu.ar',
    kioskEmail: 'kiosco@colegiosanmartin.edu.ar',
  };

  describe('CreateInstitutionSchema', () => {
    it('parses valid institution creation payload', () => {
      const parsed = CreateInstitutionSchema.parse(validInstitution);
      expect(parsed.name).toBe('Colegio San Martin');
      expect(parsed.monthlyFeeCents).toBe(4500000);
    });

    it('rejects invalid CUIT format', () => {
      expect(() =>
        CreateInstitutionSchema.parse({
          ...validInstitution,
          cuit: '12345',
        }),
      ).toThrow(/Invalid Argentine CUIT format/);
    });

    it('rejects non-positive monthlyFeeCents', () => {
      expect(() =>
        CreateInstitutionSchema.parse({
          ...validInstitution,
          monthlyFeeCents: 0,
        }),
      ).toThrow();

      expect(() =>
        CreateInstitutionSchema.parse({
          ...validInstitution,
          monthlyFeeCents: -500,
        }),
      ).toThrow();
    });

    it('rejects invalid emails', () => {
      expect(() =>
        CreateInstitutionSchema.parse({
          ...validInstitution,
          schoolAdminEmail: 'not-an-email',
        }),
      ).toThrow();
    });
  });

  describe('InstitutionDtoSchema', () => {
    const validDto = {
      id: 'a81bc81b-dead-4e5d-abff-90865d1e13b1',
      name: 'Colegio San Martin',
      cuit: '30-11223344-5',
      address: 'Av. Libertador 1234, CABA',
      billingPlanType: 'PER_ACTIVE_STUDENT',
      monthlyFeeCents: 15000,
      status: 'ACTIVE',
      activeStudentsCount: 350,
      createdAt: new Date().toISOString(),
    };

    it('parses valid institution DTO', () => {
      const parsed = InstitutionDtoSchema.parse(validDto);
      expect(parsed.id).toBe(validDto.id);
      expect(parsed.activeStudentsCount).toBe(350);
    });

    it('rejects non-uuid id', () => {
      expect(() =>
        InstitutionDtoSchema.parse({
          ...validDto,
          id: 'invalid-uuid-123',
        }),
      ).toThrow();
    });

    it('rejects negative active students count', () => {
      expect(() =>
        InstitutionDtoSchema.parse({
          ...validDto,
          activeStudentsCount: -1,
        }),
      ).toThrow();
    });
  });

  describe('CreateInvitationSchema & ValidateInviteCodeSchema', () => {
    it('parses valid invitation payload', () => {
      const parsed = CreateInvitationSchema.parse({
        institutionId: 'a81bc81b-dead-4e5d-abff-90865d1e13b1',
        code: 'SAN-MARTIN-2026',
        maxUses: 200,
      });
      expect(parsed.code).toBe('SAN-MARTIN-2026');
      expect(parsed.maxUses).toBe(200);
    });

    it('rejects invalid code format', () => {
      expect(() =>
        CreateInvitationSchema.parse({
          institutionId: 'a81bc81b-dead-4e5d-abff-90865d1e13b1',
          code: 'inv@lid!',
        }),
      ).toThrow();
    });

    it('validates invite code input properly', () => {
      expect(ValidateInviteCodeSchema.parse({ code: 'CODE123' })).toEqual({
        code: 'CODE123',
      });
      expect(() => ValidateInviteCodeSchema.parse({ code: 'AB' })).toThrow();
    });
  });
});
