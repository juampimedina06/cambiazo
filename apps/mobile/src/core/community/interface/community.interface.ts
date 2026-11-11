import {
  type CreateExchangeItemDto,
  type ExchangeMode,
  type LeaderboardEntryDto,
  type ModerationStatus,
  type RedeemRewardDto,
  type SchoolRewardDto,
} from '@cambiazo/shared';
import type { ApiAuthContext } from '../../api/cambiazoApi';

export interface ExchangeItem {
  id: string;
  studentId: string;
  institutionId: string;
  studentAlias: string;
  title: string;
  description: string;
  category: string;
  mode: ExchangeMode;
  status: ModerationStatus;
  photoUrls: string[];
  pickupLocation: string;
  createdAt: string;
}

export interface CreateExchangeItemResult {
  success: boolean;
  item?: ExchangeItem;
  error?: string;
}

export interface RedeemRewardResult {
  success: boolean;
  remainingPoints?: number;
  error?: string;
}

export interface CommunityApiOptions {
  auth?: ApiAuthContext;
}

export type {
  CreateExchangeItemDto,
  ExchangeMode,
  LeaderboardEntryDto,
  ModerationStatus,
  RedeemRewardDto,
  SchoolRewardDto,
};

