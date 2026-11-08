import { describe, it, expect, beforeEach } from 'vitest';
import { BadRequestException } from '@nestjs/common';
import {
  CreateInstitutionSchema,
  RegisterParentAndStudentSchema,
  GrantParentalConsentSchema,
  RevokeParentalConsentSchema,
} from '@cambiazo/shared';
import { ZodValidationPipe } from '../src/common/pipes/zod-validation.pipe.js';
import { InMemoryUserRepository } from '../src/modules/identity-parental/infrastructure/persistence/in-memory-user.repository.js';
import { InMemoryParentStudentLinkRepository } from '../src/modules/identity-parental/infrastructure/persistence/in-memory-parent-student-link.repository.js';
import { InMemoryParentalConsentRepository } from '../src/modules/identity-parental/infrastructure/persistence/in-memory-parental-consent.repository.js';
import { InMemoryInstitutionRepository } from '../src/modules/tenants/infrastructure/persistence/in-memory-institution.repository.js';
import { InMemoryInvitationRepository } from '../src/modules/tenants/infrastructure/persistence/in-memory-invitation.repository.js';
import { UserProvisioningAdapter } from '../src/modules/identity-parental/application/services/user-provisioning.adapter.js';
import { StudentCounterAdapter } from '../src/modules/identity-parental/application/services/student-counter.adapter.js';
import { CreateInstitutionUseCase } from '../src/modules/tenants/application/use-cases/create-institution.use-case.js';
import { CreateInvitationUseCase } from '../src/modules/tenants/application/use-cases/create-invitation.use-case.js';
import { RegisterFamilyUseCase } from '../src/modules/identity-parental/application/use-cases/register-family.use-case.js';
import { GrantParentalConsentUseCase } from '../src/modules/identity-parental/application/use-cases/grant-parental-consent.use-case.js';
import { RevokeParentalConsentUseCase } from '../src/modules/identity-parental/application/use-cases/revoke-parental-consent.use-case.js';
import { CheckStudentConsentUseCase } from '../src/modules/identity-parental/application/use-cases/check-student-consent.use-case.js';
import { GetParentalConsentAuditUseCase } from '../src/modules/identity-parental/application/use-cases/get-parental-consent-audit.use-case.js';
import { OnboardingController } from '../src/modules/identity-parental/infrastructure/http/onboarding.controller.js';
import { ConsentsController } from '../src/modules/identity-parental/infrastructure/http/consents.controller.js';
import type { AuthUser } from '../src/common/auth/auth-user.interface.js';

