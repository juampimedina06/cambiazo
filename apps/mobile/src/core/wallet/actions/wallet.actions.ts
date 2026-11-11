import {
  TopUpPreferenceRequestSchema,
  type TopUpPreferenceRequestDto,
} from '@cambiazo/shared';
import {
  cambiazoApi,
  extractApiErrorMessage,
  type ApiAuthContext,
} from '../../api/cambiazoApi';
import type { StudentProfile } from '../../auth/interface/auth.interface';
import { fetchConsentStatusAction } from '../../consent/actions/consent.actions';
import { fetchSpendingLimitsAction } from '../../parental-controls/actions/parental-controls.actions';
import type {
  BackendSavingsGoal,
  BackendWalletTransaction,
  CompleteTopUpParams,
  CompleteTopUpResult,
  CreateSavingsGoalInput,
  SavingsGoal,
  SavingsGoalActionResult,
  TopUpPreferenceResult,
  WalletApiOptions,
  WalletPurchase,
} from '../interface/wallet.interface';

function mapWalletTransaction(
  tx: BackendWalletTransaction,
  studentId: string
): WalletPurchase {
  const isCredit = tx.direction === 'CREDIT';
  const createdAt = tx.createdAt ? new Date(tx.createdAt) : new Date();

  return {
    id: String(tx.id),
    studentId,
    studentName: 'Alumno',
    amountCents: tx.amountCents ?? 0,
    itemsSummary:
      tx.description || (isCredit ? 'Carga de saldo' : 'Compra en Kiosco'),
    category: tx.metadata?.category || 'HEALTHY_SNACK',
    icon: isCredit ? 'wallet' : 'shopping-bag',
    timestamp: createdAt.toLocaleDateString('es-AR', {
      day: '2-digit',
      month: '2-digit',
    }),
    createdAtIso: tx.createdAt,
    referenceType: tx.referenceType,
    direction: tx.direction,
    kioskName: isCredit ? 'Mercado Pago' : 'Kiosco Escolar',
  };
}

function mapSavingsGoal(
  goal: BackendSavingsGoal,
  studentId: string,
  fallbackIcon = 'target'
): SavingsGoal {
  return {
    id: goal.id,
    studentId: goal.studentUserId || studentId,
    title: goal.title,
    targetAmountCents: goal.targetAmountCents ?? 0,
    savedAmountCents: goal.reservedAmountCents ?? goal.savedAmountCents ?? 0,
    icon: goal.icon || fallbackIcon,
    createdAt: goal.createdAt || new Date().toISOString(),
  };
}

export function calculateDailySpentCents(purchases: WalletPurchase[]): number {
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  return purchases.reduce((sum, item) => {
    if (item.referenceType !== 'KIOSK_PURCHASE' || item.direction === 'CREDIT') {
      return sum;
    }
    const createdAt = item.createdAtIso ? new Date(item.createdAtIso) : now;
    return createdAt >= startOfToday ? sum + item.amountCents : sum;
  }, 0);
}

export async function fetchStudentBalanceAction(
  studentId: string,
  options?: WalletApiOptions
): Promise<number> {
  const response = await cambiazoApi.get<{ balanceCents?: number }>(
    `/wallet/balance/${encodeURIComponent(studentId)}`,
    { auth: options?.auth },
    'No se pudo obtener el saldo.'
  );
  return typeof response.balanceCents === 'number' ? response.balanceCents : 0;
}

export async function fetchStudentTransactionsAction(
  studentId: string,
  options?: WalletApiOptions
): Promise<WalletPurchase[]> {
  try {
    const response = await cambiazoApi.get<BackendWalletTransaction[]>(
      `/wallet/transactions/${encodeURIComponent(studentId)}`,
      { auth: options?.auth }
    );
    if (!Array.isArray(response)) return [];
    return response.map((tx) => mapWalletTransaction(tx, studentId));
  } catch {
    return [];
  }
}

export async function createTopUpPreferenceAction(
  input: TopUpPreferenceRequestDto,
  options?: WalletApiOptions
): Promise<TopUpPreferenceResult> {
  const validation = TopUpPreferenceRequestSchema.safeParse(input);
  if (!validation.success) {
    return {
      success: false,
      error:
        validation.error.errors[0]?.message || 'Monto de recarga inválido',
    };
  }

  try {
    const response = await cambiazoApi.post<{
      preferenceId: string;
      initPoint: string;
    }>(
      '/wallet/top-up-preference',
      validation.data,
      {
        auth: {
          role: 'PARENT',
          ...options?.auth,
        },
      },
      'Error al generar preferencia de recarga'
    );

    return {
      success: true,
      preferenceId: response.preferenceId,
      initPoint: response.initPoint,
      amountCents: validation.data.amountCents,
      studentId: validation.data.studentId,
    };
  } catch (error) {
    return {
      success: false,
      error: extractApiErrorMessage(
        error,
        'Error al generar preferencia de recarga'
      ),
    };
  }
}

