import {
  Controller,
  Post,
  Body,
  UsePipes,
} from '@nestjs/common';
import {
  ChargeQrRequestSchema,
  type ChargeQrRequestDto,
} from '@cambiazo/shared';
import { Roles } from '../../../../common/auth/roles.decorator.js';
import { CurrentUser } from '../../../../common/auth/current-user.decorator.js';
import type { AuthUser } from '../../../../common/auth/auth-user.interface.js';
import { TenantId } from '../../../../common/tenant/tenant.guard.js';
import { ZodValidationPipe } from '../../../../common/pipes/zod-validation.pipe.js';
import {
  ProcessKioskQrPaymentUseCase,
  type KioskChargeReceipt,
} from '../../application/use-cases/process-kiosk-qr-payment.use-case.js';

@Controller('api/v1/kiosk')
export class KioskPosController {
  constructor(
    private readonly processKioskQrPaymentUseCase: ProcessKioskQrPaymentUseCase,
  ) {}

  @Post('charge')
  @Roles('KIOSK')
  @UsePipes(new ZodValidationPipe(ChargeQrRequestSchema))
  async charge(
    @Body() body: ChargeQrRequestDto,
    @CurrentUser() user: AuthUser,
    @TenantId() institutionId: string,
  ): Promise<KioskChargeReceipt> {
    return this.processKioskQrPaymentUseCase.execute(
      user.id,
      institutionId,
      body,
    );
  }
}
