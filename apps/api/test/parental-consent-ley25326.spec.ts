import { describe, it, expect, beforeEach } from 'vitest';
import { InMemoryUserRepository } from '../src/modules/identity-parental/infrastructure/persistence/in-memory-user.repository.js';
import { InMemoryParentStudentLinkRepository } from '../src/modules/identity-parental/infrastructure/persistence/in-memory-parent-student-link.repository.js';
import { InMemoryParentalConsentRepository } from '../src/modules/identity-parental/infrastructure/persistence/in-memory-parental-consent.repository.js';
import { GrantParentalConsentUseCase } from '../src/modules/identity-parental/application/use-cases/grant-parental-consent.use-case.js';
import { RevokeParentalConsentUseCase } from '../src/modules/identity-parental/application/use-cases/revoke-parental-consent.use-case.js';
import { CheckStudentConsentUseCase } from '../src/modules/identity-parental/application/use-cases/check-student-consent.use-case.js';
import { GetParentalConsentAuditUseCase } from '../src/modules/identity-parental/application/use-cases/get-parental-consent-audit.use-case.js';
import {
  ParentalConsentRequiredException,
  ParentalConsentRevokedException,
  ImmutableRecordViolationException,
  TenantMismatchException,
} from '../src/common/errors/domain.exception.js';
import { DOMAIN_ERROR_CODES } from '@cambiazo/shared';
import type { AuthUser } from '../src/common/auth/auth-user.interface.js';

