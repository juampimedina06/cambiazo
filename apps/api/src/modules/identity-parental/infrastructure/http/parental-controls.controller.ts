import {
  Controller,
  Get,
  Put,
  Param,
  Body,
  Inject,
  UsePipes,
} from '@nestjs/common';
import {
  SpendingLimitsSchema,
  type SpendingLimitsDto,
} from '@cambiazo/shared';
import { Roles } from '../../../../common/auth/roles.decorator.js';
import { CurrentUser } from '../../../../common/auth/current-user.decorator.js';
import type { AuthUser } from '../../../../common/auth/auth-user.interface.js';
import { TenantId } from '../../../../common/tenant/tenant.guard.js';
import { ZodValidationPipe } from '../../../../common/pipes/zod-validation.pipe.js';
import { UpdateSpendingLimitsUseCase } from '../../application/use-cases/update-spending-limits.use-case.js';
import { GetSpendingLimitsUseCase } from '../../application/use-cases/get-spending-limits.use-case.js';
import type { SpendingLimits } from '../../domain/entities/spending-limits.entity.js';

@Controller('api/v1/students')
export class ParentalControlsController {
  constructor(
    @Inject(UpdateSpendingLimitsUseCase)
    private readonly updateSpendingLimitsUseCase: UpdateSpendingLimitsUseCase,
    @Inject(GetSpendingLimitsUseCase)
    private readonly getSpendingLimitsUseCase: GetSpendingLimitsUseCase,
  ) {}

  @Put(':id/limits')
  @Roles('PARENT')
  @UsePipes(new ZodValidationPipe(SpendingLimitsSchema))
  async updateLimits(
    @Param('id') studentId: string,
    @Body() body: SpendingLimitsDto,
    @CurrentUser() parentUser: AuthUser,
    @TenantId() institutionId: string,
  ): Promise<SpendingLimits> {
    const payload: SpendingLimitsDto = {
      ...body,
      studentId: body.studentId || studentId,
    };

    return this.updateSpendingLimitsUseCase.execute(
      parentUser.id,
      studentId,
      institutionId,
      payload,
    );
  }

  @Get(':id/limits')
  @Roles('PARENT', 'STUDENT', 'SCHOOL_ADMIN', 'SUPER_ADMIN')
  async getLimits(
    @Param('id') studentId: string,
    @CurrentUser() user: AuthUser,
    @TenantId() institutionId: string,
  ): Promise<SpendingLimits> {
    return this.getSpendingLimitsUseCase.execute(
      user.id,
      user.role,
      studentId,
      institutionId,
    );
  }
}
