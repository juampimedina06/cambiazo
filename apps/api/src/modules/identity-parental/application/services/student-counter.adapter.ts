import { Inject, Injectable } from '@nestjs/common';
import type { StudentCounterPort } from '../../../tenants/domain/ports/student-counter.port.js';
import {
  type UserRepositoryPort,
  USER_REPOSITORY,
} from '../../domain/ports/user.repository.port.js';

@Injectable()
export class StudentCounterAdapter implements StudentCounterPort {
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepo: UserRepositoryPort,
  ) {}

  async countActiveStudents(institutionId: string): Promise<number> {
    return this.userRepo.countActiveStudentsByInstitution(institutionId);
  }
}
