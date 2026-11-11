import { Module } from '@nestjs/common';
import { APP_FILTER, APP_GUARD } from '@nestjs/core';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { TenantsModule } from './modules/tenants/tenants.module.js';
import { IdentityParentalModule } from './modules/identity-parental/identity-parental.module.js';
import { WalletLedgerModule } from './modules/wallet-ledger/wallet-ledger.module.js';
import { KioskCatalogModule } from './modules/kiosk-catalog/kiosk-catalog.module.js';
import { CommunityExchangeModule } from './modules/community-exchange/community-exchange.module.js';
import { AnalyticsNotificationsModule } from './modules/analytics-notifications/analytics-notifications.module.js';
import { FilesModule } from './modules/files/files.module.js';
import { DomainExceptionFilter } from './common/filters/domain-exception.filter.js';
import { AuthGuard } from './common/auth/auth.guard.js';
import { RolesGuard } from './common/auth/roles.guard.js';
import { TenantGuard } from './common/tenant/tenant.guard.js';

@Module({
  imports: [
    TenantsModule,
    IdentityParentalModule,
    WalletLedgerModule,
    KioskCatalogModule,
    CommunityExchangeModule,
    AnalyticsNotificationsModule,
    FilesModule,
  ],


  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_FILTER,
      useClass: DomainExceptionFilter,
    },
    {
      provide: APP_GUARD,
      useClass: AuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
    {
      provide: APP_GUARD,
      useClass: TenantGuard,
    },
  ],
})
export class AppModule {}
