import {
  type ChargeQrRequestDto,
  type ProductCategory,
  type QrPaymentTokenDto,
} from '@cambiazo/shared';
import type { ApiAuthContext } from '../../api/cambiazoApi';

export interface CatalogProduct {
  id: string;
  institutionId: string;
  name: string;
  category: ProductCategory;
  priceCents: number;
  stock: number;
  isActive: boolean;
  icon: string;
}

export interface QrTokenRecord {
  token: string;
  studentId: string;
  institutionId: string;
  expiresAt: string;
  backupCode: string;
}

export interface GenerateQrTokenResult {
  success: boolean;
  qrToken?: QrPaymentTokenDto;
  backupCode?: string;
  expiresInSeconds?: number;
  error?: string;
}

export interface ChargeQrPaymentResult {
  success: boolean;
  chargeId?: string;
  totalChargedCents?: number;
  studentId?: string;
  studentName?: string;
  remainingDailyLimitCents?: number;
  itemsSummary?: string;
  error?: string;
}

export interface KioskApiOptions {
  auth?: ApiAuthContext;
  itemsSummary?: string;
}

export type { ChargeQrRequestDto, QrPaymentTokenDto };

