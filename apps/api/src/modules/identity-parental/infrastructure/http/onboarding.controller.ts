import {
  Controller,
  Post,
  Body,
  Inject,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  RegisterParentAndStudentSchema,
  LoginFamilySchema,
  ChangeStudentPasswordSchema,
  type RegisterParentAndStudentDto,
  type LoginFamilyDto,
  type ChangeStudentPasswordDto,
} from '@cambiazo/shared';
import { Public } from '../../../../common/auth/public.decorator.js';
import { AuthGuard } from '../../../../common/auth/auth.guard.js';
import { RolesGuard } from '../../../../common/auth/roles.guard.js';
import { Roles } from '../../../../common/auth/roles.decorator.js';
import { CurrentUser } from '../../../../common/auth/current-user.decorator.js';
import type { AuthUser } from '../../../../common/auth/auth-user.interface.js';
import { TenantGuard } from '../../../../common/tenant/tenant.guard.js';
import { ZodValidationPipe } from '../../../../common/pipes/zod-validation.pipe.js';
import { RegisterFamilyUseCase } from '../../application/use-cases/register-family.use-case.js';
import { LoginFamilyUseCase } from '../../application/use-cases/login-family.use-case.js';
import { ChangeStudentPasswordUseCase } from '../../application/use-cases/change-student-password.use-case.js';

@Controller('api/v1/onboarding')
export class OnboardingController {
  constructor(
    @Inject(RegisterFamilyUseCase)
    private readonly registerFamilyUseCase: RegisterFamilyUseCase,
    @Inject(LoginFamilyUseCase)
    private readonly loginFamilyUseCase: LoginFamilyUseCase,
    @Inject(ChangeStudentPasswordUseCase)
    private readonly changeStudentPasswordUseCase: ChangeStudentPasswordUseCase,
  ) {}

  @Post('register-family')
  @Public()
  @HttpCode(HttpStatus.CREATED)
  async registerFamily(
    @Body(new ZodValidationPipe(RegisterParentAndStudentSchema))
    dto: RegisterParentAndStudentDto,
  ) {
    return this.registerFamilyUseCase.execute(dto);
  }

  @Post('login')
  @Public()
  @HttpCode(HttpStatus.OK)
  async login(
    @Body(new ZodValidationPipe(LoginFamilySchema))
    dto: LoginFamilyDto,
  ) {
    return this.loginFamilyUseCase.execute(dto);
  }

  @Post('student-password')
  @UseGuards(AuthGuard, RolesGuard, TenantGuard)
  @Roles('PARENT', 'STUDENT')
  @HttpCode(HttpStatus.OK)
  async changeStudentPassword(
    @Body(new ZodValidationPipe(ChangeStudentPasswordSchema))
    dto: ChangeStudentPasswordDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.changeStudentPasswordUseCase.execute(user, dto);
  }
}
