import { Inject, Injectable, Optional } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import type {
  CreateExchangeItemDto,
  ModerateExchangeItemDto,
  SchoolRewardDto,
  RedeemRewardDto,
  LeaderboardEntryDto,
} from '@cambiazo/shared';
import {
  TenantMismatchException,
  ExchangeItemNotFoundException,
  RewardNotFoundException,
  InsufficientCommunityPointsException,
  InsufficientStockException,
  ItemNotApprovedException,
  ProhibitedCommunityConversionException,
  UnauthorizedRoleException,
} from '../../../../common/errors/domain.exception.js';
import type { AuthUser } from '../../../../common/auth/auth-user.interface.js';
import type { ExchangeItem } from '../../domain/entities/exchange-item.entity.js';
import type { SchoolReward } from '../../domain/entities/school-reward.entity.js';
import type { RewardRedemption } from '../../domain/entities/reward-redemption.entity.js';
import {
  type ExchangeItemRepositoryPort,
  EXCHANGE_ITEM_REPOSITORY,
} from '../../domain/ports/exchange-item.repository.port.js';
import {
  type CommunityPointsRepositoryPort,
  COMMUNITY_POINTS_REPOSITORY,
} from '../../domain/ports/community-points.repository.port.js';
import {
  type SchoolRewardRepositoryPort,
  SCHOOL_REWARD_REPOSITORY,
} from '../../domain/ports/school-reward.repository.port.js';
import {
  type RewardRedemptionRepositoryPort,
  REWARD_REDEMPTION_REPOSITORY,
} from '../../domain/ports/reward-redemption.repository.port.js';
import {
  type UserRepositoryPort,
  USER_REPOSITORY,
} from '../../../identity-parental/domain/ports/user.repository.port.js';

@Injectable()
export class CommunityService {
  constructor(
    @Inject(EXCHANGE_ITEM_REPOSITORY)
    private readonly itemRepo: ExchangeItemRepositoryPort,
    @Inject(COMMUNITY_POINTS_REPOSITORY)
    private readonly pointsRepo: CommunityPointsRepositoryPort,
    @Inject(SCHOOL_REWARD_REPOSITORY)
    private readonly rewardRepo: SchoolRewardRepositoryPort,
    @Inject(REWARD_REDEMPTION_REPOSITORY)
    private readonly redemptionRepo: RewardRedemptionRepositoryPort,
    @Optional()
    @Inject(USER_REPOSITORY)
    private readonly userRepo?: UserRepositoryPort,
  ) {}

  async createItem(
    studentUserId: string,
    institutionId: string,
    dto: CreateExchangeItemDto,
  ): Promise<ExchangeItem> {
    const now = new Date();
    const item: ExchangeItem = {
      id: randomUUID(),
      institutionId,
      studentUserId,
      title: dto.title,
      description: dto.description,
      category: dto.category,
      mode: dto.mode,
      photoUrls: dto.photoUrls || [],
      moderationStatus: 'PENDING',
      pickupPointNotes: 'Entregar en el Punto de Entrega Escolar Moderado',
      createdAt: now,
      updatedAt: now,
    };

    return this.itemRepo.save(item);
  }

  async moderateItem(
    moderatorUserId: string,
    moderatorInstitutionId: string,
    itemId: string,
    dto: ModerateExchangeItemDto,
  ): Promise<ExchangeItem> {
    const item = await this.itemRepo.findById(itemId);
    if (!item) {
      throw new ExchangeItemNotFoundException(itemId);
    }

    if (item.institutionId !== moderatorInstitutionId) {
      throw new TenantMismatchException(
        `Moderator from institution ${moderatorInstitutionId} cannot moderate item from institution ${item.institutionId}`,
      );
    }

    // Points award strictly on physical delivery confirmation (DELIVERED)
    let awardedPoints = item.awardedPoints;

    if (dto.status === 'DELIVERED' && item.moderationStatus !== 'DELIVERED') {
      const pointsToAward =
        dto.awardedPoints > 0
          ? dto.awardedPoints
          : dto.awardedPoints === 0 && item.mode === 'DONATION'
            ? 50
            : item.mode === 'BARTER'
              ? 35
              : 25;

      await this.pointsRepo.save({
        id: randomUUID(),
        institutionId: item.institutionId,
        studentUserId: item.studentUserId,
        pointsDelta: pointsToAward,
        reason: 'EXCHANGE_DELIVERED',
        referenceId: item.id,
        createdAt: new Date(),
      });

      awardedPoints = pointsToAward;
    }

    const updated = await this.itemRepo.update(itemId, {
      moderationStatus: dto.status,
      moderatorNotes: dto.moderatorNotes ?? item.moderatorNotes,
      awardedPoints,
    });

    return updated;
  }

  async listItems(
    user: AuthUser,
    query?: { status?: string },
  ): Promise<ExchangeItem[]> {
    if (!user.institutionId) {
      throw new UnauthorizedRoleException('User does not belong to any institution');
    }

    const items = await this.itemRepo.findByInstitution(user.institutionId, {
      status: query?.status,
    });

    if (user.role === 'STUDENT') {
      // Students can only see APPROVED items or their own items
      return items.filter(
        (it) => it.moderationStatus === 'APPROVED' || it.studentUserId === user.id,
      );
    }

    // SCHOOL_ADMIN can see all items in the institution
    return items;
  }

