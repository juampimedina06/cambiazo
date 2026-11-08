import { Inject, Injectable, HttpStatus } from '@nestjs/common';
import { DOMAIN_ERROR_CODES, type TopUpPreferenceRequestDto } from '@cambiazo/shared';
import {
  DomainException,
  TenantMismatchException,
} from '../../../../common/errors/domain.exception.js';
import {
  type ParentStudentLinkRepositoryPort,
  PARENT_STUDENT_LINK_REPOSITORY,
} from '../../../identity-parental/domain/ports/parent-student-link.repository.port.js';
import { CheckStudentConsentUseCase } from '../../../identity-parental/application/use-cases/check-student-consent.use-case.js';
import {
  type PaymentGatewayPort,
  PAYMENT_GATEWAY,
  type PreferenceResult,
} from '../../domain/ports/payment-gateway.port.js';

@Injectable()
export class CreateTopUpPreferenceUseCase {
  constructor(
    @Inject(PARENT_STUDENT_LINK_REPOSITORY)
    private readonly linkRepo: ParentStudentLinkRepositoryPort,
    private readonly checkStudentConsentUseCase: CheckStudentConsentUseCase,
    @Inject(PAYMENT_GATEWAY)
    private readonly paymentGateway: PaymentGatewayPort,
  ) {}

  async execute(
    parentUserId: string,
    institutionId: string,
    dto: TopUpPreferenceRequestDto,
    parentEmail?: string,
  ): Promise<PreferenceResult> {
    // 1. Verify parental link
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

    // 2. Verify student consent and status
    await this.checkStudentConsentUseCase.execute(dto.studentId, institutionId);

    // 3. Create 1-to-1 top-up preference with payment provider (Mercado Pago)
    const preference = await this.paymentGateway.createTopUpPreference({
      studentId: dto.studentId,
      amountCents: dto.amountCents,
      institutionId,
      parentEmail,
    });

    return preference;
  }
}
