import {
  Controller,
  Post,
  Get,
  Patch,
  Param,
  Body,
  Inject,
  Optional,
  NotFoundException,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { CreateInstitutionSchema, type CreateInstitutionDto } from '@cambiazo/shared';
import { Roles } from '../../../../common/auth/roles.decorator.js';
import { AuthGuard } from '../../../../common/auth/auth.guard.js';
import { RolesGuard } from '../../../../common/auth/roles.guard.js';
import { ZodValidationPipe } from '../../../../common/pipes/zod-validation.pipe.js';
import { CreateInstitutionUseCase } from '../../application/use-cases/create-institution.use-case.js';
import { ListInstitutionsUseCase } from '../../application/use-cases/list-institutions.use-case.js';
import {
  INSTITUTION_REPOSITORY,
  type InstitutionRepositoryPort,
} from '../../domain/ports/institution.repository.port.js';

@Controller('api/v1/institutions')
@UseGuards(AuthGuard, RolesGuard)
export class InstitutionsController {
  constructor(
    @Inject(CreateInstitutionUseCase)
    private readonly createInstitutionUseCase: CreateInstitutionUseCase,
    @Inject(ListInstitutionsUseCase)
    private readonly listInstitutionsUseCase: ListInstitutionsUseCase,
    @Optional()
    @Inject(INSTITUTION_REPOSITORY)
    private readonly institutionRepo?: InstitutionRepositoryPort,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @Roles('SUPER_ADMIN')
  async createInstitution(
    @Body(new ZodValidationPipe(CreateInstitutionSchema))
    dto: CreateInstitutionDto,
  ) {
    return this.createInstitutionUseCase.execute(dto);
  }

  @Get()
  @Roles('SUPER_ADMIN')
  async listInstitutions() {
    return this.listInstitutionsUseCase.execute();
  }

  @Get(':id')
  @Roles('SUPER_ADMIN')
  async getInstitution(@Param('id') id: string) {
    const list = await this.listInstitutionsUseCase.execute();
    const inst = list.find((i) => i.id === id);
    if (!inst) {
      throw new NotFoundException(`Institución ${id} no encontrada`);
    }
    return inst;
  }

  @Patch(':id/status')
  @Roles('SUPER_ADMIN')
  async updateStatus(
    @Param('id') id: string,
    @Body('status') status: 'ACTIVE' | 'SUSPENDED',
  ) {
    if (!this.institutionRepo) {
      throw new NotFoundException(`Institución ${id} no encontrada`);
    }
    const inst = await this.institutionRepo.findById(id);
    if (!inst) {
      throw new NotFoundException(`Institución ${id} no encontrada`);
    }
    inst.status = status;
    await this.institutionRepo.create(inst);
    return inst;
  }
}