  async getItemById(user: AuthUser, itemId: string): Promise<ExchangeItem> {
    const item = await this.itemRepo.findById(itemId);
    if (!item) {
      throw new ExchangeItemNotFoundException(itemId);
    }

    if (item.institutionId !== user.institutionId) {
      throw new TenantMismatchException(
        `Cross-institution access: user belongs to ${user.institutionId}, item belongs to ${item.institutionId}`,
      );
    }

    if (user.role === 'STUDENT') {
      if (item.moderationStatus !== 'APPROVED' && item.studentUserId !== user.id) {
        throw new ItemNotApprovedException(
          `Publication is in ${item.moderationStatus} status and not visible to other students`,
        );
      }
    }

    return item;
  }

  async getLeaderboard(institutionId: string): Promise<LeaderboardEntryDto[]> {
    const aggregates = await this.pointsRepo.getLeaderboardAggregates(institutionId);

    const entries: LeaderboardEntryDto[] = [];
    let rank = 1;

    for (const agg of aggregates) {
      let alias = `Alumno #${agg.studentUserId.slice(0, 4)}`;
      if (this.userRepo) {
        const u = await this.userRepo.findById(agg.studentUserId);
        if (u && u.fullName) {
          const parts = u.fullName.trim().split(/\s+/);
          const first = parts[0];
          const last = parts[parts.length - 1];
          if (parts.length > 1 && first && last && last.length > 0) {
            alias = `${first} ${last[0]}.`;
          } else if (first) {
            alias = first;
          }
        }
      }


      const badges: string[] = [];
      if (agg.accumulatedPoints >= 50) {
        badges.push('SOLIDARIO_INICIAL');
      }
      if (agg.accumulatedPoints >= 150) {
        badges.push('GUARDIAN_DEL_RECICLAJE');
      }
      if (agg.accumulatedPoints >= 300) {
        badges.push('SOLIDARIO_ORO');
      }

      entries.push({
        rank: rank++,
        studentId: agg.studentUserId,
        studentAlias: alias,
        accumulatedPoints: agg.accumulatedPoints,
        badges,
      });
    }

    return entries;
  }

  async createReward(
    institutionId: string,
    dto: Partial<SchoolRewardDto> & { title: string; description: string; pointsCost: number },
  ): Promise<SchoolReward> {
    const reward: SchoolReward = {
      id: dto.id || randomUUID(),
      institutionId,
      title: dto.title,
      description: dto.description,
      pointsCost: dto.pointsCost,
      stock: dto.stock,
      badgeImageUrl: dto.badgeImageUrl,
      isActive: dto.isActive ?? true,
      createdAt: new Date(),
    };

    return this.rewardRepo.save(reward);
  }

  async listRewards(institutionId: string): Promise<SchoolReward[]> {
    return this.rewardRepo.findByInstitution(institutionId, true);
  }

  async redeemReward(
    studentUserId: string,
    institutionId: string,
    dto: RedeemRewardDto,
  ): Promise<RewardRedemption> {
    if (dto.studentId !== studentUserId) {
      throw new UnauthorizedRoleException('Student can only redeem rewards for themselves');
    }

    const reward = await this.rewardRepo.findById(dto.rewardId);
    if (!reward) {
      throw new RewardNotFoundException(dto.rewardId);
    }

    if (reward.institutionId !== institutionId) {
      throw new TenantMismatchException(
        `Reward belongs to institution ${reward.institutionId}, not ${institutionId}`,
      );
    }

    if (!reward.isActive) {
      throw new RewardNotFoundException(dto.rewardId, 'Reward is currently inactive');
    }

    if (typeof reward.stock === 'number' && reward.stock <= 0) {
      throw new InsufficientStockException(dto.rewardId, 'Reward is out of stock');
    }

    const currentBalance = await this.pointsRepo.getStudentBalance(
      studentUserId,
      institutionId,
    );

    if (currentBalance < reward.pointsCost) {
      throw new InsufficientCommunityPointsException(
        `Insufficient points: required ${reward.pointsCost}, available ${currentBalance}`,
      );
    }

    // Deduct points from immutable community points ledger
    await this.pointsRepo.save({
      id: randomUUID(),
      institutionId,
      studentUserId,
      pointsDelta: -reward.pointsCost,
      reason: 'REWARD_REDEMPTION',
      referenceId: reward.id,
      createdAt: new Date(),
    });

    if (typeof reward.stock === 'number') {
      await this.rewardRepo.decrementStock(reward.id);
    }

    const redemption: RewardRedemption = {
      id: randomUUID(),
      institutionId,
      studentUserId,
      rewardId: reward.id,
      pointsCost: reward.pointsCost,
      status: 'PENDING_PICKUP',
      createdAt: new Date(),
    };

    return this.redemptionRepo.save(redemption);
  }

  // Strict economy separation rule enforcement
  attemptConvertPointsToMoney(): never {
    throw new ProhibitedCommunityConversionException(
      'Community points cannot be converted into money or kiosk credit under any circumstances',
    );
  }

  attemptConvertMoneyToPoints(): never {
    throw new ProhibitedCommunityConversionException(
      'Money or kiosk credit cannot be used to purchase community points under any circumstances',
    );
  }
}
