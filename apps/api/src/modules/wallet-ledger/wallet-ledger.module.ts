import { Module, forwardRef } from '@nestjs/common';
import { LEDGER_REPOSITORY } from './domain/ports/ledger.repository.port.js';
import { PAYMENT_GATEWAY } from './domain/ports/payment-gateway.port.js';
import { InMemoryLedgerRepository } from './infrastructure/persistence/in-memory-ledger.repository.js';
import { MercadoPagoMockGateway } from './infrastructure/gateways/mercadopago-mock.gateway.js';
import { LedgerService } from './application/services/ledger.service.js';
import { CreateTopUpPreferenceUseCase } from './application/use-cases/create-top-up-preference.use-case.js';
import { HandleMpTopupWebhookUseCase } from './application/use-cases/handle-mp-topup-webhook.use-case.js';
import { RequestKioskPayoutUseCase } from './application/use-cases/request-kiosk-payout.use-case.js';
import { GetWalletBalanceUseCase } from './application/use-cases/get-wallet-balance.use-case.js';
import { WalletController } from './infrastructure/http/wallet.controller.js';
import { WebhooksController } from './infrastructure/http/webhooks.controller.js';
import { KioskPayoutsController } from './infrastructure/http/kiosk-payouts.controller.js';
import { IdentityParentalModule } from '../identity-parental/identity-parental.module.js';

@Module({
  imports: [forwardRef(() => IdentityParentalModule)],
  controllers: [WalletController, WebhooksController, KioskPayoutsController],
  providers: [
    {
      provide: LEDGER_REPOSITORY,
      useClass: InMemoryLedgerRepository,
    },
    {
      provide: PAYMENT_GATEWAY,
      useClass: MercadoPagoMockGateway,
    },
    InMemoryLedgerRepository,
    MercadoPagoMockGateway,
    LedgerService,
    CreateTopUpPreferenceUseCase,
    HandleMpTopupWebhookUseCase,
    RequestKioskPayoutUseCase,
    GetWalletBalanceUseCase,
  ],
  exports: [
    LEDGER_REPOSITORY,
    PAYMENT_GATEWAY,
    InMemoryLedgerRepository,
    MercadoPagoMockGateway,
    LedgerService,
    CreateTopUpPreferenceUseCase,
    HandleMpTopupWebhookUseCase,
    RequestKioskPayoutUseCase,
    GetWalletBalanceUseCase,
  ],
})
export class WalletLedgerModule {}
