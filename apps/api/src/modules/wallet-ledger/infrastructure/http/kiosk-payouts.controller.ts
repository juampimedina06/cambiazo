import {
  Controller,
  Post,
  Get,
  Body,
  UsePipes,
} from '@nestjs/common';
import {
  KioskWithdrawalRequestSchema,
  type KioskWithdrawalRequestDto,
} from '@cambiazo/shared';
import { Roles } from '../../../../common/auth/roles.decorator.js';
import { CurrentUser } from '../../../../common/auth/current-user.decorator.js';
import type { AuthUser } from '../../../../common/auth/auth-user.interface.js';
import { TenantId } from '../../../../common/tenant/tenant.guard.js';
import { ZodValidationPipe } from '../../../../common/pipes/zod-validation.pipe.js';
import {
  RequestKioskPayoutUseCase,
  type KioskPayoutResult,
} from '../../application/use-cases/request-kiosk-payout.use-case.js';
import {
  GetWalletBalanceUseCase,
  type WalletBalanceResult,
} from '../../application/use-cases/get-wallet-balance.use-case.js';

@Controller('api/v1/kiosk')
export class KioskPayoutsController {
  constructor(
    private readonly requestKioskPayoutUseCase: RequestKioskPayoutUseCase,
    private readonly getWalletBalanceUseCase: GetWalletBalanceUseCase,
  ) {}

  @Post('withdrawals')
  @Roles('KIOSK')
  @UsePipes(new ZodValidationPipe(KioskWithdrawalRequestSchema))
  async requestWithdrawal(
    @Body() body: KioskWithdrawalRequestDto,
    @CurrentUser() user: AuthUser,
    @TenantId() institutionId: string,
  ): Promise<KioskPayoutResult> {
    return this.requestKioskPayoutUseCase.execute(
      user.id,
      institutionId,
      body,
    );
  }

  @Get('balance')
  @Roles('KIOSK')
  async getKioskBalance(
    @CurrentUser() user: AuthUser,
    @TenantId() institutionId: string,
  ): Promise<WalletBalanceResult> {
    return this.getWalletBalanceUseCase.getKioskBalance(
      user.id,
      institutionId,
    );
  }
}
