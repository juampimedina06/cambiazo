import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  CreateInvitationSchema,
  type CreateInvitationDto,
} from '@cambiazo/shared';
import { Roles } from '../../../../common/auth/roles.decorator.js';
import { Public } from '../../../../common/auth/public.decorator.js';
import { AuthGuard } from '../../../../common/auth/auth.guard.js';
import { RolesGuard } from '../../../../common/auth/roles.guard.js';
import { TenantGuard } from '../../../../common/tenant/tenant.guard.js';
import { CurrentUser } from '../../../../common/auth/current-user.decorator.js';
import type { AuthUser } from '../../../../common/auth/auth-user.interface.js';
import { ZodValidationPipe } from '../../../../common/pipes/zod-validation.pipe.js';
import { CreateInvitationUseCase } from '../../application/use-cases/create-invitation.use-case.js';
import { ValidateInvitationUseCase } from '../../application/use-cases/validate-invitation.use-case.js';

@Controller('api/v1/invitations')
export class InvitationsController {
  constructor(
    private readonly createInvitationUseCase: CreateInvitationUseCase,
    private readonly validateInvitationUseCase: ValidateInvitationUseCase,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @Roles('SCHOOL_ADMIN', 'SUPER_ADMIN')
  @UseGuards(AuthGuard, RolesGuard, TenantGuard)
  async createInvitation(
    @Body(new ZodValidationPipe(CreateInvitationSchema))
    dto: CreateInvitationDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.createInvitationUseCase.execute(dto, user);
  }

  @Get('validate/:code')
  @Public()
  async validateInvitation(@Param('code') code: string) {
    return this.validateInvitationUseCase.execute(code);
  }
}
