import {
  Controller,
  Post,
  Get,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  Inject,
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
  constructor(
    @Inject(CommunityService)
    private readonly communityService: CommunityService,
  ) {}

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
  @Roles('STUDENT', 'SCHOOL_ADMIN', 'SUPER_ADMIN')
  async listItems(
    @CurrentUser() user: AuthUser,
    @Query('status') status?: string,
    @Query('institutionId') queryInstitutionId?: string,
  ): Promise<ExchangeItem[]> {
    const targetUser: AuthUser = {
      ...user,
      institutionId: user.institutionId || queryInstitutionId || 'e28bb18a-66fe-4f8e-9092-2df283f55001',
    };
    return this.communityService.listItems(targetUser, { status });
  }

  @Get('items/:id')
  @Roles('STUDENT', 'SCHOOL_ADMIN', 'SUPER_ADMIN')
  async getItem(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
  ): Promise<ExchangeItem> {
    const targetUser: AuthUser = {
      ...user,
      institutionId: user.institutionId || 'e28bb18a-66fe-4f8e-9092-2df283f55001',
    };
    return this.communityService.getItemById(targetUser, id);
  }

  @Patch('items/:id/moderate')
  @Roles('SCHOOL_ADMIN', 'SUPER_ADMIN')
  @UsePipes(new ZodValidationPipe(ModerateExchangeItemSchema))
  async moderateItem(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: ModerateExchangeItemDto,
  ): Promise<ExchangeItem> {
    const instId = user.institutionId || 'e28bb18a-66fe-4f8e-9092-2df283f55001';
    return this.communityService.moderateItem(user.id, instId, id, dto);
  }

  @Get('leaderboard')
  @Roles('STUDENT', 'SCHOOL_ADMIN', 'SUPER_ADMIN')
  async getLeaderboard(
    @CurrentUser() user: AuthUser,
    @Query('institutionId') queryInstitutionId?: string,
  ): Promise<LeaderboardEntryDto[]> {
    const instId = user.institutionId || queryInstitutionId || 'e28bb18a-66fe-4f8e-9092-2df283f55001';
    return this.communityService.getLeaderboard(instId);
  }

  @Get('rewards')
  @Roles('STUDENT', 'SCHOOL_ADMIN', 'SUPER_ADMIN')
  async listRewards(
    @CurrentUser() user: AuthUser,
    @Query('institutionId') queryInstitutionId?: string,
  ): Promise<SchoolReward[]> {
    const instId = user.institutionId || queryInstitutionId || 'e28bb18a-66fe-4f8e-9092-2df283f55001';
    return this.communityService.listRewards(instId);
  }

  @Post('rewards')
  @Roles('SCHOOL_ADMIN', 'SUPER_ADMIN')
  async createReward(
    @CurrentUser() user: AuthUser,
    @Body() dto: Partial<SchoolRewardDto> & { title: string; description: string; pointsCost: number },
  ): Promise<SchoolReward> {
    const instId = user.institutionId || 'e28bb18a-66fe-4f8e-9092-2df283f55001';
    return this.communityService.createReward(instId, dto);
  }

  @Patch('rewards/:id')
  @Roles('SCHOOL_ADMIN', 'SUPER_ADMIN')
  async updateReward(
    @Param('id') id: string,
    @Body() dto: Partial<SchoolReward>,
  ): Promise<SchoolReward> {
    return this.communityService.updateReward(id, dto);
  }

  @Delete('rewards/:id')
  @Roles('SCHOOL_ADMIN', 'SUPER_ADMIN')
  async deleteReward(@Param('id') id: string): Promise<{ deleted: boolean }> {
    await this.communityService.deleteReward(id);
    return { deleted: true };
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
