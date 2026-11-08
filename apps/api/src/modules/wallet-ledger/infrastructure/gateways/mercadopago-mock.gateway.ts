import { Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import type {
  PaymentGatewayPort,
  CreatePreferenceParams,
  PreferenceResult,
  PaymentDetails,
} from '../../domain/ports/payment-gateway.port.js';

@Injectable()
export class MercadoPagoMockGateway implements PaymentGatewayPort {
  private readonly preferences = new Map<string, PreferenceResult & CreatePreferenceParams>();
  private readonly payments = new Map<string, PaymentDetails>();

  async createTopUpPreference(params: CreatePreferenceParams): Promise<PreferenceResult> {
    const preferenceId = `pref_${randomUUID()}`;
    const externalReference = `ext_${randomUUID()}`;
    const initPoint = `https://sandbox.mercadopago.com.ar/checkout/v1/redirect?pref_id=${preferenceId}`;

    const result: PreferenceResult = {
      preferenceId,
      initPoint,
      externalReference,
    };

    this.preferences.set(preferenceId, { ...params, ...result });

    // Pre-populate mock payment so webhook can resolve it immediately in tests/dev
    this.payments.set(preferenceId, {
      paymentId: preferenceId,
      externalReference,
      status: 'approved',
      amountCents: params.amountCents,
      studentId: params.studentId,
      institutionId: params.institutionId,
    });

    return result;
  }

  async getPaymentDetails(paymentId: string): Promise<PaymentDetails | null> {
    const payment = this.payments.get(paymentId);
    return payment ? { ...payment } : null;
  }

  // Helper for tests to register an arbitrary approved payment
  registerMockPayment(details: PaymentDetails): void {
    this.payments.set(details.paymentId, { ...details });
  }

  clear(): void {
    this.preferences.clear();
    this.payments.clear();
  }
}
