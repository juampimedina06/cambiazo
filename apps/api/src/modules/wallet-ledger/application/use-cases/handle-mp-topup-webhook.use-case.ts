import { Inject, Injectable, Logger } from '@nestjs/common';
import type { MercadoPagoWebhookPayloadDto } from '@cambiazo/shared';
import {
  type PaymentDetails,
  type PaymentGatewayPort,
  PAYMENT_GATEWAY,
} from '../../domain/ports/payment-gateway.port.js';
import { LedgerService } from '../services/ledger.service.js';

export interface WebhookProcessingResult {
  status: 'PROCESSED' | 'ALREADY_PROCESSED' | 'IGNORED';
  transactionId?: string;
  reason?: string;
}

@Injectable()
export class HandleMpTopupWebhookUseCase {
  private readonly logger = new Logger(HandleMpTopupWebhookUseCase.name);

  constructor(
    @Inject(PAYMENT_GATEWAY)
    private readonly paymentGateway: PaymentGatewayPort,
    @Inject(LedgerService)
    private readonly ledgerService: LedgerService,
  ) {}

  async execute(payload: MercadoPagoWebhookPayloadDto): Promise<WebhookProcessingResult> {
    const paymentId = String(payload.data?.id || payload.id);
    if (!paymentId) {
      return { status: 'IGNORED', reason: 'Missing payment ID in payload' };
    }

    const idempotencyKey = `mp_webhook_${paymentId}`;

    // 1. Fetch verified payment details from payment gateway
    const paymentDetails = await this.paymentGateway.getPaymentDetails(paymentId);
    if (!paymentDetails) {
      this.logger.warn(`Payment details not found for ID: ${paymentId}`);
      return { status: 'IGNORED', reason: `Payment details not found for ID: ${paymentId}` };
    }

    if (paymentDetails.status !== 'approved') {
      return {
        status: 'IGNORED',
        reason: `Payment status is ${paymentDetails.status}, required: approved`,
      };
    }

    return this.creditFromPaymentDetails(paymentDetails);
  }

  async creditFromPaymentDetails(
    paymentDetails: PaymentDetails,
  ): Promise<WebhookProcessingResult> {
    if (paymentDetails.status !== 'approved') {
      return {
        status: 'IGNORED',
        reason: `Payment status is ${paymentDetails.status}, required: approved`,
      };
    }

    const paymentId = paymentDetails.paymentId;
    const idempotencyKey = `mp_webhook_${paymentId}`;

    // Resolve accounts
    const studentAccount = await this.ledgerService.getStudentAccount(
      paymentDetails.studentId,
      paymentDetails.institutionId,
    );

    const clearingAccount = await this.ledgerService.getPlatformClearingAccount(
      paymentDetails.institutionId,
    );

    // Execute double-entry transaction: DEBIT PLATFORM_CLEARING / CREDIT STUDENT_ALLOCATION
    const result = await this.ledgerService.recordTransaction({
      institutionId: paymentDetails.institutionId,
      referenceType: 'TOP_UP',
      referenceId: paymentId,
      idempotencyKey,
      description: `1-to-1 top-up for student ${paymentDetails.studentId} via Mercado Pago (Payment ID: ${paymentId})`,
      metadata: {
        paymentId,
        externalReference: paymentDetails.externalReference,
        amountCents: paymentDetails.amountCents,
      },
      entries: [
        {
          accountId: clearingAccount.id,
          direction: 'DEBIT',
          amountCents: paymentDetails.amountCents,
        },
        {
          accountId: studentAccount.id,
          direction: 'CREDIT',
          amountCents: paymentDetails.amountCents,
        },
      ],
    });

    if (result.isDuplicate) {
      return {
        status: 'ALREADY_PROCESSED',
        transactionId: result.transaction.id,
      };
    }

    return {
      status: 'PROCESSED',
      transactionId: result.transaction.id,
    };
  }
}
