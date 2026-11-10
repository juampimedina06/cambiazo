import {
  Controller,
  Post,
  Get,
  Patch,
  Body,
  Param,
  Query,
  UsePipes,
} from '@nestjs/common';
import {
  CreateExchangeItemSchema,
  ModerateExchangeItemSchema,
  RedeemRewardSchema,
  type CreateExchangeItemDto,
  type ModerateExchangeItemDto,
  type RedeemRewardDto,
  type LeaderboardEntryDto,
  type SchoolRewardDto,
} from '@cambiazo/shared';
import { CurrentUser } from '../../../../common/auth/current-user.decorator.js';
import type { AuthUser } from '../../../../common/auth/auth-user.interface.js';
import { Roles } from '../../../../common/auth/roles.decorator.js';
import { ZodValidationPipe } from '../../../../common/pipes/zod-validation.pipe.js';
import { CommunityService } from '../../application/services/community.service.js';
import type { ExchangeItem } from '../../domain/entities/exchange-item.entity.js';
import type { SchoolReward } from '../../domain/entities/school-reward.entity.js';
import type { RewardRedemption } from '../../domain/entities/reward-redemption.entity.js';

@Controller('api/v1/community')
export class CommunityController {
  constructor(private readonly communityService: CommunityService) {}

  @Post('items')
  @Roles('STUDENT')
  @UsePipes(new ZodValidationPipe(CreateExchangeItemSchema))
  async createItem(
    @CurrentUser() user: AuthUser,
    @Body() dto: CreateExchangeItemDto,
  ): Promise<ExchangeItem> {
    return this.communityService.createItem(user.id, user.institutionId!, dto);
  }

  @Get('items')
  @Roles('STUDENT', 'SCHOOL_ADMIN')
  async listItems(
    @CurrentUser() user: AuthUser,
    @Query('status') status?: string,
  ): Promise<ExchangeItem[]> {
    return this.communityService.listItems(user, { status });
  }

  @Get('items/:id')
  @Roles('STUDENT', 'SCHOOL_ADMIN')
  async getItem(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
  ): Promise<ExchangeItem> {
    return this.communityService.getItemById(user, id);
  }

  @Patch('items/:id/moderate')
  @Roles('SCHOOL_ADMIN')
  @UsePipes(new ZodValidationPipe(ModerateExchangeItemSchema))
  async moderateItem(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: ModerateExchangeItemDto,
  ): Promise<ExchangeItem> {
    return this.communityService.moderateItem(user.id, user.institutionId!, id, dto);
  }

  @Get('leaderboard')
  @Roles('STUDENT', 'SCHOOL_ADMIN')
  async getLeaderboard(
    @CurrentUser() user: AuthUser,
  ): Promise<LeaderboardEntryDto[]> {
    return this.communityService.getLeaderboard(user.institutionId!);
  }

  @Get('rewards')
  @Roles('STUDENT', 'SCHOOL_ADMIN')
  async listRewards(
    @CurrentUser() user: AuthUser,
  ): Promise<SchoolReward[]> {
    return this.communityService.listRewards(user.institutionId!);
  }

  @Post('rewards')
  @Roles('SCHOOL_ADMIN')
  async createReward(
    @CurrentUser() user: AuthUser,
    @Body() dto: Partial<SchoolRewardDto> & { title: string; description: string; pointsCost: number },
  ): Promise<SchoolReward> {
    return this.communityService.createReward(user.institutionId!, dto);
  }

  @Get('rewards/redemptions')
  @Roles('SCHOOL_ADMIN', 'SUPER_ADMIN')
  async listRedemptions(
    @CurrentUser() user: AuthUser,
    @Query('institutionId') institutionId?: string,
  ): Promise<RewardRedemption[]> {
    const instId = user.role === 'SUPER_ADMIN' ? (institutionId || user.institutionId || '') : (user.institutionId || '');
    return this.communityService.listRedemptions(instId);
  }

  @Patch('rewards/redemptions/:id/fulfill')
  @Roles('SCHOOL_ADMIN', 'SUPER_ADMIN')
  async fulfillRedemption(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
  ): Promise<RewardRedemption> {
    return this.communityService.fulfillRedemption(user.institutionId || '', id);
  }

  @Post('rewards/redeem')
  @Roles('STUDENT')
  @UsePipes(new ZodValidationPipe(RedeemRewardSchema))
  async redeemReward(
    @CurrentUser() user: AuthUser,
    @Body() dto: RedeemRewardDto,
  ): Promise<RewardRedemption> {
    return this.communityService.redeemReward(user.id, user.institutionId!, dto);
  }

  @Post('points/convert')
  @Roles('STUDENT', 'SCHOOL_ADMIN')
  async attemptConversion(): Promise<never> {
    return this.communityService.attemptConvertPointsToMoney();
  }
}
