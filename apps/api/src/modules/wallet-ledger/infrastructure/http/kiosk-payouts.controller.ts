import {
  Controller,
  Post,
  Get,
  Body,
  Inject,
  Optional,
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
import {
  LEDGER_REPOSITORY,
  type LedgerRepositoryPort,
} from '../../domain/ports/ledger.repository.port.js';

@Controller('api/v1/kiosk')
export class KioskPayoutsController {
  constructor(
    private readonly requestKioskPayoutUseCase: RequestKioskPayoutUseCase,
    private readonly getWalletBalanceUseCase: GetWalletBalanceUseCase,
    @Optional()
    @Inject(LEDGER_REPOSITORY)
    private readonly ledgerRepo?: LedgerRepositoryPort,
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

  @Get('withdrawals')
  @Roles('KIOSK', 'SCHOOL_ADMIN', 'SUPER_ADMIN')
  async listWithdrawals(@TenantId() institutionId: string) {
    if (!this.ledgerRepo) {
      return [];
    }
    const txs = await this.ledgerRepo.listTransactionsByInstitution(institutionId);
    return txs
      .filter((t) => t.referenceType === 'KIOSK_WITHDRAWAL')
      .map((t) => ({
        id: t.id,
        institutionId: t.institutionId,
        amountCents: Number(t.description.match(/\$([\d.]+)/)?.[1] || 0) * 100,
        mercadoPagoAliasOrCvu: (t.metadata?.['destinationAliasOrCvu'] as string) || '',
        commissionCents: 0,
        netTransferredCents: Number(t.description.match(/\$([\d.]+)/)?.[1] || 0) * 100,
        status: 'TRANSFERRED',
        idempotencyKey: t.idempotencyKey,
        createdAt: t.createdAt.toISOString(),
      }));
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

  @Get('ledger-balance')
  @Roles('KIOSK', 'SCHOOL_ADMIN', 'SUPER_ADMIN')
  async getKioskLedgerBalance(
    @CurrentUser() user: AuthUser,
    @TenantId() institutionId: string,
  ) {
    const bal = await this.getWalletBalanceUseCase.getKioskBalance(
      user.id === 'admin-web-user' ? 'kiosk-user-1' : user.id,
      institutionId,
    );
    return {
      institutionId,
      availableBalanceCents: bal.balanceCents,
      totalHistoricalSalesCents: bal.balanceCents,
      totalWithdrawnCents: 0,
      platformCommissionRate: 0 as const,
    };
  }
}
