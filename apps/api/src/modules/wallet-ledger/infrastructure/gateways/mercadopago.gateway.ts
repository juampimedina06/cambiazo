import { Injectable, Logger } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { MercadoPagoConfig, Preference, Payment } from 'mercadopago';
import type {
  PaymentGatewayPort,
  CreatePreferenceParams,
  PreferenceResult,
  PaymentDetails,
} from '../../domain/ports/payment-gateway.port.js';

@Injectable()
export class MercadoPagoGateway implements PaymentGatewayPort {
  private readonly logger = new Logger(MercadoPagoGateway.name);

  private getClient(): MercadoPagoConfig {
    const accessToken = process.env.MERCADO_PAGO_ACCESS_TOKEN || '';
    return new MercadoPagoConfig({ accessToken });
  }

  private isSandboxMode(): boolean {
    return process.env.MERCADO_PAGO_SANDBOX !== 'false';
  }

  private parseExternalReference(raw?: string): {
    studentId: string;
    institutionId: string;
  } {
    if (!raw) return { studentId: '', institutionId: '' };
    try {
      const parsed = JSON.parse(raw) as {
        studentId?: string;
        institutionId?: string;
      };
      return {
        studentId: parsed.studentId || '',
        institutionId: parsed.institutionId || '',
      };
    } catch {
      return { studentId: '', institutionId: '' };
    }
  }

  private mapPaymentRecord(raw: {
    id?: string | number;
    status?: string;
    external_reference?: string;
    transaction_amount?: number;
  }): PaymentDetails {
    const parsedRef = this.parseExternalReference(raw.external_reference);
    const status: PaymentDetails['status'] =
      raw.status === 'approved'
        ? 'approved'
        : raw.status === 'rejected'
          ? 'rejected'
          : 'pending';

    return {
      paymentId: String(raw.id || ''),
      externalReference: raw.external_reference || '',
      status,
      amountCents: Math.round((raw.transaction_amount || 0) * 100),
      studentId: parsedRef.studentId,
      institutionId: parsedRef.institutionId,
    };
  }

  async createTopUpPreference(
    params: CreatePreferenceParams,
  ): Promise<PreferenceResult> {
    const preference = new Preference(this.getClient());
    const useSandbox = this.isSandboxMode();
    const amountArs = params.amountCents / 100;
    const externalReference = JSON.stringify({
      topupId: randomUUID(),
      studentId: params.studentId,
      institutionId: params.institutionId,
      amountCents: params.amountCents,
    });

    const backUrlBase = process.env.MERCADO_PAGO_BACK_URL_BASE?.trim();
    const hasHttpBackUrls =
      Boolean(backUrlBase) && /^https?:\/\//i.test(backUrlBase!);
    const backUrls = hasHttpBackUrls
      ? {
          success: `${backUrlBase!.replace(/\/$/, '')}/wallet/success`,
          failure: `${backUrlBase!.replace(/\/$/, '')}/wallet/failure`,
          pending: `${backUrlBase!.replace(/\/$/, '')}/wallet/pending`,
        }
      : {
          success: 'cambiazo://wallet/success',
          failure: 'cambiazo://wallet/failure',
          pending: 'cambiazo://wallet/pending',
        };

    const webhookUrl = process.env.MERCADO_PAGO_WEBHOOK_URL?.trim();
    const notificationUrl =
      webhookUrl && /^https?:\/\//i.test(webhookUrl) ? webhookUrl : undefined;

    const shouldSendPayerEmail =
      !useSandbox &&
      Boolean(params.parentEmail) &&
      !params.parentEmail!.endsWith('.internal');

    const response = await preference.create({
      body: {
        items: [
          {
            id: `topup_${params.studentId}`,
            title: 'Recarga Saldo Kiosco Escolar (Cambiazo)',
            unit_price: amountArs,
            quantity: 1,
            currency_id: 'ARS',
          },
        ],
        payer: shouldSendPayerEmail ? { email: params.parentEmail } : undefined,
        external_reference: externalReference,
        back_urls: backUrls,
        ...(hasHttpBackUrls ? { auto_return: 'approved' as const } : {}),
        ...(notificationUrl ? { notification_url: notificationUrl } : {}),
      },
    });

    const initPoint = useSandbox
      ? response.sandbox_init_point || response.init_point!
      : response.init_point || response.sandbox_init_point!;

    return {
      preferenceId: response.id!,
      initPoint,
      externalReference: response.external_reference || externalReference,
      sandboxMode: useSandbox,
    };
  }

  async getPaymentDetails(paymentId: string): Promise<PaymentDetails | null> {
    try {
      const payment = new Payment(this.getClient());
      const res = await payment.get({ id: paymentId });
      if (!res) return null;
      return this.mapPaymentRecord(res);
    } catch (error) {
      this.logger.warn(
        `Unable to fetch Mercado Pago payment ${paymentId}: ${error instanceof Error ? error.message : String(error)}`,
      );
      return null;
    }
  }

  async findApprovedPaymentByExternalReference(
    externalReference: string,
  ): Promise<PaymentDetails | null> {
    try {
      const payment = new Payment(this.getClient());
      const searchRes = await payment.search({
        options: {
          external_reference: externalReference,
          sort: 'date_created',
          criteria: 'desc',
        },
      });
      const results = searchRes.results || [];
      const approved = results.find((item) => item.status === 'approved');
      return approved ? this.mapPaymentRecord(approved) : null;
    } catch (error) {
      this.logger.warn(
        `Unable to search Mercado Pago payment by external_reference: ${error instanceof Error ? error.message : String(error)}`,
      );
      return null;
    }
  }
}
