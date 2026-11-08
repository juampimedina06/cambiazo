import { Inject, Injectable } from '@nestjs/common';
import type { InstitutionDto } from '@cambiazo/shared';
import {
  type InstitutionRepositoryPort,
  INSTITUTION_REPOSITORY,
} from '../../domain/ports/institution.repository.port.js';
import {
  type StudentCounterPort,
  STUDENT_COUNTER_PORT,
} from '../../domain/ports/student-counter.port.js';

@Injectable()
export class ListInstitutionsUseCase {
  constructor(
    @Inject(INSTITUTION_REPOSITORY)
    private readonly institutionRepo: InstitutionRepositoryPort,
    @Inject(STUDENT_COUNTER_PORT)
    private readonly studentCounter: StudentCounterPort,
  ) {}

  async execute(): Promise<InstitutionDto[]> {
    const institutions = await this.institutionRepo.findAll();

    const dtos: InstitutionDto[] = await Promise.all(
      institutions.map(async (inst) => {
        const activeCount = await this.studentCounter.countActiveStudents(inst.id);
        return {
          id: inst.id,
          name: inst.name,
          cuit: inst.cuit,
          address: inst.address,
          billingPlanType: inst.billingPlanType,
          monthlyFeeCents: inst.monthlyFeeCents,
          status: inst.status,
          activeStudentsCount: activeCount,
          createdAt: inst.createdAt.toISOString(),
        };
      }),
    );

    return dtos;
  }
}
