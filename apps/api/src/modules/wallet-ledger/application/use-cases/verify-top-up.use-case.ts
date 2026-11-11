import { Inject, Injectable, HttpStatus } from '@nestjs/common';
import {
  DOMAIN_ERROR_CODES,
  type VerifyTopUpRequestDto,
} from '@cambiazo/shared';
import {
  DomainException,
  TenantMismatchException,
} from '../../../../common/errors/domain.exception.js';
import {
  type ParentStudentLinkRepositoryPort,
  PARENT_STUDENT_LINK_REPOSITORY,
} from '../../../identity-parental/domain/ports/parent-student-link.repository.port.js';
import {
  type PaymentGatewayPort,
  PAYMENT_GATEWAY,
} from '../../domain/ports/payment-gateway.port.js';
import { LedgerService } from '../services/ledger.service.js';
import { HandleMpTopupWebhookUseCase } from './handle-mp-topup-webhook.use-case.js';

export interface VerifyTopUpResult {
  status: 'APPROVED' | 'PENDING';
  credited: boolean;
  balanceCents?: number;
  transactionId?: string;
}

@Injectable()
export class VerifyTopUpUseCase {
  constructor(
    @Inject(PARENT_STUDENT_LINK_REPOSITORY)
    private readonly linkRepo: ParentStudentLinkRepositoryPort,
    @Inject(PAYMENT_GATEWAY)
    private readonly paymentGateway: PaymentGatewayPort,
    @Inject(HandleMpTopupWebhookUseCase)
    private readonly handleMpTopupWebhookUseCase: HandleMpTopupWebhookUseCase,
    @Inject(LedgerService)
    private readonly ledgerService: LedgerService,
  ) {}

  async execute(
    parentUserId: string,
    institutionId: string,
    dto: VerifyTopUpRequestDto,
  ): Promise<VerifyTopUpResult> {
    const link = await this.linkRepo.findLink(
      institutionId,
      parentUserId,
      dto.studentId,
    );
    if (!link) {
      throw new DomainException(
        DOMAIN_ERROR_CODES.STUDENT_NOT_LINKED_TO_PARENT,
        'Parent is not linked to this student',
        HttpStatus.FORBIDDEN,
      );
    }

    let paymentDetails =
      await this.paymentGateway.findApprovedPaymentByExternalReference(
        dto.externalReference,
      );

    if (!paymentDetails && dto.preferenceId) {
      const byPref = await this.paymentGateway.getPaymentDetails(
        dto.preferenceId,
      );
      if (byPref && byPref.status === 'approved') {
        paymentDetails = byPref;
      }
    }

    if (!paymentDetails || paymentDetails.status !== 'approved') {
      return {
        status: 'PENDING',
        credited: false,
      };
    }

    if (
      paymentDetails.studentId !== dto.studentId ||
      paymentDetails.institutionId !== institutionId
    ) {
      throw new TenantMismatchException(
        'Payment external_reference does not match target student or institution',
      );
    }

    const creditResult =
      await this.handleMpTopupWebhookUseCase.creditFromPaymentDetails(
        paymentDetails,
      );

    const account = await this.ledgerService.getStudentAccount(
      dto.studentId,
      institutionId,
    );

    return {
      status: 'APPROVED',
      credited: creditResult.status !== 'IGNORED',
      balanceCents: account.balanceCents,
      transactionId: creditResult.transactionId,
    };
  }
}
