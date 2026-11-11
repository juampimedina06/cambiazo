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

export function isLocalImageUri(uri: string): boolean {
  const trimmed = uri.trim();
  if (!trimmed) return false;
  return !/^https?:\/\//i.test(trimmed);
}

function inferImageMeta(uri: string): { name: string; type: string } {
  const rawName = uri.split('/').pop()?.split('?')[0] || '';
  const lower = rawName.toLowerCase();
  if (lower.endsWith('.png')) {
    return { name: rawName, type: 'image/png' };
  }
  if (lower.endsWith('.webp')) {
    return { name: rawName, type: 'image/webp' };
  }
  if (lower.endsWith('.gif')) {
    return { name: rawName, type: 'image/gif' };
  }
  if (lower.endsWith('.heic')) {
    return { name: rawName, type: 'image/heic' };
  }
  const safeName = rawName && rawName.includes('.') ? rawName : `photo_${Date.now()}.jpg`;
  return { name: safeName, type: 'image/jpeg' };
}

export async function uploadExchangeImageAction(
  imageUri: string,
  options?: CommunityApiOptions
): Promise<string> {
  const formData = new FormData();
  const { name, type } = inferImageMeta(imageUri);

  // On Expo Web blob:/data: URIs must be appended as a Blob; on React Native, file:/content: takes { uri, type, name }.
  if (/^(blob:|data:)/i.test(imageUri) && typeof fetch === 'function') {
    const res = await fetch(imageUri);
    const blob = await res.blob();
    formData.append('file', blob, name);
  } else {
    (formData as unknown as { append: (key: string, value: unknown) => void }).append(
      'file',
      {
        uri: imageUri,
        type,
        name,
      }
    );
  }

  const uploaded = await cambiazoApi.postFormData<{ url?: string; image?: string }>(
    '/files/upload',
    formData,
    {
      timeoutMs: 15000,
      auth: {
        role: 'STUDENT',
        ...options?.auth,
      },
    },
    'No se pudo subir la imagen del útil.'
  );

  const publicUrl = uploaded.url || uploaded.image;
  if (!publicUrl) {
    throw new Error('El servidor no devolvió la URL de la imagen subida.');
  }
  return publicUrl;
}

export async function prepareExchangeImagesAction(
  images: string[],
  options?: CommunityApiOptions
): Promise<string[]> {
  const clean = Array.from(
    new Set(images.map((uri) => uri.trim()).filter(Boolean))
  ).slice(0, 5);

  const localImages = clean.filter(isLocalImageUri);
  const remoteImages = clean.filter((uri) => !isLocalImageUri(uri));

  if (localImages.length > 0) {
    const uploaded = await Promise.all(
      localImages.map((uri) => uploadExchangeImageAction(uri, options))
    );
    remoteImages.push(...uploaded);
  }

  return remoteImages.slice(0, 5);
}

export async function createExchangeItemAction(
  studentId: string,
  institutionId: string,
  input: CreateExchangeItemDto
): Promise<CreateExchangeItemResult> {
  let preparedPhotoUrls: string[] = [];
  try {
    preparedPhotoUrls = await prepareExchangeImagesAction(input.photoUrls || [], {
      auth: {
        role: 'STUDENT',
        userId: studentId,
        institutionId,
      },
    });
  } catch (error) {
    return {
      success: false,
      error: extractApiErrorMessage(error, 'No se pudo subir la imagen del útil.'),
    };
  }

  const validation = CreateExchangeItemSchema.safeParse({
    ...input,
    photoUrls: preparedPhotoUrls,
  });
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

