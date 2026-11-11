import {
  SpendingLimitsSchema,
  type SpendingLimitsDto,
  type WeeklyParentSummaryDto,
} from '@cambiazo/shared';
import {
  cambiazoApi,
  extractApiErrorMessage,
} from '../../api/cambiazoApi';
import type {
  ParentalControlsApiOptions,
  SpendingLimits,
  UpdateSpendingLimitsResult,
} from '../interface/parental-controls.interface';

const DEFAULT_EMPTY_WEEKLY_SUMMARY = (studentId: string): WeeklyParentSummaryDto => {
  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  return {
    studentId,
    startDate: weekAgo.toISOString(),
    endDate: now.toISOString(),
    totalSpentCents: 0,
    breakdownByCategory: [],
    recentPurchases: [],
    communityPointsEarned: 0,
    blockedAttemptsCount: 0,
  };
};

export async function fetchSpendingLimitsAction(
  studentId: string,
  options?: ParentalControlsApiOptions
): Promise<SpendingLimits> {
  const response = await cambiazoApi.get<Partial<SpendingLimits>>(
    `/students/${encodeURIComponent(studentId)}/limits`,
    { auth: options?.auth },
    'No se pudieron obtener los límites de gasto.'
  );

  return {
    studentId,
    dailyLimitCents: response.dailyLimitCents ?? 0,
    weeklyLimitCents: response.weeklyLimitCents ?? 0,
    blockedCategories: Array.isArray(response.blockedCategories)
      ? response.blockedCategories
      : [],
    isPaused: Boolean(response.isPaused),
  };
}

export async function updateSpendingLimitsAction(
  input: SpendingLimitsDto,
  options?: ParentalControlsApiOptions
): Promise<UpdateSpendingLimitsResult> {
  const validation = SpendingLimitsSchema.safeParse(input);
  if (!validation.success) {
    return {
      success: false,
      error:
        validation.error.errors[0]?.message ||
        'Configuración de límites inválida',
    };
  }

  const targetStudentId = validation.data.studentId || input.studentId || '';
  if (!targetStudentId) {
    return {
      success: false,
      error: 'Falta el identificador del alumno para actualizar límites.',
    };
  }

  try {
    const response = await cambiazoApi.put<Partial<SpendingLimits>>(
      `/students/${encodeURIComponent(targetStudentId)}/limits`,
      validation.data,
      {
        auth: {
          role: 'PARENT',
          ...options?.auth,
        },
      },
      'Error al actualizar límites de gasto'
    );

    const limits: SpendingLimits = {
      studentId: targetStudentId,
      dailyLimitCents:
        response.dailyLimitCents ?? validation.data.dailyLimitCents,
      weeklyLimitCents:
        response.weeklyLimitCents ?? validation.data.weeklyLimitCents,
      blockedCategories:
        response.blockedCategories ?? validation.data.blockedCategories,
      isPaused: response.isPaused ?? validation.data.isPaused,
    };

    return {
      success: true,
      limits,
    };
  } catch (error) {
    return {
      success: false,
      error: extractApiErrorMessage(
        error,
        'Error al actualizar límites de gasto'
      ),
    };
  }
}

export async function fetchWeeklyParentSummaryAction(
  studentId: string,
  options?: ParentalControlsApiOptions
): Promise<WeeklyParentSummaryDto> {
  try {
    return await cambiazoApi.get<WeeklyParentSummaryDto>(
      `/parents/children/${encodeURIComponent(studentId)}/weekly-summary`,
      {
        auth: {
          role: 'PARENT',
          ...options?.auth,
        },
      },
      'No se pudo obtener el informe semanal.'
    );
  } catch {
    return DEFAULT_EMPTY_WEEKLY_SUMMARY(studentId);
  }
}
