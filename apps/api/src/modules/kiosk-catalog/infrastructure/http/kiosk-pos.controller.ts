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
import {
  LEDGER_REPOSITORY,
  type LedgerRepositoryPort,
} from '../../../wallet-ledger/domain/ports/ledger.repository.port.js';

@Controller('api/v1/kiosk')
export class KioskPosController {
  constructor(
    private readonly processKioskQrPaymentUseCase: ProcessKioskQrPaymentUseCase,
    @Optional()
    @Inject(LEDGER_REPOSITORY)
    private readonly ledgerRepo?: LedgerRepositoryPort,
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

  @Get('sales')
  @Roles('KIOSK', 'SCHOOL_ADMIN', 'SUPER_ADMIN')
  async listSales(@TenantId() institutionId: string) {
    if (!this.ledgerRepo) {
      return [];
    }
    const txs = await this.ledgerRepo.listTransactionsByInstitution(institutionId);
    return txs
      .filter((t) => t.referenceType === 'KIOSK_PURCHASE')
      .map((t) => ({
        id: t.id,
        institutionId: t.institutionId,
        studentAlias: 'Alumno',
        items: (t.metadata?.['items'] as any[]) || [],
        totalAmountCents: (t.metadata?.['totalCents'] as number) || 0,
        status: 'COMPLETED',
        paymentMethod: 'QR_TOKEN',
        idempotencyKey: t.idempotencyKey,
        createdAt: t.createdAt.toISOString(),
      }));
  }
}
