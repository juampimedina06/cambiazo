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
import { LoginFamilyUseCase } from '../src/modules/identity-parental/application/use-cases/login-family.use-case.js';
import { ChangeStudentPasswordUseCase } from '../src/modules/identity-parental/application/use-cases/change-student-password.use-case.js';
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
    const loginFamily = new LoginFamilyUseCase(
      invitationRepo,
      institutionRepo,
      userRepo,
      linkRepo,
      consentRepo,
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

    const changeStudentPassword = new ChangeStudentPasswordUseCase(
      userRepo,
      linkRepo,
    );

    onboardingController = new OnboardingController(
      registerFamily,
      loginFamily,
      changeStudentPassword,
    );
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

    it('skips schema validation for non-body parameters such as @CurrentUser or @Param', () => {
      const pipe = new ZodValidationPipe(CreateInstitutionSchema);
      const authUser = {
        id: '11111111-1111-1111-1111-111111111111',
        role: 'STUDENT',
        institutionId: '22222222-2222-2222-2222-222222222222',
      };

      expect(pipe.transform(authUser, { type: 'custom' })).toEqual(authUser);
      expect(pipe.transform('goal-1', { type: 'param', data: 'id' })).toBe('goal-1');
    });
  });

  describe('Family Login Flow (Parent & Student)', () => {
    it('logs in registered parent by email and returns linked student consent status', async () => {
      const reg = await onboardingController.registerFamily({
        inviteCode: validInviteCode,
        parent: {
          fullName: 'Laura Fernandez',
          email: 'laura.login@email.com',
          password: 'securePassword123!',
          dni: '22334455',
        },
        student: {
          fullName: 'Sofia Fernandez',
          dni: '44556677',
          grade: '5to A',
          dateOfBirth: '2014-05-10',
        },
      });

      const loginRes = await onboardingController.login({
        inviteCode: validInviteCode,
        identifier: 'laura.login@email.com',
        password: 'securePassword123!',
      });

      expect(loginRes.role).toBe('PARENT');
      expect(loginRes.user.id).toBe(reg.parentId);
      expect(loginRes.students).toHaveLength(1);
      expect(loginRes.students[0]?.id).toBe(reg.studentId);
      expect(loginRes.students[0]?.consentStatus).toBe('PENDING');

      await consentsController.grantConsent(
        {
          studentId: reg.studentId,
          acceptedTermsVersion: 'v1.0.0',
          acceptedAt: new Date().toISOString(),
          signatureIp: '127.0.0.1',
        },
        {
          id: reg.parentId,
          institutionId,
          role: 'PARENT',
          email: 'laura.login@email.com',
          fullName: 'Laura Fernandez',
        },
        { headers: { 'user-agent': 'test-agent' }, socket: {} } as any,
      );

      const postConsentLogin = await onboardingController.login({
        inviteCode: validInviteCode,
        identifier: '22334455',
        password: 'securePassword123!',
      });

      expect(postConsentLogin.students[0]?.consentStatus).toBe('GRANTED');
      expect(postConsentLogin.students[0]?.isActive).toBe(true);
    });

    it('logs in registered student by DNI with family password and supports optional password change', async () => {
      const reg = await onboardingController.registerFamily({
        inviteCode: validInviteCode,
        parent: {
          fullName: 'Carlos Ruiz',
          email: 'carlos.ruiz@email.com',
          password: 'securePassword123!',
          dni: '20998877',
        },
        student: {
          fullName: 'Lucas Ruiz',
          dni: '48998877',
          grade: '6to B',
          dateOfBirth: '2013-08-20',
        },
      });

      const studentLogin = await onboardingController.login({
        inviteCode: validInviteCode,
        identifier: '48998877',
        password: 'securePassword123!',
      });

      expect(studentLogin.role).toBe('STUDENT');
      expect(studentLogin.user.id).toBe(reg.studentId);
      expect(studentLogin.user.consentStatus).toBe('PENDING');

      // Parent optionally assigns a custom password to their linked student
      const parentActor: AuthUser = {
        id: reg.parentId,
        email: 'carlos.ruiz@email.com',
        role: 'PARENT',
        institutionId,
        fullName: 'Carlos Ruiz',
      };

      const changeResult = await onboardingController.changeStudentPassword(
        {
          studentId: reg.studentId,
          newPassword: 'LucasClave2026',
        },
        parentActor,
      );
      expect(changeResult).toEqual({
        success: true,
        studentId: reg.studentId,
      });

      // Student logs in with the new custom password
      const updatedLogin = await onboardingController.login({
        inviteCode: validInviteCode,
        identifier: '48998877',
        password: 'LucasClave2026',
      });
      expect(updatedLogin.role).toBe('STUDENT');
      expect(updatedLogin.user.id).toBe(reg.studentId);

      // Old family password no longer works for this student, while parent still uses theirs
      await expect(
        onboardingController.login({
          inviteCode: validInviteCode,
          identifier: '48998877',
          password: 'securePassword123!',
        }),
      ).rejects.toThrow();

      // Student can also update their own password directly
      const studentActor: AuthUser = {
        id: reg.studentId,
        email: '48998877@student.cambiazo.internal',
        role: 'STUDENT',
        institutionId,
        fullName: 'Lucas Ruiz',
      };
      await onboardingController.changeStudentPassword(
        { newPassword: 'MiClavePropia99' },
        studentActor,
      );

      const selfUpdatedLogin = await onboardingController.login({
        inviteCode: validInviteCode,
        identifier: '48998877',
        password: 'MiClavePropia99',
      });
      expect(selfUpdatedLogin.user.id).toBe(reg.studentId);
    });

    it('rejects wrong password or invalid invitation code on login', async () => {
      await onboardingController.registerFamily({
        inviteCode: validInviteCode,
        parent: {
          fullName: 'Ana Lopez',
          email: 'ana.lopez@email.com',
          password: 'correctPassword1!',
          dni: '21112222',
        },
        student: {
          fullName: 'Martin Lopez',
          dni: '49112222',
          grade: '4to A',
          dateOfBirth: '2015-03-11',
        },
      });

      await expect(
        onboardingController.login({
          inviteCode: validInviteCode,
          identifier: 'ana.lopez@email.com',
          password: 'wrongPassword!',
        }),
      ).rejects.toThrow();

      await expect(
        onboardingController.login({
          inviteCode: 'WRONG_SCHOOL_CODE',
          identifier: 'ana.lopez@email.com',
          password: 'correctPassword1!',
        }),
      ).rejects.toThrow();
    });

    it('registers multiple siblings atomically and returns all of them on login', async () => {
      const reg = await onboardingController.registerFamily({
        inviteCode: validInviteCode,
        parent: {
          fullName: 'Marcos Silva',
          email: 'marcos.silva@email.com',
          password: 'securePassword123!',
          dni: '23445566',
        },
        student: {
          fullName: 'Sofia Silva',
          dni: '48445566',
          grade: '5to B',
          dateOfBirth: '2014-05-12',
        },
        additionalStudents: [
          {
            fullName: 'Tomas Silva',
            dni: '50445566',
            grade: '2do A',
            dateOfBirth: '2017-09-03',
          },
        ],
      });

      expect(reg.students).toHaveLength(2);
      expect(reg.parent.fullName).toBe('Marcos Silva');
      expect(reg.students.map((s) => s.fullName)).toEqual([
        'Sofia Silva',
        'Tomas Silva',
      ]);

      const parentLogin = await onboardingController.login({
        inviteCode: validInviteCode,
        identifier: 'marcos.silva@email.com',
        password: 'securePassword123!',
      });

      expect(parentLogin.role).toBe('PARENT');
      expect(parentLogin.students).toHaveLength(2);
      expect(parentLogin.students.map((s) => s.fullName)).toEqual([
        'Sofia Silva',
        'Tomas Silva',
      ]);
    });
  });
});
