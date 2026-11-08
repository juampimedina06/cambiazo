import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  RegisterParentAndStudentSchema,
  type RegisterParentAndStudentDto,
} from '@cambiazo/shared';
import { Public } from '../../../../common/auth/public.decorator.js';
import { ZodValidationPipe } from '../../../../common/pipes/zod-validation.pipe.js';
import { RegisterFamilyUseCase } from '../../application/use-cases/register-family.use-case.js';

@Controller('api/v1/onboarding')
export class OnboardingController {
  constructor(private readonly registerFamilyUseCase: RegisterFamilyUseCase) {}

  @Post('register-family')
  @Public()
  @HttpCode(HttpStatus.CREATED)
  async registerFamily(
    @Body(new ZodValidationPipe(RegisterParentAndStudentSchema))
    dto: RegisterParentAndStudentDto,
  ) {
    return this.registerFamilyUseCase.execute(dto);
  }
}
