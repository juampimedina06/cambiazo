import { describe, it, expect, beforeEach } from 'vitest';
import { Reflector } from '@nestjs/core';
import type { ExecutionContext } from '@nestjs/common';
import { TenantGuard } from '../src/common/tenant/tenant.guard.js';
import { TenantMismatchException, UnauthorizedRoleException } from '../src/common/errors/domain.exception.js';
import { InMemoryUserRepository } from '../src/modules/identity-parental/infrastructure/persistence/in-memory-user.repository.js';
import { InMemoryParentStudentLinkRepository } from '../src/modules/identity-parental/infrastructure/persistence/in-memory-parent-student-link.repository.js';
import { InMemoryParentalConsentRepository } from '../src/modules/identity-parental/infrastructure/persistence/in-memory-parental-consent.repository.js';
import { InMemoryInstitutionRepository } from '../src/modules/tenants/infrastructure/persistence/in-memory-institution.repository.js';
import { InMemoryInvitationRepository } from '../src/modules/tenants/infrastructure/persistence/in-memory-invitation.repository.js';
import { GrantParentalConsentUseCase } from '../src/modules/identity-parental/application/use-cases/grant-parental-consent.use-case.js';
import { RevokeParentalConsentUseCase } from '../src/modules/identity-parental/application/use-cases/revoke-parental-consent.use-case.js';
import { CheckStudentConsentUseCase } from '../src/modules/identity-parental/application/use-cases/check-student-consent.use-case.js';
import { GetParentalConsentAuditUseCase } from '../src/modules/identity-parental/application/use-cases/get-parental-consent-audit.use-case.js';
import { CreateInvitationUseCase } from '../src/modules/tenants/application/use-cases/create-invitation.use-case.js';
import type { AuthUser } from '../src/common/auth/auth-user.interface.js';

