import {
  ChargeQrRequestSchema,
  type ChargeQrRequestDto,
  type ProductCategory,
  type QrPaymentTokenDto,
} from '@cambiazo/shared';
import {
  cambiazoApi,
  extractApiErrorMessage,
} from '../../api/cambiazoApi';
import type {
  CatalogProduct,
  ChargeQrPaymentResult,
  GenerateQrTokenResult,
  KioskApiOptions,
} from '../interface/kiosk.interface';

interface BackendProductDto {
  id: string;
  institutionId?: string;
  name: string;
  category: ProductCategory;
  priceCents: number;
  stock?: number;
  isActive?: boolean;
  icon?: string;
}

interface BackendPaymentTokenDto {
  token?: string;
  ephemeralToken?: string;
  qrPayload?: string;
  code?: string;
  backupCode?: string;
  institutionId?: string;
  expiresAt: string;
  expiresInSeconds?: number;
}

interface BackendChargeResponseDto {
  transactionId?: string;
  totalCents?: number;
  totalAmountCents?: number;
  studentId?: string;
  studentName?: string;
  remainingDailyLimitCents?: number;
}

export async function fetchCatalogProductsAction(
  institutionId?: string,
  options?: KioskApiOptions
): Promise<CatalogProduct[]> {
  try {
    const response = await cambiazoApi.get<BackendProductDto[]>(
      '/kiosk/products',
      {
        auth: {
          role: 'KIOSK',
          userId: options?.auth?.userId || 'kiosk-user-1',
          institutionId: institutionId || options?.auth?.institutionId,
        },
      }
    );

    if (!Array.isArray(response)) return [];
    return response
      .map((p) => ({
        id: p.id,
        institutionId: p.institutionId || institutionId || '',
        name: p.name,
        category: p.category,
        priceCents: p.priceCents,
        stock: p.stock ?? 10,
        isActive: p.isActive ?? true,
        icon: p.icon || 'package',
      }))
      .filter((p) => p.isActive);
  } catch {
    return [];
  }
}

export async function generateQrPaymentTokenAction(
  studentId: string,
  options?: KioskApiOptions
): Promise<GenerateQrTokenResult> {
  try {
    const response = await cambiazoApi.post<BackendPaymentTokenDto>(
      '/student/payment-token',
      undefined,
      {
        auth: {
          role: 'STUDENT',
          userId: studentId,
          ...options?.auth,
        },
      },
      'Error al generar código QR'
    );

    const token =
      response.token || response.ephemeralToken || response.qrPayload || '';
    const backupCode = response.code || response.backupCode || '';
    const resolvedInstitutionId =
      response.institutionId || options?.auth?.institutionId || '';

    const qrToken: QrPaymentTokenDto = {
      token,
      studentId,
      institutionId: resolvedInstitutionId,
      expiresAt: response.expiresAt,
    };

    return {
      success: true,
      qrToken,
      backupCode,
      expiresInSeconds: response.expiresInSeconds || 120,
    };
  } catch (error) {
    return {
      success: false,
      error: extractApiErrorMessage(error, 'Error al generar código QR'),
    };
  }
}

export async function chargeQrPaymentAction(
  input: ChargeQrRequestDto,
  options?: KioskApiOptions
): Promise<ChargeQrPaymentResult> {
  const validation = ChargeQrRequestSchema.safeParse(input);
  if (!validation.success) {
    return {
      success: false,
      error: validation.error.errors[0]?.message || 'Solicitud de cobro inválida',
    };
  }

  try {
    const response = await cambiazoApi.post<BackendChargeResponseDto>(
      '/kiosk/charge',
      validation.data,
      {
        auth: {
          role: 'KIOSK',
          userId: options?.auth?.userId || 'kiosk-user-1',
          institutionId: options?.auth?.institutionId,
        },
      },
      'Error al procesar cobro'
    );

    const totalChargedCents =
      response.totalCents ?? response.totalAmountCents ?? 0;

    return {
      success: true,
      chargeId: response.transactionId,
      totalChargedCents,
      studentId: response.studentId,
      studentName: response.studentName || 'Alumno',
      remainingDailyLimitCents: response.remainingDailyLimitCents ?? 0,
      itemsSummary:
        options?.itemsSummary ||
        `${validation.data.items.length} artículo(s) en Kiosco`,
    };
  } catch (error) {
    return {
      success: false,
      error: extractApiErrorMessage(error, 'Error al procesar cobro'),
    };
  }
}

