import { Module, forwardRef } from '@nestjs/common';
import { USER_REPOSITORY } from './domain/ports/user.repository.port.js';
import { PARENT_STUDENT_LINK_REPOSITORY } from './domain/ports/parent-student-link.repository.port.js';
import { PARENTAL_CONSENT_REPOSITORY } from './domain/ports/parental-consent.repository.port.js';
import { USER_PROVISIONING_PORT } from '../tenants/domain/ports/user-provisioning.port.js';
import { STUDENT_COUNTER_PORT } from '../tenants/domain/ports/student-counter.port.js';
import { InMemoryUserRepository } from './infrastructure/persistence/in-memory-user.repository.js';
import { InMemoryParentStudentLinkRepository } from './infrastructure/persistence/in-memory-parent-student-link.repository.js';
import { InMemoryParentalConsentRepository } from './infrastructure/persistence/in-memory-parental-consent.repository.js';
import { UserProvisioningAdapter } from './application/services/user-provisioning.adapter.js';
import { StudentCounterAdapter } from './application/services/student-counter.adapter.js';
import { RegisterFamilyUseCase } from './application/use-cases/register-family.use-case.js';
import { GrantParentalConsentUseCase } from './application/use-cases/grant-parental-consent.use-case.js';
import { RevokeParentalConsentUseCase } from './application/use-cases/revoke-parental-consent.use-case.js';
import { CheckStudentConsentUseCase } from './application/use-cases/check-student-consent.use-case.js';
import { GetParentalConsentAuditUseCase } from './application/use-cases/get-parental-consent-audit.use-case.js';
import { OnboardingController } from './infrastructure/http/onboarding.controller.js';
import { ConsentsController } from './infrastructure/http/consents.controller.js';
import { SPENDING_LIMITS_REPOSITORY } from './domain/ports/spending-limits.repository.port.js';
import { InMemorySpendingLimitsRepository } from './infrastructure/persistence/in-memory-spending-limits.repository.js';
import { UpdateSpendingLimitsUseCase } from './application/use-cases/update-spending-limits.use-case.js';
import { GetSpendingLimitsUseCase } from './application/use-cases/get-spending-limits.use-case.js';
import { ParentalControlsService } from './application/services/parental-controls.service.js';
import { ParentalControlsController } from './infrastructure/http/parental-controls.controller.js';
import { TenantsModule } from '../tenants/tenants.module.js';

@Module({
  imports: [forwardRef(() => TenantsModule)],
  controllers: [OnboardingController, ConsentsController, ParentalControlsController],
  providers: [
    InMemoryUserRepository,
    InMemoryParentStudentLinkRepository,
    InMemoryParentalConsentRepository,
    InMemorySpendingLimitsRepository,
    UserProvisioningAdapter,
    StudentCounterAdapter,
    {
      provide: USER_REPOSITORY,
      useExisting: InMemoryUserRepository,
    },
    {
      provide: PARENT_STUDENT_LINK_REPOSITORY,
      useExisting: InMemoryParentStudentLinkRepository,
    },
    {
      provide: PARENTAL_CONSENT_REPOSITORY,
      useExisting: InMemoryParentalConsentRepository,
    },
    {
      provide: SPENDING_LIMITS_REPOSITORY,
      useExisting: InMemorySpendingLimitsRepository,
    },
    {
      provide: USER_PROVISIONING_PORT,
      useExisting: UserProvisioningAdapter,
    },
    {
      provide: STUDENT_COUNTER_PORT,
      useExisting: StudentCounterAdapter,
    },
    RegisterFamilyUseCase,
    GrantParentalConsentUseCase,
    RevokeParentalConsentUseCase,
    CheckStudentConsentUseCase,
    GetParentalConsentAuditUseCase,
    UpdateSpendingLimitsUseCase,
    GetSpendingLimitsUseCase,
    ParentalControlsService,
  ],
  exports: [
    USER_REPOSITORY,
    PARENT_STUDENT_LINK_REPOSITORY,
    PARENTAL_CONSENT_REPOSITORY,
    SPENDING_LIMITS_REPOSITORY,
    USER_PROVISIONING_PORT,
    STUDENT_COUNTER_PORT,
    InMemoryUserRepository,
    InMemoryParentStudentLinkRepository,
    InMemoryParentalConsentRepository,
    InMemorySpendingLimitsRepository,
    CheckStudentConsentUseCase,
    GrantParentalConsentUseCase,
    RevokeParentalConsentUseCase,
    RegisterFamilyUseCase,
    GetParentalConsentAuditUseCase,
    UpdateSpendingLimitsUseCase,
    GetSpendingLimitsUseCase,
    ParentalControlsService,
  ],
})
export class IdentityParentalModule {}

