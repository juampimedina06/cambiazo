import { Inject, Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { QR_PAYMENT_TOKEN_TTL_SECONDS } from '@cambiazo/shared';
import { ParentalControlsService } from '../../../identity-parental/application/services/parental-controls.service.js';
import {
  type PaymentTokenRepositoryPort,
  PAYMENT_TOKEN_REPOSITORY,
} from '../../domain/ports/payment-token.repository.port.js';
import type { EphemeralPaymentToken } from '../../domain/entities/payment-token.entity.js';

export interface GeneratedQrTokenResult {
  token: string;
  code: string;
  studentId: string;
  institutionId: string;
  expiresAt: string;
}

@Injectable()
export class GenerateStudentPaymentTokenUseCase {
  constructor(
    @Inject(ParentalControlsService)
    private readonly parentalControlsService: ParentalControlsService,
    @Inject(PAYMENT_TOKEN_REPOSITORY)
    private readonly tokenRepo: PaymentTokenRepositoryPort,
  ) {}

  async execute(
    studentId: string,
    institutionId: string,
  ): Promise<GeneratedQrTokenResult> {
    // 1. Validate student eligibility (consent + active/unpaused status)
    await this.parentalControlsService.validateStudentEligibility(
      studentId,
      institutionId,
    );

    // 2. Generate token and 6-digit numeric backup code
    const token = `qr_${randomUUID()}`;
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + QR_PAYMENT_TOKEN_TTL_SECONDS * 1000);

    const paymentToken: EphemeralPaymentToken = {
      token,
      code,
      studentId,
      institutionId,
      expiresAt,
      isUsed: false,
      createdAt: new Date(),
    };

    await this.tokenRepo.save(paymentToken);

    return {
      token,
      code,
      studentId,
      institutionId,
      expiresAt: expiresAt.toISOString(),
    };
  }
}
