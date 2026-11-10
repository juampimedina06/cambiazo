import { describe, it, expect } from 'vitest';
import {
  UserRoleSchema,
  BillingPlanTypeSchema,
  InstitutionStatusSchema,
  ConsentStatusSchema,
  AccountTypeSchema,
  LedgerEntryDirectionSchema,
  ProductCategorySchema,
  ExchangeModeSchema,
  ModerationStatusSchema,
} from '../src/enums';

describe('Domain Enums Validation', () => {
  describe('UserRoleSchema', () => {
    it('accepts all valid user roles', () => {
      const valid = ['SUPER_ADMIN', 'SCHOOL_ADMIN', 'KIOSK', 'PARENT', 'STUDENT'];
      for (const role of valid) {
        expect(UserRoleSchema.parse(role)).toBe(role);
      }
    });

    it('rejects invalid roles', () => {
      expect(() => UserRoleSchema.parse('TEACHER')).toThrow();
      expect(() => UserRoleSchema.parse('')).toThrow();
      expect(() => UserRoleSchema.parse(123)).toThrow();
    });
  });

  describe('BillingPlanTypeSchema', () => {
    it('accepts FIXED_MONTHLY and PER_ACTIVE_STUDENT', () => {
      expect(BillingPlanTypeSchema.parse('FIXED_MONTHLY')).toBe('FIXED_MONTHLY');
      expect(BillingPlanTypeSchema.parse('PER_ACTIVE_STUDENT')).toBe('PER_ACTIVE_STUDENT');
    });

    it('rejects unknown billing plan', () => {
      expect(() => BillingPlanTypeSchema.parse('ANNUAL')).toThrow();
    });
  });

  describe('InstitutionStatusSchema', () => {
    it('accepts ACTIVE and SUSPENDED', () => {
      expect(InstitutionStatusSchema.parse('ACTIVE')).toBe('ACTIVE');
      expect(InstitutionStatusSchema.parse('SUSPENDED')).toBe('SUSPENDED');
    });

    it('rejects invalid statuses', () => {
      expect(() => InstitutionStatusSchema.parse('DELETED')).toThrow();
    });
  });

  describe('ConsentStatusSchema', () => {
    it('accepts PENDING, GRANTED, REVOKED', () => {
      expect(ConsentStatusSchema.parse('PENDING')).toBe('PENDING');
      expect(ConsentStatusSchema.parse('GRANTED')).toBe('GRANTED');
      expect(ConsentStatusSchema.parse('REVOKED')).toBe('REVOKED');
    });

    it('rejects invalid consent statuses', () => {
      expect(() => ConsentStatusSchema.parse('WAITING')).toThrow();
    });
  });

  describe('AccountTypeSchema', () => {
    it('accepts PARENT_WALLET, STUDENT_ALLOCATION, KIOSK_BALANCE, PLATFORM_CLEARING', () => {
      const valid = [
        'PARENT_WALLET',
        'STUDENT_ALLOCATION',
        'KIOSK_BALANCE',
        'PLATFORM_CLEARING',
      ];
      for (const type of valid) {
        expect(AccountTypeSchema.parse(type)).toBe(type);
      }
    });

    it('rejects invalid account types', () => {
      expect(() => AccountTypeSchema.parse('CRYPTO_WALLET')).toThrow();
    });
  });

  describe('LedgerEntryDirectionSchema', () => {
    it('accepts DEBIT and CREDIT', () => {
      expect(LedgerEntryDirectionSchema.parse('DEBIT')).toBe('DEBIT');
      expect(LedgerEntryDirectionSchema.parse('CREDIT')).toBe('CREDIT');
    });

    it('rejects invalid directions', () => {
      expect(() => LedgerEntryDirectionSchema.parse('TRANSFER')).toThrow();
    });
  });

  describe('ProductCategorySchema', () => {
    it('accepts all 5 approved categories', () => {
      const valid = ['HEALTHY_SNACK', 'DRINK', 'CANDY', 'HOT_MEAL', 'STATIONERY'];
      for (const cat of valid) {
        expect(ProductCategorySchema.parse(cat)).toBe(cat);
      }
    });

    it('rejects unapproved category', () => {
      expect(() => ProductCategorySchema.parse('TOY')).toThrow();
    });
  });

  describe('ExchangeModeSchema', () => {
    it('accepts BARTER, DONATION, LOAN', () => {
      expect(ExchangeModeSchema.parse('BARTER')).toBe('BARTER');
      expect(ExchangeModeSchema.parse('DONATION')).toBe('DONATION');
      expect(ExchangeModeSchema.parse('LOAN')).toBe('LOAN');
    });

    it('rejects monetary sale mode', () => {
      expect(() => ExchangeModeSchema.parse('SALE')).toThrow();
    });
  });

  describe('ModerationStatusSchema', () => {
    it('accepts PENDING, APPROVED, REJECTED, DELIVERED', () => {
      const valid = ['PENDING', 'APPROVED', 'REJECTED', 'DELIVERED'];
      for (const status of valid) {
        expect(ModerationStatusSchema.parse(status)).toBe(status);
      }
    });

    it('rejects invalid moderation status', () => {
      expect(() => ModerationStatusSchema.parse('ARCHIVED')).toThrow();
    });
  });
});