describe('Ley 25.326 Parental Consent Audit & Enforcement', () => {
  let userRepo: InMemoryUserRepository;
  let linkRepo: InMemoryParentStudentLinkRepository;
  let consentRepo: InMemoryParentalConsentRepository;

  let grantConsentUseCase: GrantParentalConsentUseCase;
  let revokeConsentUseCase: RevokeParentalConsentUseCase;
  let checkConsentUseCase: CheckStudentConsentUseCase;
  let getAuditUseCase: GetParentalConsentAuditUseCase;

  const institutionId = '11111111-1111-1111-1111-111111111111';
  const parentId = 'parent-user-1';
  const studentId = 'student-user-1';

  const parentUser: AuthUser = {
    id: parentId,
    email: 'padre@familia.com',
    role: 'PARENT',
    institutionId,
    fullName: 'Carlos Gomez',
  };

  beforeEach(async () => {
    userRepo = new InMemoryUserRepository();
    linkRepo = new InMemoryParentStudentLinkRepository();
    consentRepo = new InMemoryParentalConsentRepository();

    grantConsentUseCase = new GrantParentalConsentUseCase(
      userRepo,
      linkRepo,
      consentRepo,
    );
    revokeConsentUseCase = new RevokeParentalConsentUseCase(
      userRepo,
      linkRepo,
      consentRepo,
    );
    checkConsentUseCase = new CheckStudentConsentUseCase(
      userRepo,
      consentRepo,
    );
    getAuditUseCase = new GetParentalConsentAuditUseCase(
      userRepo,
      linkRepo,
      consentRepo,
    );

    // Seed Parent and Student
    await userRepo.create({
      id: parentId,
      institutionId,
      role: 'PARENT',
      email: 'padre@familia.com',
      passwordHash: 'hash',
      fullName: 'Carlos Gomez',
      isActive: true,
      createdAt: new Date(),
    });

    await userRepo.create({
      id: studentId,
      institutionId,
      role: 'STUDENT',
      email: 'mateo@estudiante.com',
      passwordHash: 'hash',
      fullName: 'Mateo Gomez',
      isActive: false, // Initially inactive
      createdAt: new Date(),
    });

    // Link Parent to Student
    await linkRepo.create({
      id: 'link-1',
      institutionId,
      parentUserId: parentId,
      studentUserId: studentId,
      createdAt: new Date(),
    });
  });

  describe('Immutable Audit Trail (Ley 25.326)', () => {
    it('enforces append-only storage and rejects update or delete operations', async () => {
      await expect(consentRepo.update()).rejects.toThrowError(
        ImmutableRecordViolationException,
      );
      await expect(consentRepo.delete()).rejects.toThrowError(
        ImmutableRecordViolationException,
      );
    });
  });

  describe('Pre-Consent Enforcement', () => {
    it('blocks minor operations when no consent has been granted yet', async () => {
      await expect(
        checkConsentUseCase.execute(studentId, institutionId),
      ).rejects.toThrowError(ParentalConsentRequiredException);
    });
  });

  describe('Granting Consent', () => {
    it('grants explicit consent, activates student, and records immutable audit entry', async () => {
      const grantResult = await grantConsentUseCase.execute(
        parentUser,
        {
          studentId,
          acceptedTermsVersion: 'v1.0.0-2026',
          acceptedAt: new Date().toISOString(),
          signatureIp: '190.220.10.5',
        },
        '190.220.10.5',
        'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0)',
      );

      expect(grantResult.success).toBe(true);
      expect(grantResult.status).toBe('GRANTED');
      expect(grantResult.consentId).toBeDefined();

      // Verify student is now active
      const studentInDb = await userRepo.findById(studentId);
      expect(studentInDb?.isActive).toBe(true);

      // Verify operational status check passes
      const statusCheck = await checkConsentUseCase.execute(
        studentId,
        institutionId,
      );
      expect(statusCheck.canOperate).toBe(true);
      expect(statusCheck.consentStatus).toBe('GRANTED');
      expect(statusCheck.consentId).toBe(grantResult.consentId);

      // Verify audit trail contains the grant record
      const audit = await getAuditUseCase.execute(studentId, parentUser);
      expect(audit).toHaveLength(1);
      expect(audit[0]?.action).toBe('GRANTED');
      expect(audit[0]?.ipAddress).toBe('190.220.10.5');
      expect(audit[0]?.termsVersion).toBe('v1.0.0-2026');
    });

    it('rejects consent grant from an unrelated parent', async () => {
      const unrelatedParent: AuthUser = {
        id: 'other-parent-2',
        email: 'other@familia.com',
        role: 'PARENT',
        institutionId,
        fullName: 'Other Parent',
      };

      await expect(
        grantConsentUseCase.execute(
          unrelatedParent,
          {
            studentId,
            acceptedTermsVersion: 'v1.0.0',
            acceptedAt: new Date().toISOString(),
            signatureIp: '127.0.0.1',
          },
        ),
      ).rejects.toThrowError(
        expect.objectContaining({
          code: DOMAIN_ERROR_CODES.STUDENT_NOT_LINKED_TO_PARENT,
        }),
      );
    });
  });

  describe('Revoking Consent', () => {
    it('immediately suspends student operations upon parental revocation', async () => {
      // 1. Grant consent first
      await grantConsentUseCase.execute(
        parentUser,
        {
          studentId,
          acceptedTermsVersion: 'v1.0.0',
          acceptedAt: new Date().toISOString(),
          signatureIp: '190.220.10.5',
        },
        '190.220.10.5',
        'Mobile Safari',
      );

      // Operational check passes
      const preRevoke = await checkConsentUseCase.execute(
        studentId,
        institutionId,
      );
      expect(preRevoke.canOperate).toBe(true);

      // 2. Revoke consent
      const revokeResult = await revokeConsentUseCase.execute(
        parentUser,
        {
          studentId,
          reason: 'Parent requested immediate pause due to lost device',
        },
        '190.220.10.5',
        'Mobile Safari',
      );

      expect(revokeResult.success).toBe(true);
      expect(revokeResult.status).toBe('REVOKED');
      expect(revokeResult.reason).toContain('lost device');

      // 3. Student user isActive must be false immediately
      const studentInDb = await userRepo.findById(studentId);
      expect(studentInDb?.isActive).toBe(false);

      // 4. Minor operations must be immediately blocked
      await expect(
        checkConsentUseCase.execute(studentId, institutionId),
      ).rejects.toThrowError(ParentalConsentRevokedException);

      // 5. Audit trail records both GRANTED and REVOKED events in chronological order
      const audit = await getAuditUseCase.execute(studentId, parentUser);
      expect(audit).toHaveLength(2);
      expect(audit[0]?.action).toBe('GRANTED');
      expect(audit[1]?.action).toBe('REVOKED');
      expect(audit[1]?.reason).toBe(
        'Parent requested immediate pause due to lost device',
      );
    });
  });
});
