import { Module, forwardRef } from '@nestjs/common';
import { INSTITUTION_REPOSITORY } from './domain/ports/institution.repository.port.js';
import { INVITATION_REPOSITORY } from './domain/ports/invitation.repository.port.js';
import { InMemoryInstitutionRepository } from './infrastructure/persistence/in-memory-institution.repository.js';
import { InMemoryInvitationRepository } from './infrastructure/persistence/in-memory-invitation.repository.js';
import { CreateInstitutionUseCase } from './application/use-cases/create-institution.use-case.js';
import { ListInstitutionsUseCase } from './application/use-cases/list-institutions.use-case.js';
import { CreateInvitationUseCase } from './application/use-cases/create-invitation.use-case.js';
import { ValidateInvitationUseCase } from './application/use-cases/validate-invitation.use-case.js';
import { InstitutionsController } from './infrastructure/http/institutions.controller.js';
import { InvitationsController } from './infrastructure/http/invitations.controller.js';
import { IdentityParentalModule } from '../identity-parental/identity-parental.module.js';

@Module({
  imports: [forwardRef(() => IdentityParentalModule)],
  controllers: [InstitutionsController, InvitationsController],
  providers: [
    CreateInstitutionUseCase,
    ListInstitutionsUseCase,
    CreateInvitationUseCase,
    ValidateInvitationUseCase,
    InMemoryInstitutionRepository,
    InMemoryInvitationRepository,
    {
      provide: INSTITUTION_REPOSITORY,
      useExisting: InMemoryInstitutionRepository,
    },
    {
      provide: INVITATION_REPOSITORY,
      useExisting: InMemoryInvitationRepository,
    },
  ],
  exports: [
    INSTITUTION_REPOSITORY,
    INVITATION_REPOSITORY,
    InMemoryInstitutionRepository,
    InMemoryInvitationRepository,
    CreateInstitutionUseCase,
    ListInstitutionsUseCase,
    CreateInvitationUseCase,
    ValidateInvitationUseCase,
  ],
})
export class TenantsModule {}
