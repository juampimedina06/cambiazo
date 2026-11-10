import { Injectable } from '@nestjs/common';
import { MercadoPagoConfig, Preference, Payment } from 'mercadopago';
import type {
    PaymentGatewayPort,
    CreatePreferenceParams,
    PreferenceResult,
    PaymentDetails,
} from '../../domain/ports/payment-gateway.port.js';

@Injectable()
export class MercadoPagoGateway implements PaymentGatewayPort {
    private readonly client: MercadoPagoConfig;

    constructor() {
        const accessToken = process.env.MERCADO_PAGO_ACCESS_TOKEN || '';
        this.client = new MercadoPagoConfig({ accessToken });
    }

    async createTopUpPreference(params: CreatePreferenceParams): Promise<PreferenceResult> {
        const preference = new Preference(this.client);
        const amountArs = params.amountCents / 100; // Pasamos de centavos a pesos reales

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
                payer: params.parentEmail ? { email: params.parentEmail } : undefined,
                external_reference: JSON.stringify({
                    studentId: params.studentId,
                    institutionId: params.institutionId,
                    amountCents: params.amountCents,
                }),
                back_urls: {
                    success: 'cambiazo://wallet/success',
                    failure: 'cambiazo://wallet/failure',
                    pending: 'cambiazo://wallet/pending',
                },
                auto_return: 'approved',
            },
        });

        return {
            preferenceId: response.id!,
            initPoint: response.init_point || response.sandbox_init_point!,
            externalReference: response.external_reference!,
        };
    }

    async getPaymentDetails(paymentId: string): Promise<PaymentDetails | null> {
        const payment = new Payment(this.client);
        const res = await payment.get({ id: paymentId });
        if (!res) return null;

        let parsedRef = { studentId: '', institutionId: '' };
        try {
            parsedRef = JSON.parse(res.external_reference || '{}');
        } catch {
            // fallback
        }

        const status = res.status === 'approved' ? 'approved' : res.status === 'rejected' ? 'rejected' : 'pending';

        return {
            paymentId: String(res.id),
            externalReference: res.external_reference || '',
            status,
            amountCents: Math.round((res.transaction_amount || 0) * 100),
            studentId: parsedRef.studentId,
            institutionId: parsedRef.institutionId,
        };
    }
}