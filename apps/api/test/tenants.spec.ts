import { describe, it, expect, beforeEach } from 'vitest';
import { InMemoryInstitutionRepository } from '../src/modules/tenants/infrastructure/persistence/in-memory-institution.repository.js';
import { InMemoryInvitationRepository } from '../src/modules/tenants/infrastructure/persistence/in-memory-invitation.repository.js';
import { InMemoryUserRepository } from '../src/modules/identity-parental/infrastructure/persistence/in-memory-user.repository.js';
import { UserProvisioningAdapter } from '../src/modules/identity-parental/application/services/user-provisioning.adapter.js';
import { StudentCounterAdapter } from '../src/modules/identity-parental/application/services/student-counter.adapter.js';
import { CreateInstitutionUseCase } from '../src/modules/tenants/application/use-cases/create-institution.use-case.js';
import { ListInstitutionsUseCase } from '../src/modules/tenants/application/use-cases/list-institutions.use-case.js';
import { CreateInvitationUseCase } from '../src/modules/tenants/application/use-cases/create-invitation.use-case.js';
import { ValidateInvitationUseCase } from '../src/modules/tenants/application/use-cases/validate-invitation.use-case.js';
import { InstitutionsController } from '../src/modules/tenants/infrastructure/http/institutions.controller.js';
import { InvitationsController } from '../src/modules/tenants/infrastructure/http/invitations.controller.js';
import { DOMAIN_ERROR_CODES, type CreateInstitutionDto } from '@cambiazo/shared';
import { DomainException, TenantMismatchException } from '../src/common/errors/domain.exception.js';
import type { AuthUser } from '../src/common/auth/auth-user.interface.js';

