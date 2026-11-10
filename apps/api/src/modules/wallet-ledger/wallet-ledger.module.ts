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

import { SAVINGS_GOAL_REPOSITORY } from './domain/ports/savings-goal.repository.port.js';
import { InMemorySavingsGoalRepository } from './infrastructure/persistence/in-memory-savings-goal.repository.js';
import { SavingsGoalService } from './application/services/savings-goal.service.js';
import { SavingsGoalsController } from './infrastructure/http/savings-goals.controller.js';

@Module({
  imports: [forwardRef(() => IdentityParentalModule)],
  controllers: [
    WalletController,
    WebhooksController,
    KioskPayoutsController,
    SavingsGoalsController,
  ],
  providers: [
    InMemoryLedgerRepository,
    InMemorySavingsGoalRepository,
    MercadoPagoMockGateway,
    {
      provide: LEDGER_REPOSITORY,
      useExisting: InMemoryLedgerRepository,
    },
    {
      provide: PAYMENT_GATEWAY,
      useExisting: MercadoPagoMockGateway,
    },
    {
      provide: SAVINGS_GOAL_REPOSITORY,
      useExisting: InMemorySavingsGoalRepository,
    },
    LedgerService,
    SavingsGoalService,
    CreateTopUpPreferenceUseCase,
    HandleMpTopupWebhookUseCase,
    RequestKioskPayoutUseCase,
    GetWalletBalanceUseCase,
  ],
  exports: [
    LEDGER_REPOSITORY,
    PAYMENT_GATEWAY,
    SAVINGS_GOAL_REPOSITORY,
    InMemoryLedgerRepository,
    InMemorySavingsGoalRepository,
    MercadoPagoMockGateway,
    LedgerService,
    SavingsGoalService,
    CreateTopUpPreferenceUseCase,
    HandleMpTopupWebhookUseCase,
    RequestKioskPayoutUseCase,
    GetWalletBalanceUseCase,
  ],
})
export class WalletLedgerModule { }

