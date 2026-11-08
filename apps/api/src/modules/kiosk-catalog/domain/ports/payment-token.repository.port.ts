import type { EphemeralPaymentToken } from '../entities/payment-token.entity.js';

export interface PaymentTokenRepositoryPort {
  save(token: EphemeralPaymentToken): Promise<void>;
  findByTokenOrCode(tokenOrCode: string): Promise<EphemeralPaymentToken | null>;
  markAsUsed(token: string): Promise<void>;
}

export const PAYMENT_TOKEN_REPOSITORY = Symbol('PAYMENT_TOKEN_REPOSITORY');
