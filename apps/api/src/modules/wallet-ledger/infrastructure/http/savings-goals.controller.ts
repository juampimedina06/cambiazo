import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  Param,
  Inject,
  UsePipes,
} from '@nestjs/common';
import {
  CreateSavingsGoalSchema,
  DepositSavingsGoalSchema,
  type CreateSavingsGoalDto,
  type DepositSavingsGoalDto,
} from '@cambiazo/shared';
import { CurrentUser } from '../../../../common/auth/current-user.decorator.js';
import type { AuthUser } from '../../../../common/auth/auth-user.interface.js';
import { Roles } from '../../../../common/auth/roles.decorator.js';
import { ZodValidationPipe } from '../../../../common/pipes/zod-validation.pipe.js';
import { SavingsGoalService } from '../../application/services/savings-goal.service.js';
import type { StudentSavingsGoal } from '../../domain/entities/student-savings-goal.entity.js';

@Controller('api/v1/wallet/savings-goals')
export class SavingsGoalsController {
  constructor(
    @Inject(SavingsGoalService)
    private readonly savingsGoalService: SavingsGoalService,
  ) {}

  @Post()
  @Roles('STUDENT')
  @UsePipes(new ZodValidationPipe(CreateSavingsGoalSchema))
  async createGoal(
    @CurrentUser() user: AuthUser,
    @Body() dto: CreateSavingsGoalDto,
  ): Promise<StudentSavingsGoal> {
    return this.savingsGoalService.createGoal(user.id, user.institutionId!, dto);
  }

  @Get()
  @Roles('STUDENT')
  async listGoals(
    @CurrentUser() user: AuthUser,
  ): Promise<StudentSavingsGoal[]> {
    return this.savingsGoalService.getStudentGoals(user.id, user.institutionId!);
  }

  @Post(':id/deposit')
  @Roles('STUDENT')
  @UsePipes(new ZodValidationPipe(DepositSavingsGoalSchema))
  async deposit(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: DepositSavingsGoalDto,
  ): Promise<StudentSavingsGoal> {
    return this.savingsGoalService.depositToGoal(user.id, user.institutionId!, id, dto);
  }

  @Delete(':id')
  @Roles('STUDENT')
  async cancelGoal(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
  ): Promise<{ released: boolean }> {
    await this.savingsGoalService.cancelOrReleaseGoal(user.id, user.institutionId!, id);
    return { released: true };
  }

  @Post('convert-to-points')
  @Roles('STUDENT')
  async attemptConvertToPoints(): Promise<never> {
    return this.savingsGoalService.prohibitConversionToPoints();
  }
}
