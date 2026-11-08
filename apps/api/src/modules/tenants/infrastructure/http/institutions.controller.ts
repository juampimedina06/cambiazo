import {
  Controller,
  Post,
  Get,
  Body,
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

@Controller('api/v1/institutions')
@UseGuards(AuthGuard, RolesGuard)
export class InstitutionsController {
  constructor(
    private readonly createInstitutionUseCase: CreateInstitutionUseCase,
    private readonly listInstitutionsUseCase: ListInstitutionsUseCase,
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
}
