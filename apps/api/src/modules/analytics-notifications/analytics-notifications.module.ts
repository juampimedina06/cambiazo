import { Module, forwardRef } from '@nestjs/common';
import { BLOCKED_PURCHASE_REPOSITORY } from './domain/ports/blocked-purchase.repository.port.js';
import { InMemoryBlockedPurchaseRepository } from './infrastructure/persistence/in-memory-blocked-purchase.repository.js';
import { WeeklySummaryService } from './application/services/weekly-summary.service.js';
import { WeeklySummaryWorker } from './application/workers/weekly-summary.worker.js';
import { ParentWeeklySummaryController } from './infrastructure/http/parent-weekly-summary.controller.js';
import { WalletLedgerModule } from '../wallet-ledger/wallet-ledger.module.js';
import { CommunityExchangeModule } from '../community-exchange/community-exchange.module.js';
import { IdentityParentalModule } from '../identity-parental/identity-parental.module.js';

@Module({
  imports: [
    forwardRef(() => WalletLedgerModule),
    forwardRef(() => CommunityExchangeModule),
    forwardRef(() => IdentityParentalModule),
  ],
  controllers: [ParentWeeklySummaryController],
  providers: [
    InMemoryBlockedPurchaseRepository,
    {
      provide: BLOCKED_PURCHASE_REPOSITORY,
      useExisting: InMemoryBlockedPurchaseRepository,
    },
    WeeklySummaryService,
    WeeklySummaryWorker,
  ],
  exports: [
    BLOCKED_PURCHASE_REPOSITORY,
    InMemoryBlockedPurchaseRepository,
    WeeklySummaryService,
    WeeklySummaryWorker,
  ],
})
export class AnalyticsNotificationsModule {}
