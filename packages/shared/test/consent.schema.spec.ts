import { describe, it, expect } from 'vitest';
import {
  RegisterParentAndStudentSchema,
  GrantParentalConsentSchema,
  RevokeParentalConsentSchema,
  SpendingLimitsSchema,
} from '../src/schemas/consent.schema.js';

describe('Consent & Parental Controls Schemas Validation', () => {
  describe('RegisterParentAndStudentSchema', () => {
    const validRegistration = {
      inviteCode: 'SAN-MARTIN-2026',
      parent: {
        fullName: 'Carlos Rodriguez',
        email: 'carlos@ejemplo.com',
        password: 'SecurePassword123!',
        phone: '+5491122334455',
        dni: '32111222',
      },
      student: {
        fullName: 'Mateo Rodriguez',
        dni: '52111222',
        grade: '5to Grado A',
        dateOfBirth: '2014-06-15',
      },
    };

    it('parses valid registration payload', () => {
      const parsed = RegisterParentAndStudentSchema.parse(validRegistration);
      expect(parsed.inviteCode).toBe('SAN-MARTIN-2026');
      expect(parsed.parent.fullName).toBe('Carlos Rodriguez');
      expect(parsed.student.fullName).toBe('Mateo Rodriguez');
    });

    it('rejects short password (< 8 chars)', () => {
      expect(() =>
        RegisterParentAndStudentSchema.parse({
          ...validRegistration,
          parent: {
            ...validRegistration.parent,
            password: 'short',
          },
        }),
      ).toThrow();
    });

    it('rejects invalid student dateOfBirth format', () => {
      expect(() =>
        RegisterParentAndStudentSchema.parse({
          ...validRegistration,
          student: {
            ...validRegistration.student,
            dateOfBirth: '15/06/2014',
          },
        }),
      ).toThrow(/Date of birth must be in YYYY-MM-DD format/);
    });
  });

  describe('GrantParentalConsentSchema', () => {
    const validConsent = {
      studentId: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
      acceptedTermsVersion: 'v1.0.0',
      acceptedAt: '2026-11-08T12:00:00.000Z',
      signatureIp: '190.191.192.193',
    };

    it('parses valid consent payload with IPv4', () => {
      const parsed = GrantParentalConsentSchema.parse(validConsent);
      expect(parsed.acceptedTermsVersion).toBe('v1.0.0');
      expect(parsed.signatureIp).toBe('190.191.192.193');
    });

    it('parses valid consent payload with IPv6', () => {
      const parsed = GrantParentalConsentSchema.parse({
        ...validConsent,
        signatureIp: '2001:0db8:85a3:0000:0000:8a2e:0370:7334',
      });
      expect(parsed.signatureIp).toBe('2001:0db8:85a3:0000:0000:8a2e:0370:7334');
    });

    it('rejects invalid IP address', () => {
      expect(() =>
        GrantParentalConsentSchema.parse({
          ...validConsent,
          signatureIp: '999.999.999.999',
        }),
      ).toThrow(/Valid IPv4 or IPv6 required/);
    });

    it('rejects invalid datetime', () => {
      expect(() =>
        GrantParentalConsentSchema.parse({
          ...validConsent,
          acceptedAt: 'not-a-datetime',
        }),
      ).toThrow();
    });
  });

  describe('RevokeParentalConsentSchema', () => {
    it('parses valid revocation request', () => {
      const parsed = RevokeParentalConsentSchema.parse({
        studentId: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
        reason: 'Temporary suspension requested by parent',
      });
      expect(parsed.reason).toBe('Temporary suspension requested by parent');
    });

    it('rejects short reason (< 3 chars)', () => {
      expect(() =>
        RevokeParentalConsentSchema.parse({
          studentId: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
          reason: 'no',
        }),
      ).toThrow();
    });
  });

  describe('SpendingLimitsSchema', () => {
    const validLimits = {
      studentId: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
      dailyLimitCents: 150000,
      weeklyLimitCents: 600000,
      blockedCategories: ['CANDY', 'DRINK'],
      isPaused: false,
    };

    it('parses valid limits configuration', () => {
      const parsed = SpendingLimitsSchema.parse(validLimits);
      expect(parsed.dailyLimitCents).toBe(150000);
      expect(parsed.blockedCategories).toEqual(['CANDY', 'DRINK']);
      expect(parsed.isPaused).toBe(false);
    });

    it('rejects negative daily limit', () => {
      expect(() =>
        SpendingLimitsSchema.parse({
          ...validLimits,
          dailyLimitCents: -100,
        }),
      ).toThrow();
    });

    it('rejects invalid product category in blocked list', () => {
      expect(() =>
        SpendingLimitsSchema.parse({
          ...validLimits,
          blockedCategories: ['INVALID_CATEGORY'],
        }),
      ).toThrow();
    });
  });
});