describe('Tenants & Institutions Module', () => {
  let institutionRepo: InMemoryInstitutionRepository;
  let invitationRepo: InMemoryInvitationRepository;
  let userRepo: InMemoryUserRepository;
  let userProvisioning: UserProvisioningAdapter;
  let studentCounter: StudentCounterAdapter;
  let createInstitutionUseCase: CreateInstitutionUseCase;
  let listInstitutionsUseCase: ListInstitutionsUseCase;
  let createInvitationUseCase: CreateInvitationUseCase;
  let validateInvitationUseCase: ValidateInvitationUseCase;
  let institutionsController: InstitutionsController;
  let invitationsController: InvitationsController;

  const superAdminUser: AuthUser = {
    id: 'super-admin-1',
    email: 'super@cambiazo.internal',
    role: 'SUPER_ADMIN',
    fullName: 'Global Super Admin',
  };

  beforeEach(() => {
    institutionRepo = new InMemoryInstitutionRepository();
    invitationRepo = new InMemoryInvitationRepository();
    userRepo = new InMemoryUserRepository();
    userProvisioning = new UserProvisioningAdapter(userRepo);
    studentCounter = new StudentCounterAdapter(userRepo);

    createInstitutionUseCase = new CreateInstitutionUseCase(
      institutionRepo,
      userProvisioning,
    );
    listInstitutionsUseCase = new ListInstitutionsUseCase(
      institutionRepo,
      studentCounter,
    );
    createInvitationUseCase = new CreateInvitationUseCase(
      institutionRepo,
      invitationRepo,
    );
    validateInvitationUseCase = new ValidateInvitationUseCase(
      invitationRepo,
      institutionRepo,
    );

    institutionsController = new InstitutionsController(
      createInstitutionUseCase,
      listInstitutionsUseCase,
    );
    invitationsController = new InvitationsController(
      createInvitationUseCase,
      validateInvitationUseCase,
    );
  });

  describe('Institution Creation & User Provisioning', () => {
    it('creates an institution and provisions SCHOOL_ADMIN and KIOSK users', async () => {
      const dto: CreateInstitutionDto = {
        name: 'Colegio San Martin',
        cuit: '30-11223344-5',
        address: 'Av. Libertador 1234, CABA',
        billingPlanType: 'FIXED_MONTHLY',
        monthlyFeeCents: 1500000,
        schoolAdminEmail: 'admin@sanmartin.edu.ar',
        kioskEmail: 'kiosco@sanmartin.edu.ar',
      };

      const result = await institutionsController.createInstitution(dto);

      expect(result.institution).toBeDefined();
      expect(result.institution.id).toBeDefined();
      expect(result.institution.name).toBe('Colegio San Martin');
      expect(result.institution.cuit).toBe('30-11223344-5');
      expect(result.institution.billingPlanType).toBe('FIXED_MONTHLY');
      expect(result.institution.status).toBe('ACTIVE');
      expect(result.institution.activeStudentsCount).toBe(0);

      // Verify provisioned users in userRepo
      expect(result.provisionedUsers.schoolAdmin.email).toBe('admin@sanmartin.edu.ar');
      expect(result.provisionedUsers.schoolAdmin.role).toBe('SCHOOL_ADMIN');
      expect(result.provisionedUsers.kiosk.email).toBe('kiosco@sanmartin.edu.ar');
      expect(result.provisionedUsers.kiosk.role).toBe('KIOSK');

      const adminInDb = await userRepo.findByEmail('admin@sanmartin.edu.ar');
      expect(adminInDb).toBeDefined();
      expect(adminInDb?.institutionId).toBe(result.institution.id);

      const kioskInDb = await userRepo.findByEmail('kiosco@sanmartin.edu.ar');
      expect(kioskInDb).toBeDefined();
      expect(kioskInDb?.institutionId).toBe(result.institution.id);
    });

    it('rejects duplicate institution registration with same CUIT', async () => {
      const dto: CreateInstitutionDto = {
        name: 'Colegio Belgrano',
        cuit: '30-99887766-1',
        address: 'Calle Falsa 123',
        billingPlanType: 'PER_ACTIVE_STUDENT',
        monthlyFeeCents: 50000,
        schoolAdminEmail: 'admin1@belgrano.edu.ar',
        kioskEmail: 'kiosco1@belgrano.edu.ar',
      };

      await institutionsController.createInstitution(dto);

      await expect(institutionsController.createInstitution(dto)).rejects.toThrowError(
        expect.objectContaining({
          code: DOMAIN_ERROR_CODES.INSTITUTION_ALREADY_EXISTS,
        }),
      );
    });

    it('lists institutions with accurate active student count', async () => {
      const created = await institutionsController.createInstitution({
        name: 'Instituto Sarmiento',
        cuit: '30-44556677-9',
        address: 'San Martin 500',
        billingPlanType: 'FIXED_MONTHLY',
        monthlyFeeCents: 2000000,
        schoolAdminEmail: 'admin@sarmiento.edu.ar',
        kioskEmail: 'kiosk@sarmiento.edu.ar',
      });

      // Initially active students = 0
      let list = await institutionsController.listInstitutions();
      expect(list).toHaveLength(1);
      expect(list[0]?.activeStudentsCount).toBe(0);

      // Simulate 2 active students registered under this institution
      await userRepo.create({
        id: 'student-1',
        institutionId: created.institution.id,
        role: 'STUDENT',
        email: 's1@sarmiento.edu.ar',
        passwordHash: 'hash',
        fullName: 'Mateo Gomez',
        isActive: true,
        createdAt: new Date(),
      });
      await userRepo.create({
        id: 'student-2',
        institutionId: created.institution.id,
        role: 'STUDENT',
        email: 's2@sarmiento.edu.ar',
        passwordHash: 'hash',
        fullName: 'Sofia Lopez',
        isActive: true,
        createdAt: new Date(),
      });
      // Inactive student should not be counted
      await userRepo.create({
        id: 'student-3',
        institutionId: created.institution.id,
        role: 'STUDENT',
        email: 's3@sarmiento.edu.ar',
        passwordHash: 'hash',
        fullName: 'Lucas Diaz',
        isActive: false,
        createdAt: new Date(),
      });

      list = await institutionsController.listInstitutions();
      expect(list[0]?.activeStudentsCount).toBe(2);
    });
  });

  describe('Institution Invitations', () => {
    let institutionId: string;
    let schoolAdminUser: AuthUser;

    beforeEach(async () => {
      const res = await institutionsController.createInstitution({
        name: 'Colegio Moreno',
        cuit: '30-55667788-2',
        address: 'Moreno 100',
        billingPlanType: 'FIXED_MONTHLY',
        monthlyFeeCents: 1000000,
        schoolAdminEmail: 'admin@moreno.edu.ar',
        kioskEmail: 'kiosk@moreno.edu.ar',
      });
      institutionId = res.institution.id;
      schoolAdminUser = {
        id: res.provisionedUsers.schoolAdmin.id,
        email: res.provisionedUsers.schoolAdmin.email,
        role: 'SCHOOL_ADMIN',
        institutionId,
        fullName: 'Admin Moreno',
      };
    });

    it('generates an invitation code for families', async () => {
      const invitation = await invitationsController.createInvitation(
        {
          institutionId,
          code: 'MORENO-2026',
          maxUses: 100,
        },
        schoolAdminUser,
      );

      expect(invitation.code).toBe('MORENO-2026');
      expect(invitation.institutionId).toBe(institutionId);
      expect(invitation.maxUses).toBe(100);
      expect(invitation.usedCount).toBe(0);

      // Validate endpoint publicly
      const validation = await invitationsController.validateInvitation('MORENO-2026');
      expect(validation.valid).toBe(true);
      expect(validation.institution.id).toBe(institutionId);
      expect(validation.institution.name).toBe('Colegio Moreno');
    });

    it('blocks a SCHOOL_ADMIN from creating invitations for another institution', async () => {
      const foreignInstitutionId = '77777777-7777-7777-7777-777777777777';

      await expect(
        invitationsController.createInvitation(
          {
            institutionId: foreignInstitutionId,
            code: 'HACK-CODE',
          },
          schoolAdminUser,
        ),
      ).rejects.toThrowError(TenantMismatchException);
    });

    it('rejects expired invitation codes', async () => {
      const expiredDate = new Date(Date.now() - 100000).toISOString();
      await invitationsController.createInvitation(
        {
          institutionId,
          code: 'EXPIRED-CODE',
          expiresAt: expiredDate,
        },
        schoolAdminUser,
      );

      await expect(
        invitationsController.validateInvitation('EXPIRED-CODE'),
      ).rejects.toThrowError(
        expect.objectContaining({
          code: DOMAIN_ERROR_CODES.INVALID_INVITATION_CODE,
        }),
      );
    });

    it('rejects invitation codes that have reached maxUses', async () => {
      const inv = await invitationsController.createInvitation(
        {
          institutionId,
          code: 'ONE-TIME',
          maxUses: 1,
        },
        schoolAdminUser,
      );

      // Increment usedCount
      await invitationRepo.incrementUsedCount(inv.id);

      await expect(
        invitationsController.validateInvitation('ONE-TIME'),
      ).rejects.toThrowError(
        expect.objectContaining({
          code: DOMAIN_ERROR_CODES.INVALID_INVITATION_CODE,
        }),
      );
    });
  });
});
