export interface CreatePreferenceParams {
  studentId: string;
  amountCents: number;
  institutionId: string;
  parentEmail?: string;
}

export interface PreferenceResult {
  preferenceId: string;
  initPoint: string;
  externalReference: string;
  sandboxMode?: boolean;
}

export interface PaymentDetails {
  paymentId: string;
  externalReference: string;
  status: 'approved' | 'pending' | 'rejected';
  amountCents: number;
  studentId: string;
  institutionId: string;
}

export interface PaymentGatewayPort {
  createTopUpPreference(params: CreatePreferenceParams): Promise<PreferenceResult>;
  getPaymentDetails(paymentId: string): Promise<PaymentDetails | null>;
  findApprovedPaymentByExternalReference(
    externalReference: string,
  ): Promise<PaymentDetails | null>;
}

export const PAYMENT_GATEWAY = Symbol('PAYMENT_GATEWAY');
