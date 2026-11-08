import {
  Controller,
  Post,
} from '@nestjs/common';
import { Roles } from '../../../../common/auth/roles.decorator.js';
import { CurrentUser } from '../../../../common/auth/current-user.decorator.js';
import type { AuthUser } from '../../../../common/auth/auth-user.interface.js';
import { TenantId } from '../../../../common/tenant/tenant.guard.js';
import {
  GenerateStudentPaymentTokenUseCase,
  type GeneratedQrTokenResult,
} from '../../application/use-cases/generate-student-payment-token.use-case.js';

@Controller('api/v1/student')
export class StudentPaymentController {
  constructor(
    private readonly generateTokenUseCase: GenerateStudentPaymentTokenUseCase,
  ) {}

  @Post('payment-token')
  @Roles('STUDENT')
  async generatePaymentToken(
    @CurrentUser() studentUser: AuthUser,
    @TenantId() institutionId: string,
  ): Promise<GeneratedQrTokenResult> {
    return this.generateTokenUseCase.execute(
      studentUser.id,
      institutionId,
    );
  }
}
