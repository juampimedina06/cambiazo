import { Module, forwardRef } from '@nestjs/common';
import { CATALOG_PRODUCT_REPOSITORY } from './domain/ports/catalog-product.repository.port.js';
import { PAYMENT_TOKEN_REPOSITORY } from './domain/ports/payment-token.repository.port.js';
import { InMemoryCatalogProductRepository } from './infrastructure/persistence/in-memory-catalog-product.repository.js';
import { InMemoryPaymentTokenRepository } from './infrastructure/persistence/in-memory-payment-token.repository.js';
import { CreateCatalogProductUseCase } from './application/use-cases/create-catalog-product.use-case.js';
import { ListCatalogProductsUseCase } from './application/use-cases/list-catalog-products.use-case.js';
import { GenerateStudentPaymentTokenUseCase } from './application/use-cases/generate-student-payment-token.use-case.js';
import { ProcessKioskQrPaymentUseCase } from './application/use-cases/process-kiosk-qr-payment.use-case.js';
import { KioskCatalogController } from './infrastructure/http/kiosk-catalog.controller.js';
import { StudentPaymentController } from './infrastructure/http/student-payment.controller.js';
import { KioskPosController } from './infrastructure/http/kiosk-pos.controller.js';
import { IdentityParentalModule } from '../identity-parental/identity-parental.module.js';
import { WalletLedgerModule } from '../wallet-ledger/wallet-ledger.module.js';
import { AnalyticsNotificationsModule } from '../analytics-notifications/analytics-notifications.module.js';

@Module({
  imports: [
    forwardRef(() => IdentityParentalModule),
    forwardRef(() => WalletLedgerModule),
    forwardRef(() => AnalyticsNotificationsModule),
  ],

  controllers: [
    KioskCatalogController,
    StudentPaymentController,
    KioskPosController,
  ],
  providers: [
    {
      provide: CATALOG_PRODUCT_REPOSITORY,
      useClass: InMemoryCatalogProductRepository,
    },
    {
      provide: PAYMENT_TOKEN_REPOSITORY,
      useClass: InMemoryPaymentTokenRepository,
    },
    InMemoryCatalogProductRepository,
    InMemoryPaymentTokenRepository,
    CreateCatalogProductUseCase,
    ListCatalogProductsUseCase,
    GenerateStudentPaymentTokenUseCase,
    ProcessKioskQrPaymentUseCase,
  ],
  exports: [
    CATALOG_PRODUCT_REPOSITORY,
    PAYMENT_TOKEN_REPOSITORY,
    InMemoryCatalogProductRepository,
    InMemoryPaymentTokenRepository,
    CreateCatalogProductUseCase,
    ListCatalogProductsUseCase,
    GenerateStudentPaymentTokenUseCase,
    ProcessKioskQrPaymentUseCase,
  ],
})
export class KioskCatalogModule {}