describe('Multi-Tenant Data Isolation (TenantGuard & Domain Isolation)', () => {
  let reflector: Reflector;
  let tenantGuard: TenantGuard;

  const tenantA = '11111111-1111-1111-1111-111111111111';
  const tenantB = '22222222-2222-2222-2222-222222222222';

  const userSchoolA: AuthUser = {
    id: 'admin-a',
    email: 'admin@school-a.edu',
    role: 'SCHOOL_ADMIN',
    institutionId: tenantA,
    fullName: 'Admin School A',
  };

  const userParentA: AuthUser = {
    id: 'parent-a',
    email: 'parent@school-a.edu',
    role: 'PARENT',
    institutionId: tenantA,
    fullName: 'Parent School A',
  };

  const userSuperAdmin: AuthUser = {
    id: 'super-admin-global',
    email: 'super@cambiazo.internal',
    role: 'SUPER_ADMIN',
    fullName: 'Super Admin',
  };

  function mockExecutionContext(req: Record<string, unknown>): ExecutionContext {
    return {
      switchToHttp: () => ({
        getRequest: () => req,
        getResponse: () => ({}),
      }),
      getHandler: () => ({}),
      getClass: () => ({}),
    } as unknown as ExecutionContext;
  }

  beforeEach(() => {
    reflector = new Reflector();
    tenantGuard = new TenantGuard(reflector);
  });

  describe('TenantGuard HTTP Filter Checks', () => {
    it('allows user access when target institution matches user institution', () => {
      const req = {
        user: userSchoolA,
        params: { institutionId: tenantA },
        query: {},
        body: {},
        headers: {},
      };

      const context = mockExecutionContext(req);
      expect(tenantGuard.canActivate(context)).toBe(true);
      expect((req as any).tenantId).toBe(tenantA);
    });

    it('blocks access with 403 TenantMismatchException when URL param targets another institution', () => {
      const req = {
        user: userSchoolA,
        params: { institutionId: tenantB },
        query: {},
        body: {},
        headers: {},
      };

      const context = mockExecutionContext(req);
      expect(() => tenantGuard.canActivate(context)).toThrowError(
        TenantMismatchException,
      );
    });

    it('blocks access when query parameter targets another institution', () => {
      const req = {
        user: userParentA,
        params: {},
        query: { institutionId: tenantB },
        body: {},
        headers: {},
      };

      const context = mockExecutionContext(req);
      expect(() => tenantGuard.canActivate(context)).toThrowError(
        TenantMismatchException,
      );
    });

    it('blocks access when request body targets another institution', () => {
      const req = {
        user: userSchoolA,
        params: {},
        query: {},
        body: { institutionId: tenantB },
        headers: {},
      };

      const context = mockExecutionContext(req);
      expect(() => tenantGuard.canActivate(context)).toThrowError(
        TenantMismatchException,
      );
    });

    it('blocks access when x-target-institution-id header targets another institution', () => {
      const req = {
        user: userParentA,
        params: {},
        query: {},
        body: {},
        headers: { 'x-target-institution-id': tenantB },
      };

      const context = mockExecutionContext(req);
      expect(() => tenantGuard.canActivate(context)).toThrowError(
        TenantMismatchException,
      );
    });

    it('allows SUPER_ADMIN to target any institution globally', () => {
      const req = {
        user: userSuperAdmin,
        params: { institutionId: tenantB },
        query: {},
        body: {},
        headers: {},
      };

      const context = mockExecutionContext(req);
      expect(tenantGuard.canActivate(context)).toBe(true);
      expect((req as any).tenantId).toBe(tenantB);
    });

    it('rejects non-SUPER_ADMIN user without assigned institutionId', () => {
      const unassignedUser: AuthUser = {
        id: 'no-tenant-user',
        email: 'orphan@test.com',
        role: 'PARENT',
        institutionId: null,
        fullName: 'No Institution User',
      };

      const req = {
        user: unassignedUser,
        params: {},
        query: {},
        body: {},
        headers: {},
      };

      const context = mockExecutionContext(req);
      expect(() => tenantGuard.canActivate(context)).toThrowError(
        UnauthorizedRoleException,
      );
    });
  });

  describe('Domain Layer Cross-Tenant Enforcements', () => {
    let userRepo: InMemoryUserRepository;
    let linkRepo: InMemoryParentStudentLinkRepository;
    let consentRepo: InMemoryParentalConsentRepository;
    let institutionRepo: InMemoryInstitutionRepository;
    let invitationRepo: InMemoryInvitationRepository;

    let grantConsentUseCase: GrantParentalConsentUseCase;
    let revokeConsentUseCase: RevokeParentalConsentUseCase;
    let checkConsentUseCase: CheckStudentConsentUseCase;
    let getAuditUseCase: GetParentalConsentAuditUseCase;
    let createInvitationUseCase: CreateInvitationUseCase;

    const studentSchoolB = 'student-in-school-b';

    beforeEach(async () => {
      userRepo = new InMemoryUserRepository();
      linkRepo = new InMemoryParentStudentLinkRepository();
      consentRepo = new InMemoryParentalConsentRepository();
      institutionRepo = new InMemoryInstitutionRepository();
      invitationRepo = new InMemoryInvitationRepository();

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
      createInvitationUseCase = new CreateInvitationUseCase(
        institutionRepo,
        invitationRepo,
      );

      // Seed student belonging to Tenant B
      await userRepo.create({
        id: studentSchoolB,
        institutionId: tenantB,
        role: 'STUDENT',
        email: 'student@school-b.edu',
        passwordHash: 'hash',
        fullName: 'Student School B',
        isActive: true,
        createdAt: new Date(),
      });
    });

    it('rejects consent grant attempt from Parent in School A for Student in School B', async () => {
      await expect(
        grantConsentUseCase.execute(
          userParentA,
          {
            studentId: studentSchoolB,
            acceptedTermsVersion: 'v1.0.0',
            acceptedAt: new Date().toISOString(),
            signatureIp: '127.0.0.1',
          },
        ),
      ).rejects.toThrowError(TenantMismatchException);
    });

    it('rejects consent revocation from Parent in School A for Student in School B', async () => {
      await expect(
        revokeConsentUseCase.execute(
          userParentA,
          {
            studentId: studentSchoolB,
            reason: 'Malicious revocation attempt',
          },
        ),
      ).rejects.toThrowError(TenantMismatchException);
    });

    it('rejects audit trail inspection from School A Admin for Student in School B', async () => {
      await expect(
        getAuditUseCase.execute(studentSchoolB, userSchoolA),
      ).rejects.toThrowError(TenantMismatchException);
    });

    it('rejects student status query when tenant context mismatches student institution', async () => {
      await expect(
        checkConsentUseCase.execute(studentSchoolB, tenantA),
      ).rejects.toThrowError(TenantMismatchException);
    });

    it('rejects School Admin creating invitations targeting another school', async () => {
      await expect(
        createInvitationUseCase.execute(
          {
            institutionId: tenantB,
            code: 'INV-ATTACK',
          },
          userSchoolA,
        ),
      ).rejects.toThrowError(TenantMismatchException);
    });
  });
});
