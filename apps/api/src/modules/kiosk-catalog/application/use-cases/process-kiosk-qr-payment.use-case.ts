import { Inject, Injectable } from '@nestjs/common';
import type { ChargeQrRequestDto } from '@cambiazo/shared';
import {
  QrTokenExpiredException,
  TenantMismatchException,
  ProductNotFoundException,
  InsufficientStockException,
} from '../../../../common/errors/domain.exception.js';
import { ParentalControlsService } from '../../../identity-parental/application/services/parental-controls.service.js';
import { LedgerService } from '../../../wallet-ledger/application/services/ledger.service.js';
import {
  type CatalogProductRepositoryPort,
  CATALOG_PRODUCT_REPOSITORY,
} from '../../domain/ports/catalog-product.repository.port.js';
import {
  type PaymentTokenRepositoryPort,
  PAYMENT_TOKEN_REPOSITORY,
} from '../../domain/ports/payment-token.repository.port.js';

export interface PurchasedReceiptItem {
  productId: string;
  name: string;
  category: string;
  quantity: number;
  unitPriceCents: number;
  subtotalCents: number;
}

export interface KioskChargeReceipt {
  transactionId: string;
  studentId: string;
  kioskUserId: string;
  institutionId: string;
  items: PurchasedReceiptItem[];
  totalCents: number;
  formattedTotal: string;
  commissionCents: 0;
  idempotencyKey: string;
  status: 'APPROVED' | 'ALREADY_PROCESSED';
  timestamp: string;
}

@Injectable()
export class ProcessKioskQrPaymentUseCase {
  private readonly receiptCache = new Map<string, KioskChargeReceipt>();

  constructor(
    @Inject(CATALOG_PRODUCT_REPOSITORY)
    private readonly catalogRepo: CatalogProductRepositoryPort,
    @Inject(PAYMENT_TOKEN_REPOSITORY)
    private readonly tokenRepo: PaymentTokenRepositoryPort,
    private readonly parentalControlsService: ParentalControlsService,
    private readonly ledgerService: LedgerService,
  ) {}

  async execute(
    kioskUserId: string,
    kioskInstitutionId: string,
    dto: ChargeQrRequestDto,
  ): Promise<KioskChargeReceipt> {
    // 1. Check idempotency cache first
    const cachedReceipt = this.receiptCache.get(dto.idempotencyKey);
    if (cachedReceipt) {
      return {
        ...cachedReceipt,
        status: 'ALREADY_PROCESSED',
      };
    }

    // 2. Resolve and validate payment token
    const token = await this.tokenRepo.findByTokenOrCode(dto.paymentTokenOrCode);
    if (!token || token.isUsed || token.expiresAt < new Date()) {
      throw new QrTokenExpiredException(
        'Payment QR token is invalid, already used, or has expired (120s TTL)',
      );
    }

    // 3. Multi-tenant isolation: student and kiosk must belong to the exact same institution
    if (token.institutionId !== kioskInstitutionId) {
      throw new TenantMismatchException(
        `Cross-institution kiosk charge: student belongs to ${token.institutionId}, kiosk belongs to ${kioskInstitutionId}`,
      );
    }

    // 4. Validate products in catalog
    const resolvedItems: Array<{
      productId: string;
      name: string;
      category: any;
      quantity: number;
      priceCents: number;
    }> = [];

    for (const item of dto.items) {
      const prod = await this.catalogRepo.findById(item.productId);
      if (!prod || prod.institutionId !== kioskInstitutionId) {
        throw new ProductNotFoundException(item.productId);
      }
      if (prod.stock < item.quantity) {
        throw new InsufficientStockException(item.productId);
      }

      resolvedItems.push({
        productId: prod.id,
        name: prod.name,
        category: prod.category,
        quantity: item.quantity,
        priceCents: prod.priceCents,
      });
    }

    const totalCents = resolvedItems.reduce(
      (sum, item) => sum + item.priceCents * item.quantity,
      0,
    );

    // 5. Check parental controls: active consent, pause, category blocking & daily/weekly spending caps
    const spending = await this.ledgerService.calculateStudentSpending(
      token.studentId,
      kioskInstitutionId,
    );

    await this.parentalControlsService.validatePurchaseItemsAndLimits(
      token.studentId,
      kioskInstitutionId,
      resolvedItems,
      spending.spentTodayCents,
      spending.spentThisWeekCents,
    );

    // 6. Execute atomic double-entry ledger transaction (0% platform commission)
    const studentAccount = await this.ledgerService.getStudentAccount(
      token.studentId,
      kioskInstitutionId,
    );
    const kioskAccount = await this.ledgerService.getKioskAccount(
      kioskUserId,
      kioskInstitutionId,
    );

    const ledgerResult = await this.ledgerService.recordTransaction({
      institutionId: kioskInstitutionId,
      referenceType: 'KIOSK_PURCHASE',
      referenceId: token.token,
      idempotencyKey: dto.idempotencyKey,
      description: `Kiosk purchase of ${resolvedItems.length} item(s) by student ${token.studentId} (0% platform commission)`,
      metadata: {
        studentId: token.studentId,
        kioskUserId,
        itemCount: resolvedItems.length,
        totalCents,
      },
      entries: [
        {
          accountId: studentAccount.id,
          direction: 'DEBIT',
          amountCents: totalCents,
        },
        {
          accountId: kioskAccount.id,
          direction: 'CREDIT',
          amountCents: totalCents,
        },
      ],
    });

    // 7. Deduct stock for all products
    for (const item of resolvedItems) {
      await this.catalogRepo.deductStock(item.productId, item.quantity);
    }

    // 8. Consume token (single-use)
    await this.tokenRepo.markAsUsed(token.token);

    // 9. Build receipt
    const receiptItems: PurchasedReceiptItem[] = resolvedItems.map((item) => ({
      productId: item.productId,
      name: item.name,
      category: item.category,
      quantity: item.quantity,
      unitPriceCents: item.priceCents,
      subtotalCents: item.priceCents * item.quantity,
    }));

    const receipt: KioskChargeReceipt = {
      transactionId: ledgerResult.transaction.id,
      studentId: token.studentId,
      kioskUserId,
      institutionId: kioskInstitutionId,
      items: receiptItems,
      totalCents,
      formattedTotal: `$${(totalCents / 100).toFixed(2)}`,
      commissionCents: 0,
      idempotencyKey: dto.idempotencyKey,
      status: ledgerResult.isDuplicate ? 'ALREADY_PROCESSED' : 'APPROVED',
      timestamp: new Date().toISOString(),
    };

    this.receiptCache.set(dto.idempotencyKey, receipt);
    return receipt;
  }
}
