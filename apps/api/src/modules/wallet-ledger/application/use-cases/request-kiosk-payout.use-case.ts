import { Injectable } from '@nestjs/common';
import type { KioskWithdrawalRequestDto } from '@cambiazo/shared';
import { LedgerService } from '../services/ledger.service.js';

export interface KioskPayoutResult {
  withdrawalId: string;
  amountCents: number;
  destination: string;
  commissionCents: 0;
  netPayoutCents: number;
  status: 'PROCESSED' | 'ALREADY_PROCESSED';
}

@Injectable()
export class RequestKioskPayoutUseCase {
  constructor(private readonly ledgerService: LedgerService) {}

  async execute(
    kioskUserId: string,
    institutionId: string,
    dto: KioskWithdrawalRequestDto,
  ): Promise<KioskPayoutResult> {
    const kioskAccount = await this.ledgerService.getKioskAccount(
      kioskUserId,
      institutionId,
    );

    const clearingAccount = await this.ledgerService.getPlatformClearingAccount(
      institutionId,
    );

    // Record double-entry withdrawal: DEBIT KIOSK_BALANCE / CREDIT PLATFORM_CLEARING
    // 0% platform commission: entire amount is transferred to kiosk owner
    const result = await this.ledgerService.recordTransaction({
      institutionId,
      referenceType: 'KIOSK_WITHDRAWAL',
      idempotencyKey: dto.idempotencyKey,
      description: `Kiosk withdrawal of $${(dto.amountCents / 100).toFixed(2)} to ${dto.mercadoPagoAliasOrCvu} (0% platform commission)`,
      metadata: {
        destinationAliasOrCvu: dto.mercadoPagoAliasOrCvu,
        kioskUserId,
      },
      entries: [
        {
          accountId: kioskAccount.id,
          direction: 'DEBIT',
          amountCents: dto.amountCents,
        },
        {
          accountId: clearingAccount.id,
          direction: 'CREDIT',
          amountCents: dto.amountCents,
        },
      ],
    });

    return {
      withdrawalId: result.transaction.id,
      amountCents: dto.amountCents,
      destination: dto.mercadoPagoAliasOrCvu,
      commissionCents: 0,
      netPayoutCents: dto.amountCents,
      status: result.isDuplicate ? 'ALREADY_PROCESSED' : 'PROCESSED',
    };
  }
}
