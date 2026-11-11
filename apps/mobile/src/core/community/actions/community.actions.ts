import {
  CreateExchangeItemSchema,
  RedeemRewardSchema,
  type CreateExchangeItemDto,
  type ExchangeMode,
  type LeaderboardEntryDto,
  type ModerationStatus,
  type RedeemRewardDto,
  type SchoolRewardDto,
} from '@cambiazo/shared';
import {
  cambiazoApi,
  extractApiErrorMessage,
} from '../../api/cambiazoApi';
import type {
  CommunityApiOptions,
  CreateExchangeItemResult,
  ExchangeItem,
  RedeemRewardResult,
} from '../interface/community.interface';

interface BackendExchangeItem {
  id: string;
  studentUserId?: string;
  institutionId?: string;
  studentAlias?: string;
  title: string;
  description: string;
  category: string;
  mode: ExchangeMode;
  moderationStatus?: ModerationStatus;
  status?: ModerationStatus;
  photoUrls?: string[];
  pickupPointNotes?: string;
  pickupLocation?: string;
  createdAt?: string;
}

function mapExchangeItem(
  raw: BackendExchangeItem,
  fallbackInstitutionId: string,
  fallbackStudentId = ''
): ExchangeItem {
  return {
    id: raw.id,
    studentId: raw.studentUserId || fallbackStudentId,
    institutionId: raw.institutionId || fallbackInstitutionId,
    studentAlias: raw.studentAlias || 'Alumno',
    title: raw.title,
    description: raw.description,
    category: raw.category,
    mode: raw.mode,
    status: raw.moderationStatus || raw.status || 'APPROVED',
    photoUrls: raw.photoUrls || [],
    pickupLocation:
      raw.pickupPointNotes ||
      raw.pickupLocation ||
      'Punto de Entrega Escolar',
    createdAt: raw.createdAt || new Date().toISOString(),
  };
}

export async function fetchExchangeItemsAction(
  institutionId: string,
  modeFilter?: ExchangeMode,
  options?: CommunityApiOptions
): Promise<ExchangeItem[]> {
  try {
    const response = await cambiazoApi.get<BackendExchangeItem[]>(
      '/community/items?status=APPROVED',
      {
        auth: {
          role: 'STUDENT',
          institutionId,
          ...options?.auth,
        },
      }
    );

    if (!Array.isArray(response)) return [];
    const mapped = response.map((item) => mapExchangeItem(item, institutionId));
    return modeFilter
      ? mapped.filter((item) => item.mode === modeFilter)
      : mapped;
  } catch {
    return [];
  }
}

export async function createExchangeItemAction(
  studentId: string,
  institutionId: string,
  input: CreateExchangeItemDto
): Promise<CreateExchangeItemResult> {
  const validation = CreateExchangeItemSchema.safeParse(input);
  if (!validation.success) {
    return {
      success: false,
      error:
        validation.error.errors[0]?.message ||
        'Los datos del artículo son inválidos.',
    };
  }

  try {
    const response = await cambiazoApi.post<BackendExchangeItem>(
      '/community/items',
      validation.data,
      {
        auth: {
          role: 'STUDENT',
          userId: studentId,
          institutionId,
        },
      },
      'Error al publicar artículo'
    );

    return {
      success: true,
      item: {
        ...mapExchangeItem(response, institutionId, studentId),
        status: response.moderationStatus || response.status || 'PENDING',
      },
    };
  } catch (error) {
    return {
      success: false,
      error: extractApiErrorMessage(error, 'Error al publicar artículo'),
    };
  }
}

export async function fetchLeaderboardAction(
  institutionId: string,
  options?: CommunityApiOptions
): Promise<LeaderboardEntryDto[]> {
  try {
    const response = await cambiazoApi.get<LeaderboardEntryDto[]>(
      '/community/leaderboard',
      {
        auth: {
          role: 'STUDENT',
          institutionId,
          ...options?.auth,
        },
      }
    );
    return Array.isArray(response) ? response : [];
  } catch {
    return [];
  }
}

export async function fetchSchoolRewardsAction(
  institutionId: string,
  options?: CommunityApiOptions
): Promise<SchoolRewardDto[]> {
  try {
    const response = await cambiazoApi.get<SchoolRewardDto[]>(
      '/community/rewards',
      {
        auth: {
          role: 'STUDENT',
          institutionId,
          ...options?.auth,
        },
      }
    );
    return Array.isArray(response) ? response : [];
  } catch {
    return [];
  }
}

export async function redeemRewardAction(
  input: RedeemRewardDto,
  options?: CommunityApiOptions
): Promise<RedeemRewardResult> {
  const validation = RedeemRewardSchema.safeParse(input);
  if (!validation.success) {
    return {
      success: false,
      error:
        validation.error.errors[0]?.message || 'Solicitud de canje inválida',
    };
  }

  try {
    const response = await cambiazoApi.post<{ remainingPoints?: number }>(
      '/community/rewards/redeem',
      validation.data,
      {
        auth: {
          role: 'STUDENT',
          userId: validation.data.studentId,
          ...options?.auth,
        },
      },
      'Error al canjear recompensa'
    );

    return {
      success: true,
      remainingPoints: response.remainingPoints,
    };
  } catch (error) {
    return {
      success: false,
      error: extractApiErrorMessage(error, 'Error al canjear recompensa'),
    };
  }
}