describe('Onboarding & Consent Endpoints Integration', () => {
  let institutionRepo: InMemoryInstitutionRepository;
  let invitationRepo: InMemoryInvitationRepository;
  let userRepo: InMemoryUserRepository;
  let linkRepo: InMemoryParentStudentLinkRepository;
  let consentRepo: InMemoryParentalConsentRepository;

  let onboardingController: OnboardingController;
  let consentsController: ConsentsController;

  let institutionId: string;
  let validInviteCode: string;

  beforeEach(async () => {
    institutionRepo = new InMemoryInstitutionRepository();
    invitationRepo = new InMemoryInvitationRepository();
    userRepo = new InMemoryUserRepository();
    linkRepo = new InMemoryParentStudentLinkRepository();
    consentRepo = new InMemoryParentalConsentRepository();

    const userProvisioning = new UserProvisioningAdapter(userRepo);
    const studentCounter = new StudentCounterAdapter(userRepo);

    const createInstitution = new CreateInstitutionUseCase(
      institutionRepo,
      userProvisioning,
    );
    const createInvitation = new CreateInvitationUseCase(
      institutionRepo,
      invitationRepo,
    );

    const registerFamily = new RegisterFamilyUseCase(
      invitationRepo,
      userRepo,
      linkRepo,
    );
    const grantConsent = new GrantParentalConsentUseCase(
      userRepo,
      linkRepo,
      consentRepo,
    );
    const revokeConsent = new RevokeParentalConsentUseCase(
      userRepo,
      linkRepo,
      consentRepo,
    );
    const checkConsent = new CheckStudentConsentUseCase(
      userRepo,
      consentRepo,
    );
    const getAudit = new GetParentalConsentAuditUseCase(
      userRepo,
      linkRepo,
      consentRepo,
    );

    onboardingController = new OnboardingController(registerFamily);
    consentsController = new ConsentsController(
      grantConsent,
      revokeConsent,
      checkConsent,
      getAudit,
    );

    // Create an institution and invitation code
    const instResult = await createInstitution.execute({
      name: 'Colegio Nacional',
      cuit: '30-12345678-9',
      address: 'Bolivar 263',
      billingPlanType: 'FIXED_MONTHLY',
      monthlyFeeCents: 2000000,
      schoolAdminEmail: 'rector@nacional.edu.ar',
      kioskEmail: 'kiosco@nacional.edu.ar',
    });
    institutionId = instResult.institution.id;

    const schoolAdminUser: AuthUser = {
      id: instResult.provisionedUsers.schoolAdmin.id,
      email: 'rector@nacional.edu.ar',
      role: 'SCHOOL_ADMIN',
      institutionId,
      fullName: 'Rector Nacional',
    };

    const inv = await createInvitation.execute(
      {
        institutionId,
        code: 'NACIONAL-2026',
        maxUses: 50,
      },
      schoolAdminUser,
    );
    validInviteCode = inv.code;
  });

  describe('Full Family Registration Flow', () => {
    it('registers parent and student in PENDING_CONSENT status', async () => {
      const result = await onboardingController.registerFamily({
        inviteCode: validInviteCode,
        parent: {
          fullName: 'Laura Fernandez',
          email: 'laura@email.com',
          password: 'securePassword123!',
          phone: '+5491144332211',
          dni: '32111222',
        },
        student: {
          fullName: 'Joaquin Perez',
          dni: '48999888',
          grade: '3ro B',
          dateOfBirth: '2012-05-15',
        },
      });

      expect(result.status).toBe('PENDING_CONSENT');
      expect(result.institutionId).toBe(institutionId);
      expect(result.parentId).toBeDefined();
      expect(result.studentId).toBeDefined();

      // Student starts in inactive state
      const studentInDb = await userRepo.findById(result.studentId);
      expect(studentInDb?.isActive).toBe(false);

      // Invitation usage count is incremented
      const invInDb = await invitationRepo.findByCode(validInviteCode);
      expect(invInDb?.usedCount).toBe(1);

      // Parent user context
      const parentUser: AuthUser = {
        id: result.parentId,
        email: 'laura@email.com',
        role: 'PARENT',
        institutionId,
        fullName: 'Laura Fernandez',
      };

      // Mock Express Request object
      const mockReq = {
        headers: {
          'x-forwarded-for': '181.44.20.1',
          'user-agent': 'Chrome/120.0.0.0',
        },
        socket: {},
      } as any;

      // Parent grants consent
      const grantResult = await consentsController.grantConsent(
        {
          studentId: result.studentId,
          acceptedTermsVersion: 'v1.0.0',
          acceptedAt: new Date().toISOString(),
          signatureIp: '181.44.20.1',
        },
        parentUser,
        mockReq,
      );

      expect(grantResult.success).toBe(true);
      expect(grantResult.status).toBe('GRANTED');

      // Student operational check succeeds
      const statusCheck = await consentsController.checkStatus(
        result.studentId,
        parentUser,
      );
      expect(statusCheck.canOperate).toBe(true);

      // Parent revokes consent
      const revokeResult = await consentsController.revokeConsent(
        {
          studentId: result.studentId,
          reason: 'Temporary suspension',
        },
        parentUser,
        mockReq,
      );

      expect(revokeResult.status).toBe('REVOKED');

      // Student operational check now fails
      await expect(
        consentsController.checkStatus(result.studentId, parentUser),
      ).rejects.toThrow();
    });
  });

  describe('Zod Validation Pipe Tests', () => {
    it('validates and accepts compliant CreateInstitutionSchema input', () => {
      const pipe = new ZodValidationPipe(CreateInstitutionSchema);
      const input = {
        name: 'Colegio San Jose',
        cuit: '30-11223344-5',
        address: 'Mitre 200',
        billingPlanType: 'FIXED_MONTHLY',
        monthlyFeeCents: 150000,
        schoolAdminEmail: 'admin@sanjose.edu',
        kioskEmail: 'kiosk@sanjose.edu',
      };

      const result = pipe.transform(input, { type: 'body' });
      expect(result).toEqual(input);
    });

    it('rejects invalid Argentine CUIT in CreateInstitutionSchema', () => {
      const pipe = new ZodValidationPipe(CreateInstitutionSchema);
      const input = {
        name: 'Colegio San Jose',
        cuit: 'INVALID-CUIT-STRING',
        address: 'Mitre 200',
        billingPlanType: 'FIXED_MONTHLY',
        monthlyFeeCents: 150000,
        schoolAdminEmail: 'admin@sanjose.edu',
        kioskEmail: 'kiosk@sanjose.edu',
      };

      expect(() => pipe.transform(input, { type: 'body' })).toThrowError(
        BadRequestException,
      );
    });

    it('rejects weak password (< 8 chars) in RegisterParentAndStudentSchema', () => {
      const pipe = new ZodValidationPipe(RegisterParentAndStudentSchema);
      const input = {
        inviteCode: 'CODE123',
        parent: {
          fullName: 'Juan Perez',
          email: 'juan@test.com',
          password: '123', // Too short
          dni: '12345678',
        },
        student: {
          fullName: 'Tomas Perez',
          dni: '87654321',
          grade: '1ro A',
          dateOfBirth: '2015-01-01',
        },
      };

      expect(() => pipe.transform(input, { type: 'body' })).toThrowError(
        BadRequestException,
      );
    });

    it('rejects invalid IP address in GrantParentalConsentSchema', () => {
      const pipe = new ZodValidationPipe(GrantParentalConsentSchema);
      const input = {
        studentId: '11111111-1111-1111-1111-111111111111',
        acceptedTermsVersion: 'v1.0.0',
        acceptedAt: new Date().toISOString(),
        signatureIp: 'not-an-ip-address',
      };

      expect(() => pipe.transform(input, { type: 'body' })).toThrowError(
        BadRequestException,
      );
    });

    it('validates compliant GrantParentalConsentSchema with IPv4', () => {
      const pipe = new ZodValidationPipe(GrantParentalConsentSchema);
      const input = {
        studentId: '11111111-1111-1111-1111-111111111111',
        acceptedTermsVersion: 'v1.0.0',
        acceptedAt: '2026-03-01T12:00:00.000Z',
        signatureIp: '192.168.1.100',
      };

      const result = pipe.transform(input, { type: 'body' });
      expect(result).toEqual(input);
    });
  });
});
