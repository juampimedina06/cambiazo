import { Module, forwardRef } from '@nestjs/common';
import { EXCHANGE_ITEM_REPOSITORY } from './domain/ports/exchange-item.repository.port.js';
import { COMMUNITY_POINTS_REPOSITORY } from './domain/ports/community-points.repository.port.js';
import { SCHOOL_REWARD_REPOSITORY } from './domain/ports/school-reward.repository.port.js';
import { REWARD_REDEMPTION_REPOSITORY } from './domain/ports/reward-redemption.repository.port.js';
import { InMemoryExchangeItemRepository } from './infrastructure/persistence/in-memory-exchange-item.repository.js';
import { InMemoryCommunityPointsRepository } from './infrastructure/persistence/in-memory-community-points.repository.js';
import { InMemorySchoolRewardRepository } from './infrastructure/persistence/in-memory-school-reward.repository.js';
import { InMemoryRewardRedemptionRepository } from './infrastructure/persistence/in-memory-reward-redemption.repository.js';
import { CommunityService } from './application/services/community.service.js';
import { CommunityController } from './infrastructure/http/community.controller.js';
import { IdentityParentalModule } from '../identity-parental/identity-parental.module.js';

@Module({
  imports: [forwardRef(() => IdentityParentalModule)],
  controllers: [CommunityController],
  providers: [
    InMemoryExchangeItemRepository,
    InMemoryCommunityPointsRepository,
    InMemorySchoolRewardRepository,
    InMemoryRewardRedemptionRepository,
    {
      provide: EXCHANGE_ITEM_REPOSITORY,
      useExisting: InMemoryExchangeItemRepository,
    },
    {
      provide: COMMUNITY_POINTS_REPOSITORY,
      useExisting: InMemoryCommunityPointsRepository,
    },
    {
      provide: SCHOOL_REWARD_REPOSITORY,
      useExisting: InMemorySchoolRewardRepository,
    },
    {
      provide: REWARD_REDEMPTION_REPOSITORY,
      useExisting: InMemoryRewardRedemptionRepository,
    },
    CommunityService,
  ],
  exports: [
    EXCHANGE_ITEM_REPOSITORY,
    COMMUNITY_POINTS_REPOSITORY,
    SCHOOL_REWARD_REPOSITORY,
    REWARD_REDEMPTION_REPOSITORY,
    InMemoryExchangeItemRepository,
    InMemoryCommunityPointsRepository,
    InMemorySchoolRewardRepository,
    InMemoryRewardRedemptionRepository,
    CommunityService,
  ],
})
export class CommunityExchangeModule {}
