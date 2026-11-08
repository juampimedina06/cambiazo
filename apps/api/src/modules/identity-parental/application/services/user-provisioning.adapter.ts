import { Inject, Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import type {
  UserProvisioningPort,
  ProvisionedUserResult,
} from '../../../tenants/domain/ports/user-provisioning.port.js';
import type { User } from '../../domain/entities/user.entity.js';
import {
  type UserRepositoryPort,
  USER_REPOSITORY,
} from '../../domain/ports/user.repository.port.js';

@Injectable()
export class UserProvisioningAdapter implements UserProvisioningPort {
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepo: UserRepositoryPort,
  ) {}

  async provisionInstitutionUsers(
    institutionId: string,
    schoolAdminEmail: string,
    kioskEmail: string,
  ): Promise<{
    schoolAdmin: ProvisionedUserResult;
    kiosk: ProvisionedUserResult;
  }> {
    const createdAt = new Date();

    const schoolAdminUser: User = {
      id: randomUUID(),
      institutionId,
      role: 'SCHOOL_ADMIN',
      email: schoolAdminEmail.toLowerCase(),
      passwordHash: `hash_admin_${randomUUID().slice(0, 8)}`,
      fullName: 'School Administrator',
      isActive: true,
      createdAt,
    };

    const kioskUser: User = {
      id: randomUUID(),
      institutionId,
      role: 'KIOSK',
      email: kioskEmail.toLowerCase(),
      passwordHash: `hash_kiosk_${randomUUID().slice(0, 8)}`,
      fullName: 'School Kiosk POS',
      isActive: true,
      createdAt,
    };

    await this.userRepo.create(schoolAdminUser);
    await this.userRepo.create(kioskUser);

    return {
      schoolAdmin: {
        id: schoolAdminUser.id,
        email: schoolAdminUser.email,
        role: schoolAdminUser.role,
        institutionId: schoolAdminUser.institutionId!,
        fullName: schoolAdminUser.fullName,
      },
      kiosk: {
        id: kioskUser.id,
        email: kioskUser.email,
        role: kioskUser.role,
        institutionId: kioskUser.institutionId!,
        fullName: kioskUser.fullName,
      },
    };
  }
}