export async function completeTopUpAction(
  params: CompleteTopUpParams,
  options?: WalletApiOptions
): Promise<CompleteTopUpResult> {
  if (!Number.isInteger(params.amountCents) || params.amountCents <= 0) {
    return {
      success: false,
      error: 'El monto de recarga debe ser mayor a cero.',
    };
  }

  try {
    await cambiazoApi.post(
      '/webhooks/mercadopago',
      {
        id: params.preferenceId,
        type: 'payment',
        data: { id: params.preferenceId },
      },
      { skipAuth: true },
      'Error al acreditar la recarga en el servidor'
    );

    const newBalanceArsCents = await fetchStudentBalanceAction(
      params.studentId,
      options
    );

    return {
      success: true,
      newBalanceArsCents,
    };
  } catch (error) {
    return {
      success: false,
      error: extractApiErrorMessage(
        error,
        'Error al acreditar la recarga en el servidor'
      ),
    };
  }
}

export async function fetchSavingsGoalsAction(
  studentId: string,
  options?: WalletApiOptions
): Promise<SavingsGoal[]> {
  try {
    const response = await cambiazoApi.get<BackendSavingsGoal[]>(
      '/wallet/savings-goals',
      {
        auth: {
          role: 'STUDENT',
          userId: studentId,
          ...options?.auth,
        },
      }
    );
    if (!Array.isArray(response)) return [];
    return response.map((g) => mapSavingsGoal(g, studentId));
  } catch {
    return [];
  }
}

export async function createSavingsGoalAction(
  input: CreateSavingsGoalInput,
  options?: WalletApiOptions
): Promise<SavingsGoalActionResult> {
  if (!input.title || input.title.trim().length < 2) {
    return {
      success: false,
      error: 'El nombre de la meta debe tener al menos 2 caracteres.',
    };
  }

  if (!Number.isInteger(input.targetAmountCents) || input.targetAmountCents <= 0) {
    return {
      success: false,
      error: 'El monto objetivo debe ser mayor a $0.',
    };
  }

  try {
    const response = await cambiazoApi.post<BackendSavingsGoal>(
      '/wallet/savings-goals',
      {
        title: input.title.trim(),
        targetAmountCents: input.targetAmountCents,
      },
      {
        auth: {
          role: 'STUDENT',
          userId: input.studentId,
          ...options?.auth,
        },
      },
      'Error al crear meta de ahorro'
    );

    return {
      success: true,
      goal: mapSavingsGoal(response, input.studentId, input.icon || 'target'),
    };
  } catch (error) {
    return {
      success: false,
      error: extractApiErrorMessage(error, 'Error al crear meta de ahorro'),
    };
  }
}

export async function allocateToSavingsGoalAction(
  params: {
    studentId: string;
    goalId: string;
    amountCents: number;
  },
  options?: WalletApiOptions
): Promise<SavingsGoalActionResult> {
  if (!Number.isInteger(params.amountCents) || params.amountCents <= 0) {
    return {
      success: false,
      error: 'El monto a apartar debe ser mayor a $0.',
    };
  }

  try {
    const response = await cambiazoApi.post<BackendSavingsGoal>(
      `/wallet/savings-goals/${encodeURIComponent(params.goalId)}/deposit`,
      { amountCents: params.amountCents },
      {
        auth: {
          role: 'STUDENT',
          userId: params.studentId,
          ...options?.auth,
        },
      },
      'Error al guardar dinero en la meta'
    );

    return {
      success: true,
      goal: mapSavingsGoal(response, params.studentId),
    };
  } catch (error) {
    return {
      success: false,
      error: extractApiErrorMessage(error, 'Error al guardar dinero en la meta'),
    };
  }
}

export async function withdrawFromSavingsGoalAction(
  params: {
    studentId: string;
    goalId: string;
  },
  options?: WalletApiOptions
): Promise<SavingsGoalActionResult> {
  try {
    const response = await cambiazoApi.delete<BackendSavingsGoal | null>(
      `/wallet/savings-goals/${encodeURIComponent(params.goalId)}`,
      {
        auth: {
          role: 'STUDENT',
          userId: params.studentId,
          ...options?.auth,
        },
      },
      'Error al liberar fondos de la meta'
    );

    return {
      success: true,
      goal: response
        ? mapSavingsGoal(response, params.studentId)
        : undefined,
    };
  } catch (error) {
    return {
      success: false,
      error: extractApiErrorMessage(
        error,
        'Error al liberar fondos de la meta'
      ),
    };
  }
}

export async function hydrateStudentAccountAction(
  student: StudentProfile,
  auth: ApiAuthContext
): Promise<StudentProfile> {
  const [balanceResult, limitsResult, consentResult, transactionsResult] =
    await Promise.allSettled([
      fetchStudentBalanceAction(student.id, { auth }),
      fetchSpendingLimitsAction(student.id, { auth }),
      fetchConsentStatusAction(student.id, { auth }),
      fetchStudentTransactionsAction(student.id, { auth }),
    ]);

  const purchases =
    transactionsResult.status === 'fulfilled' ? transactionsResult.value : [];

  return {
    ...student,
    balanceArsCents:
      balanceResult.status === 'fulfilled'
        ? balanceResult.value
        : student.balanceArsCents,
    dailyLimitCents:
      limitsResult.status === 'fulfilled'
        ? limitsResult.value.dailyLimitCents
        : student.dailyLimitCents,
    dailySpentCents:
      purchases.length > 0
        ? calculateDailySpentCents(purchases)
        : student.dailySpentCents,
    consentStatus:
      consentResult.status === 'fulfilled'
        ? consentResult.value
        : student.consentStatus,
  };
}
