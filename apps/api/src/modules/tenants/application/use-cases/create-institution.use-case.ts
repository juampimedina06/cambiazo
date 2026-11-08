import { Inject, Injectable, HttpStatus } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import type { CreateInstitutionDto, InstitutionDto } from '@cambiazo/shared';
import { DOMAIN_ERROR_CODES } from '@cambiazo/shared';
import { DomainException } from '../../../../common/errors/domain.exception.js';
import type { Institution } from '../../domain/entities/institution.entity.js';
import {
  type InstitutionRepositoryPort,
  INSTITUTION_REPOSITORY,
} from '../../domain/ports/institution.repository.port.js';
import {
  type UserProvisioningPort,
  type ProvisionedUserResult,
  USER_PROVISIONING_PORT,
} from '../../domain/ports/user-provisioning.port.js';

export interface CreateInstitutionResult {
  institution: InstitutionDto;
  provisionedUsers: {
    schoolAdmin: ProvisionedUserResult;
    kiosk: ProvisionedUserResult;
  };
}

@Injectable()
export class CreateInstitutionUseCase {
  constructor(
    @Inject(INSTITUTION_REPOSITORY)
    private readonly institutionRepo: InstitutionRepositoryPort,
    @Inject(USER_PROVISIONING_PORT)
    private readonly userProvisioning: UserProvisioningPort,
  ) {}

  async execute(dto: CreateInstitutionDto): Promise<CreateInstitutionResult> {
    const existing = await this.institutionRepo.findByCuit(dto.cuit);
    if (existing) {
      throw new DomainException(
        DOMAIN_ERROR_CODES.INSTITUTION_ALREADY_EXISTS,
        `An institution with CUIT ${dto.cuit} already exists`,
        HttpStatus.CONFLICT,
      );
    }

    const institutionId = randomUUID();
    const createdAt = new Date();

    const entity: Institution = {
      id: institutionId,
      name: dto.name,
      cuit: dto.cuit,
      address: dto.address,
      billingPlanType: dto.billingPlanType,
      monthlyFeeCents: dto.monthlyFeeCents,
      status: 'ACTIVE',
      createdAt,
    };

    const saved = await this.institutionRepo.create(entity);

    // Provision school_admin and kiosk accounts
    const provisionedUsers = await this.userProvisioning.provisionInstitutionUsers(
      saved.id,
      dto.schoolAdminEmail,
      dto.kioskEmail,
    );

    const institutionDto: InstitutionDto = {
      id: saved.id,
      name: saved.name,
      cuit: saved.cuit,
      address: saved.address,
      billingPlanType: saved.billingPlanType,
      monthlyFeeCents: saved.monthlyFeeCents,
      status: saved.status,
      activeStudentsCount: 0,
      createdAt: saved.createdAt.toISOString(),
    };

    return {
      institution: institutionDto,
      provisionedUsers,
    };
  }
}
