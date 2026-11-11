import type {
  ConsentStatus,
  ExchangeMode,
  LeaderboardEntryDto,
  ProductCategory,
  SchoolRewardDto,
  WeeklyParentSummaryDto,
} from '@cambiazo/shared';
import type {
  CatalogProduct,
  ExchangeItem,
  ParentProfile,
  SavingsGoal,
  SchoolInstitution,
  SpendingLimits,
  StudentProfile,
} from '../../src/core';

export const TEST_INSTITUTION_ID = 'e28bb18a-66fe-4f8e-9092-2df283f55001';
export const TEST_OTHER_INSTITUTION_ID = 'f39cc29b-77fa-5a9f-8183-3ef394f66002';
export const TEST_PARENT_ID = '11111111-1111-4111-8111-111111111111';
export const TEST_STUDENT_ID = '22222222-2222-4222-8222-222222222222';

interface TestTransaction {
  id: string;
  studentId: string;
  amountCents: number;
  direction: 'CREDIT' | 'DEBIT';
  referenceType: string;
  description: string;
  createdAt: string;
  metadata?: { category?: ProductCategory };
}

interface TestQrToken {
  token: string;
  code: string;
  studentId: string;
  institutionId: string;
  expiresAt: string;
}

export interface TestBackendState {
  institutions: SchoolInstitution[];
  parents: Map<string, ParentProfile>;
  students: Map<string, StudentProfile>;
  passwords: Map<string, string>;
  limits: Map<string, SpendingLimits>;
  catalog: Map<string, CatalogProduct>;
  qrTokens: Map<string, TestQrToken>;
  idempotentCharges: Map<string, { transactionId: string; totalCents: number; studentId: string; studentName: string; remainingDailyLimitCents: number }>;
  transactions: TestTransaction[];
  blockedAttempts: Map<string, Array<{ id: string; reason: string; timestamp: string }>>;
  savingsGoals: Map<string, SavingsGoal>;
  exchangeItems: Map<string, ExchangeItem>;
  rewards: Map<string, SchoolRewardDto>;
  pendingTopUps: Map<string, { studentId: string; amountCents: number }>;
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function createInitialState(): TestBackendState {
  const institutions: SchoolInstitution[] = [
    {
      id: TEST_INSTITUTION_ID,
      name: 'Colegio Manuel Belgrano',
      code: 'BELGRANO2026',
    },
    {
      id: TEST_OTHER_INSTITUTION_ID,
      name: 'Instituto San Martín',
      code: 'SANMARTIN2026',
    },
  ];

  const parents = new Map<string, ParentProfile>([
    [
      TEST_PARENT_ID,
      {
        id: TEST_PARENT_ID,
        institutionId: TEST_INSTITUTION_ID,
        fullName: 'Carolina Gómez',
        email: 'carolina.gomez@ejemplo.com',
        dni: '32109876',
        phone: '+5491122334455',
      },
    ],
  ]);

  const students = new Map<string, StudentProfile>([
    [
      TEST_STUDENT_ID,
      {
        id: TEST_STUDENT_ID,
        institutionId: TEST_INSTITUTION_ID,
        parentId: TEST_PARENT_ID,
        fullName: 'Mateo Gómez',
        dni: '52345678',
        grade: '6° Primaria A',
        dateOfBirth: '2014-05-12',
        consentStatus: 'PENDING',
        balanceArsCents: 450000,
        dailyLimitCents: 200000,
        dailySpentCents: 0,
        communityPoints: 120,
      },
    ],
  ]);

  const passwords = new Map<string, string>([
    [TEST_PARENT_ID, 'default'],
    [TEST_STUDENT_ID, 'default'],
  ]);

  const limits = new Map<string, SpendingLimits>([
    [
      TEST_STUDENT_ID,
      {
        studentId: TEST_STUDENT_ID,
        dailyLimitCents: 200000,
        weeklyLimitCents: 1000000,
        blockedCategories: [],
        isPaused: false,
      },
    ],
  ]);

  const catalog = new Map<string, CatalogProduct>([
    [
      '10000000-0000-4000-8000-000000000001',
      {
        id: '10000000-0000-4000-8000-000000000001',
        institutionId: TEST_INSTITUTION_ID,
        name: 'Alfajor Chocolate',
        category: 'CANDY',
        priceCents: 120000,
        stock: 25,
        isActive: true,
        icon: 'candy',
      },
    ],
    [
      '10000000-0000-4000-8000-000000000002',
      {
        id: '10000000-0000-4000-8000-000000000002',
        institutionId: TEST_INSTITUTION_ID,
        name: 'Tostado Jamón y Queso',
        category: 'HOT_MEAL',
        priceCents: 200000,
        stock: 15,
        isActive: true,
        icon: 'utensils',
      },
    ],
    [
      '10000000-0000-4000-8000-000000000003',
      {
        id: '10000000-0000-4000-8000-000000000003',
        institutionId: TEST_INSTITUTION_ID,
        name: 'Jugo Naranja 250ml',
        category: 'DRINK',
        priceCents: 100000,
        stock: 30,
        isActive: true,
        icon: 'cup-soda',
      },
    ],
    [
      '10000000-0000-4000-8000-000000000004',
      {
        id: '10000000-0000-4000-8000-000000000004',
        institutionId: TEST_INSTITUTION_ID,
        name: 'Manzana Roja',
        category: 'HEALTHY_SNACK',
        priceCents: 60000,
        stock: 20,
        isActive: true,
        icon: 'apple',
      },
    ],
  ]);

  const now = new Date();
  const transactions: TestTransaction[] = [
    {
      id: '40000000-0000-4000-8000-000000000001',
      studentId: TEST_STUDENT_ID,
      amountCents: 120000,
      direction: 'DEBIT',
      referenceType: 'KIOSK_PURCHASE',
      description: 'Tostado + Agua sin gas',
      createdAt: new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString(),
      metadata: { category: 'HOT_MEAL' },
    },
    {
      id: '40000000-0000-4000-8000-000000000002',
      studentId: TEST_STUDENT_ID,
      amountCents: 60000,
      direction: 'DEBIT',
      referenceType: 'KIOSK_PURCHASE',
      description: 'Ensalada de frutas',
      createdAt: new Date(now.getTime() - 48 * 60 * 60 * 1000).toISOString(),
      metadata: { category: 'HEALTHY_SNACK' },
    },
    {
      id: '40000000-0000-4000-8000-000000000003',
      studentId: TEST_STUDENT_ID,
      amountCents: 100000,
      direction: 'DEBIT',
      referenceType: 'KIOSK_PURCHASE',
      description: 'Jugo de naranja + Barrita',
      createdAt: new Date(now.getTime() - 72 * 60 * 60 * 1000).toISOString(),
      metadata: { category: 'DRINK' },
    },
  ];

  const blockedAttempts = new Map<
    string,
    Array<{ id: string; reason: string; timestamp: string }>
  >([
    [
      TEST_STUDENT_ID,
      [
        {
          id: 'blk-seed-1',
          reason: 'Categoría Golosinas (CANDY) bloqueada por tutor',
          timestamp: new Date(now.getTime() - 36 * 60 * 60 * 1000).toISOString(),
        },
      ],
    ],
  ]);

  const savingsGoals = new Map<string, SavingsGoal>([
    [
      'goal-seed-1',
      {
        id: 'goal-seed-1',
        studentId: TEST_STUDENT_ID,
        title: 'Libro de Aventuras Escolar',
        targetAmountCents: 300000,
        savedAmountCents: 180000,
        icon: 'book',
        createdAt: now.toISOString(),
      },
    ],
    [
      'goal-seed-2',
      {
        id: 'goal-seed-2',
        studentId: TEST_STUDENT_ID,
        title: 'Mochila Nueva',
        targetAmountCents: 800000,
        savedAmountCents: 200000,
        icon: 'backpack',
        createdAt: now.toISOString(),
      },
    ],
  ]);

  const exchangeItems = new Map<string, ExchangeItem>([
    [
      'ex-seed-1',
      {
        id: 'ex-seed-1',
        studentId: '77777777-7777-4777-8777-111111111111',
        institutionId: TEST_INSTITUTION_ID,
        studentAlias: 'Lucía M.',
        title: 'Set de Geometría Completo',
        description: 'Regla, escuadra y transportador en excelente estado.',
        category: 'Útiles',
        mode: 'BARTER',
        status: 'APPROVED',
        photoUrls: [],
        pickupLocation: 'Punto de Entrega Escolar Moderado - Secretaría',
        createdAt: now.toISOString(),
      },
    ],
    [
      'ex-seed-2',
      {
        id: 'ex-seed-2',
        studentId: TEST_STUDENT_ID,
        institutionId: TEST_INSTITUTION_ID,
        studentAlias: 'Mateo G.',
        title: 'Diccionario Español Escolar',
        description: 'Sin marcas ni hojas sueltas.',
        category: 'Libros',
        mode: 'DONATION',
        status: 'APPROVED',
        photoUrls: [],
        pickupLocation: 'Punto de Entrega Escolar Moderado - Biblioteca',
        createdAt: now.toISOString(),
      },
    ],
    [
      'ex-seed-3',
      {
        id: 'ex-seed-3',
        studentId: '77777777-7777-4777-8777-222222222222',
        institutionId: TEST_INSTITUTION_ID,
        studentAlias: 'Sofía R.',
        title: 'Calculadora Científica',
        description: 'Préstamo semanal para evaluaciones de matemática.',
        category: 'Tecnología',
        mode: 'LOAN',
        status: 'APPROVED',
        photoUrls: [],
        pickupLocation: 'Punto de Entrega Escolar Moderado - Preceptoría',
        createdAt: now.toISOString(),
      },
    ],
    [
      'ex-seed-4',
      {
        id: 'ex-seed-4',
        studentId: '77777777-7777-4777-8777-333333333333',
        institutionId: TEST_INSTITUTION_ID,
        studentAlias: 'Tomás L.',
        title: 'Cartuchera Escolar Reforzada',
        description: 'Dos cierres funcionando perfecto.',
        category: 'Accesorios',
        mode: 'BARTER',
        status: 'APPROVED',
        photoUrls: [],
        pickupLocation: 'Punto de Entrega Escolar Moderado - Secretaría',
        createdAt: now.toISOString(),
      },
    ],
  ]);

  const rewards = new Map<string, SchoolRewardDto>([
    [
      '66666666-6666-4666-8666-111111111111',
      {
        id: '66666666-6666-4666-8666-111111111111',
        institutionId: TEST_INSTITUTION_ID,
        title: 'Pase Prioritario Biblioteca',
        description: 'Acceso prioritario a préstamos de novedades.',
        pointsCost: 50,
        stock: 15,
        isActive: true,
      },
    ],
    [
      '66666666-6666-4666-8666-222222222222',
      {
        id: '66666666-6666-4666-8666-222222222222',
        institutionId: TEST_INSTITUTION_ID,
        title: 'Voucher Almuerzo Solidario',
        description: 'Almuerzo especial en comedor escolar.',
        pointsCost: 150,
        stock: 8,
        isActive: true,
      },
    ],
    [
      '66666666-6666-4666-8666-333333333333',
      {
        id: '66666666-6666-4666-8666-333333333333',
        institutionId: TEST_INSTITUTION_ID,
        title: 'Kit Ecológico de Lápices',
        description: 'Set de lápices reciclados.',
        pointsCost: 80,
        stock: 12,
        isActive: true,
      },
    ],
    [
      '66666666-6666-4666-8666-444444444444',
      {
        id: '66666666-6666-4666-8666-444444444444',
        institutionId: TEST_INSTITUTION_ID,
        title: 'Diploma Alumno Solidario',
        description: 'Reconocimiento institucional trimestral.',
        pointsCost: 100,
        stock: 20,
        isActive: true,
      },
    ],
  ]);

  return {
    institutions,
    parents,
    students,
    passwords,
    limits,
    catalog,
    qrTokens: new Map(),
    idempotentCharges: new Map(),
    transactions,
    blockedAttempts,
    savingsGoals,
    exchangeItems,
    rewards,
    pendingTopUps: new Map(),
  };
}

export function installTestBackend(): {
  state: TestBackendState;
  restore: () => void;
} {
  const originalFetch = globalThis.fetch;
  const state = createInitialState();
  let seq = 1;

  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    const rawUrl = typeof input === 'string' ? input : input.toString();
    const parsedUrl = new URL(rawUrl);
    const path = parsedUrl.pathname.replace(/^\/api\/v1/, '');
    const method = (init?.method || 'GET').toUpperCase();
    const headers = (init?.headers || {}) as Record<string, string>;
    const body =
      typeof init?.body === 'string' ? JSON.parse(init.body) : undefined;

    if (method === 'GET' && path.startsWith('/invitations/validate/')) {
      const code = decodeURIComponent(path.replace('/invitations/validate/', '')).toUpperCase();
      const inst = state.institutions.find((i) => i.code.toUpperCase() === code);
      if (!inst) {
        return jsonResponse(
          { message: 'El código no corresponde a ninguna institución activa.' },
          404
        );
      }
      return jsonResponse({
        valid: true,
        institution: inst,
        invitation: { code: inst.code },
      });
    }

    if (method === 'POST' && path === '/onboarding/register-family') {
      const code = String(body.inviteCode || '').toUpperCase();
      const inst = state.institutions.find((i) => i.code.toUpperCase() === code);
      if (!inst) {
        return jsonResponse(
          { message: 'El código no corresponde a ninguna institución activa.' },
          404
        );
      }
      const parentId = crypto.randomUUID();
      const parent: ParentProfile = {
        id: parentId,
        institutionId: inst.id,
        fullName: body.parent.fullName,
        email: body.parent.email,
        dni: body.parent.dni,
        phone: body.parent.phone,
      };
      state.parents.set(parentId, parent);
      state.passwords.set(parentId, body.parent.password);

      const submittedStudents = [
        body.student,
        ...(Array.isArray(body.additionalStudents) ? body.additionalStudents : []),
      ];
      const createdStudents: StudentProfile[] = submittedStudents.map((st) => {
        const sid = crypto.randomUUID();
        const profile: StudentProfile = {
          id: sid,
          institutionId: inst.id,
          parentId,
          fullName: st.fullName,
          dni: st.dni,
          grade: st.grade,
          dateOfBirth: st.dateOfBirth,
          consentStatus: 'PENDING',
          balanceArsCents: 0,
          dailyLimitCents: 200000,
          dailySpentCents: 0,
          communityPoints: 0,
        };
        state.students.set(sid, profile);
        state.passwords.set(sid, body.parent.password);
        state.limits.set(sid, {
          studentId: sid,
          dailyLimitCents: 200000,
          weeklyLimitCents: 1000000,
          blockedCategories: [],
          isPaused: false,
        });
        return profile;
      });

      return jsonResponse(
        {
          parentId,
          studentId: createdStudents[0]?.id,
          institutionId: inst.id,
          institutionName: inst.name,
          parent,
          students: createdStudents,
        },
        201
      );
    }

    if (method === 'POST' && path === '/onboarding/login') {
      const code = String(body.inviteCode || '').toUpperCase();
      const inst = state.institutions.find((i) => i.code.toUpperCase() === code);
      if (!inst) {
        return jsonResponse({ message: 'Código escolar inválido.' }, 404);
      }
      const identifier = String(body.identifier || '').toLowerCase();
      const password = String(body.password || '');

      const parent = Array.from(state.parents.values()).find(
        (p) =>
          p.institutionId === inst.id &&
          (p.email.toLowerCase() === identifier || p.dni === identifier)
      );
      if (parent && state.passwords.get(parent.id) === password) {
        const linked = Array.from(state.students.values()).filter(
          (s) => s.parentId === parent.id
        );
        return jsonResponse({
          role: 'PARENT',
          institutionId: inst.id,
          institutionName: inst.name,
          user: parent,
          students: linked,
        });
      }

      const student = Array.from(state.students.values()).find(
        (s) => s.institutionId === inst.id && s.dni === identifier
      );
      if (student && state.passwords.get(student.id) === password) {
        return jsonResponse({
          role: 'STUDENT',
          institutionId: inst.id,
          institutionName: inst.name,
          user: student,
          students: [student],
        });
      }

      return jsonResponse(
        { message: 'Credenciales o código escolar inválidos.' },
        401
      );
    }

    if (method === 'POST' && path === '/onboarding/student-password') {
      const actorId = String(headers['x-user-id'] || headers['X-User-Id'] || '');
      const actorRole = String(headers['x-user-role'] || headers['X-User-Role'] || '');
      const targetStudentId =
        actorRole === 'STUDENT' ? actorId : String(body?.studentId || '');
      const student = state.students.get(targetStudentId);
      if (!student) {
        return jsonResponse({ message: 'Alumno no encontrado.' }, 404);
      }
      if (actorRole === 'PARENT' && student.parentId !== actorId) {
        return jsonResponse({ message: 'No autorizado.' }, 403);
      }
      state.passwords.set(student.id, String(body?.newPassword || ''));
      return jsonResponse({ success: true, studentId: student.id });
    }

    if (method === 'POST' && path === '/consents/grant') {
      const student = state.students.get(body.studentId);
      if (!student) {
        return jsonResponse({ message: 'Alumno no encontrado' }, 404);
      }
      student.consentStatus = 'GRANTED';
      return jsonResponse({
        consentId: `c-${seq++}`,
        status: 'GRANTED',
        grantedAt: body.acceptedAt || new Date().toISOString(),
      });
    }

    if (method === 'POST' && path === '/consents/revoke') {
      const student = state.students.get(body.studentId);
      if (!student) {
        return jsonResponse({ message: 'Alumno no encontrado' }, 404);
      }
      student.consentStatus = 'REVOKED';
      return jsonResponse({
        consentId: `c-rev-${seq++}`,
        status: 'REVOKED',
        revokedAt: new Date().toISOString(),
      });
    }

    if (method === 'GET' && path.startsWith('/consents/status/')) {
      const sid = path.replace('/consents/status/', '');
      const student = state.students.get(sid);
      return jsonResponse({ status: student?.consentStatus || 'PENDING' });
    }

    if (method === 'GET' && /^\/students\/[^/]+\/limits$/.test(path)) {
      const sid = path.split('/')[2]!;
      const lim = state.limits.get(sid) || {
        studentId: sid,
        dailyLimitCents: 0,
        weeklyLimitCents: 0,
        blockedCategories: [],
        isPaused: false,
      };
      return jsonResponse(lim);
    }

    if (method === 'PUT' && /^\/students\/[^/]+\/limits$/.test(path)) {
      const sid = path.split('/')[2]!;
      const updated: SpendingLimits = {
        studentId: sid,
        dailyLimitCents: body.dailyLimitCents,
        weeklyLimitCents: body.weeklyLimitCents,
        blockedCategories: body.blockedCategories || [],
        isPaused: Boolean(body.isPaused),
      };
      state.limits.set(sid, updated);
      const student = state.students.get(sid);
      if (student) {
        student.dailyLimitCents = updated.dailyLimitCents;
      }
      return jsonResponse(updated);
    }

    if (method === 'POST' && path === '/wallet/top-up-preference') {
      const student = state.students.get(body.studentId);
      if (!student) {
        return jsonResponse({ message: 'Alumno no encontrado para la recarga' }, 404);
      }
      const preferenceId = `pref_mp_${seq++}`;
      const externalReference = JSON.stringify({
        topupId: preferenceId,
        studentId: student.id,
        amountCents: body.amountCents,
      });
      state.pendingTopUps.set(preferenceId, {
        studentId: student.id,
        amountCents: body.amountCents,
      });
      return jsonResponse({
        preferenceId,
        initPoint: `https://www.mercadopago.com.ar/checkout/v1/redirect?pref_id=${preferenceId}`,
        externalReference,
        sandboxMode: true,
      });
    }

    if (method === 'POST' && path === '/wallet/verify-top-up') {
      const prefId = String(body?.preferenceId || '');
      const pending = state.pendingTopUps.get(prefId);
      const student = state.students.get(String(body?.studentId || ''));
      if (!student) {
        return jsonResponse({ message: 'Alumno no encontrado' }, 404);
      }
      if (pending && pending.studentId === student.id) {
        student.balanceArsCents += pending.amountCents;
        state.transactions.unshift({
          id: `tx-topup-${seq++}`,
          studentId: student.id,
          amountCents: pending.amountCents,
          direction: 'CREDIT',
          referenceType: 'TOP_UP',
          description: 'Carga Mercado Pago',
          createdAt: new Date().toISOString(),
        });
        state.pendingTopUps.delete(prefId);
        return jsonResponse({
          status: 'APPROVED',
          credited: true,
          balanceCents: student.balanceArsCents,
        });
      }
      return jsonResponse({ status: 'PENDING', credited: false });
    }

    if (method === 'POST' && path === '/webhooks/mercadopago') {
      const prefId = body.data?.id || body.id;
      const pending = state.pendingTopUps.get(prefId);
      if (pending) {
        const student = state.students.get(pending.studentId);
        if (student) {
          student.balanceArsCents += pending.amountCents;
          state.transactions.unshift({
            id: `tx-topup-${seq++}`,
            studentId: student.id,
            amountCents: pending.amountCents,
            direction: 'CREDIT',
            referenceType: 'TOP_UP',
            description: 'Carga Mercado Pago',
            createdAt: new Date().toISOString(),
          });
        }
        state.pendingTopUps.delete(prefId);
      }
      return jsonResponse({ received: true });
    }

    if (method === 'GET' && path.startsWith('/wallet/balance/')) {
      const sid = path.replace('/wallet/balance/', '');
      const student = state.students.get(sid);
      return jsonResponse({
        accountId: `acc-${sid}`,
        balanceCents: student?.balanceArsCents ?? 0,
        currency: 'ARS',
      });
    }

    if (method === 'GET' && path.startsWith('/wallet/transactions/')) {
      const sid = path.replace('/wallet/transactions/', '');
      return jsonResponse(state.transactions.filter((t) => t.studentId === sid));
    }

    if (method === 'GET' && path === '/wallet/savings-goals') {
      const sid = headers['x-user-id'] || '';
      return jsonResponse(
        Array.from(state.savingsGoals.values())
          .filter((g) => g.studentId === sid)
          .map((g) => ({ ...g, studentUserId: g.studentId, reservedAmountCents: g.savedAmountCents }))
      );
    }

    if (method === 'POST' && path === '/wallet/savings-goals') {
      const sid = headers['x-user-id'] || '';
      const student = state.students.get(sid);
      if (!student) {
        return jsonResponse({ message: 'Alumno no encontrado.' }, 404);
      }
      const goal: SavingsGoal = {
        id: `goal-${seq++}`,
        studentId: sid,
        title: body.title,
        targetAmountCents: body.targetAmountCents,
        savedAmountCents: 0,
        icon: 'target',
        createdAt: new Date().toISOString(),
      };
      state.savingsGoals.set(goal.id, goal);
      return jsonResponse({ ...goal, reservedAmountCents: 0 }, 201);
    }

    if (method === 'POST' && /^\/wallet\/savings-goals\/[^/]+\/deposit$/.test(path)) {
      const goalId = path.split('/')[3]!;
      const sid = headers['x-user-id'] || '';
      const student = state.students.get(sid);
      const goal = state.savingsGoals.get(goalId);
      if (!student || !goal) {
        return jsonResponse({ message: 'Meta o alumno no encontrado.' }, 404);
      }
      if (student.balanceArsCents < body.amountCents) {
        return jsonResponse({ message: 'Saldo insuficiente en billetera.' }, 400);
      }
      student.balanceArsCents -= body.amountCents;
      goal.savedAmountCents += body.amountCents;
      return jsonResponse({ ...goal, reservedAmountCents: goal.savedAmountCents });
    }

    if (method === 'DELETE' && /^\/wallet\/savings-goals\/[^/]+$/.test(path)) {
      const goalId = path.split('/')[3]!;
      const sid = headers['x-user-id'] || '';
      const student = state.students.get(sid);
      const goal = state.savingsGoals.get(goalId);
      if (!student || !goal) {
        return jsonResponse({ message: 'Meta o alumno no encontrado.' }, 404);
      }
      const released = goal.savedAmountCents;
      student.balanceArsCents += released;
      goal.savedAmountCents = 0;
      state.savingsGoals.delete(goalId);
      return jsonResponse({ ...goal, reservedAmountCents: 0 });
    }

    if (method === 'POST' && path === '/student/payment-token') {
      const sid = headers['x-user-id'] || '';
      const student = state.students.get(sid);
      if (!student) {
        return jsonResponse({ message: 'Alumno no encontrado' }, 404);
      }
      if (student.consentStatus !== 'GRANTED') {
        return jsonResponse(
          { message: 'Falta autorización: el consentimiento parental no está aprobado.' },
          403
        );
      }
      const lim = state.limits.get(sid);
      if (lim?.isPaused) {
        return jsonResponse(
          { message: 'Tu cuenta se encuentra pausada por tu padre o tutor.' },
          403
        );
      }
      const code = String(100000 + ((seq * 13579) % 899999));
      const expiresAt = new Date(Date.now() + 120000).toISOString();
      const record: TestQrToken = {
        token: `cambiazo_qr_${sid.slice(0, 8)}_${code}_${seq++}`,
        code,
        studentId: sid,
        institutionId: student.institutionId,
        expiresAt,
      };
      state.qrTokens.set(record.token, record);
      state.qrTokens.set(record.code, record);
      return jsonResponse({
        token: record.token,
        code: record.code,
        institutionId: record.institutionId,
        expiresAt,
        expiresInSeconds: 120,
      });
    }

    if (method === 'GET' && path === '/kiosk/products') {
      const instId = headers['x-institution-id'];
      const items = Array.from(state.catalog.values()).filter(
        (p) => !instId || p.institutionId === instId
      );
      return jsonResponse(items);
    }

    if (method === 'POST' && path === '/kiosk/charge') {
      const cached = state.idempotentCharges.get(body.idempotencyKey);
      if (cached) {
        return jsonResponse(cached);
      }
      const tokenRecord = state.qrTokens.get(body.paymentTokenOrCode);
      if (!tokenRecord) {
        return jsonResponse({ message: 'Código QR inválido o vencido.' }, 400);
      }
      const student = state.students.get(tokenRecord.studentId);
      if (!student) {
        return jsonResponse({ message: 'Alumno no encontrado.' }, 404);
      }
      const lim = state.limits.get(student.id);
      if (lim?.isPaused) {
        state.blockedAttempts.get(student.id)?.unshift({
          id: `blk-${seq++}`,
          reason: 'Cuenta pausada por tutor',
          timestamp: new Date().toISOString(),
        });
        return jsonResponse({ message: 'La cuenta del alumno está pausada por su tutor.' }, 403);
      }

      let totalCents = 0;
      const names: string[] = [];
      for (const item of body.items as Array<{ productId: string; quantity: number }>) {
        const product = state.catalog.get(item.productId);
        if (!product) {
          return jsonResponse({ message: 'Producto no encontrado.' }, 404);
        }
        if (lim?.blockedCategories.includes(product.category)) {
          const reason = `Categoría ${product.category} bloqueada por tutor`;
          state.blockedAttempts.get(student.id)?.unshift({
            id: `blk-${seq++}`,
            reason,
            timestamp: new Date().toISOString(),
          });
          return jsonResponse(
            { message: `Compra bloqueada: categoría ${product.category} restringida por control parental.` },
            403
          );
        }
        totalCents += product.priceCents * item.quantity;
        names.push(product.name);
      }

      if (lim && lim.dailyLimitCents > 0 && student.dailySpentCents + totalCents > lim.dailyLimitCents) {
        state.blockedAttempts.get(student.id)?.unshift({
          id: `blk-${seq++}`,
          reason: 'Supera el límite diario configurado',
          timestamp: new Date().toISOString(),
        });
        return jsonResponse({ message: 'El monto supera el límite diario permitido.' }, 403);
      }

      if (student.balanceArsCents < totalCents) {
        return jsonResponse({ message: 'Saldo insuficiente en la billetera del alumno.' }, 400);
      }

      student.balanceArsCents -= totalCents;
      student.dailySpentCents += totalCents;
      const remainingDailyLimitCents = Math.max(
        0,
        (lim?.dailyLimitCents ?? 0) - student.dailySpentCents
      );
      const result = {
        transactionId: crypto.randomUUID(),
        totalCents,
        studentId: student.id,
        studentName: student.fullName,
        remainingDailyLimitCents,
      };
      state.idempotentCharges.set(body.idempotencyKey, result);
      state.transactions.unshift({
        id: result.transactionId,
        studentId: student.id,
        amountCents: totalCents,
        direction: 'DEBIT',
        referenceType: 'KIOSK_PURCHASE',
        description: names.join(', '),
        createdAt: new Date().toISOString(),
      });
      return jsonResponse(result);
    }

    if (method === 'GET' && path === '/community/items') {
      const instId = headers['x-institution-id'] || TEST_INSTITUTION_ID;
      const list = Array.from(state.exchangeItems.values()).filter(
        (i) => i.institutionId === instId && i.status === 'APPROVED'
      );
      return jsonResponse(list);
    }

    if (method === 'POST' && path === '/community/items') {
      const sid = headers['x-user-id'] || TEST_STUDENT_ID;
      const instId = headers['x-institution-id'] || TEST_INSTITUTION_ID;
      const created: ExchangeItem = {
        id: `ex-${seq++}`,
        studentId: sid,
        institutionId: instId,
        studentAlias: 'Mateo G.',
        title: body.title,
        description: body.description,
        category: body.category,
        mode: body.mode as ExchangeMode,
        status: 'PENDING',
        photoUrls: body.photoUrls || [],
        pickupLocation: 'Punto de Entrega Escolar Moderado - Secretaría',
        createdAt: new Date().toISOString(),
      };
      state.exchangeItems.set(created.id, created);
      return jsonResponse(created, 201);
    }

    if (method === 'GET' && path === '/community/leaderboard') {
      const student = state.students.get(TEST_STUDENT_ID);
      const entries: LeaderboardEntryDto[] = [
        {
          rank: 1,
          studentId: '77777777-7777-4777-8777-111111111111',
          studentAlias: 'Lucía M.',
          accumulatedPoints: 250,
          badges: ['Gran Donante', 'Eco Campeón'],
        },
        {
          rank: 2,
          studentId: TEST_STUDENT_ID,
          studentAlias: 'Mateo G.',
          accumulatedPoints: student?.communityPoints ?? 120,
          badges: ['Primer Canje', 'Solidario'],
        },
        {
          rank: 3,
          studentId: '77777777-7777-4777-8777-222222222222',
          studentAlias: 'Sofía R.',
          accumulatedPoints: 95,
          badges: ['Primer Canje'],
        },
        {
          rank: 4,
          studentId: '77777777-7777-4777-8777-333333333333',
          studentAlias: 'Tomás L.',
          accumulatedPoints: 70,
          badges: ['Constante'],
        },
        {
          rank: 5,
          studentId: '77777777-7777-4777-8777-444444444444',
          studentAlias: 'Valentina S.',
          accumulatedPoints: 40,
          badges: ['Solidario'],
        },
      ];
      return jsonResponse(entries);
    }

    if (method === 'GET' && path === '/community/rewards') {
      const instId = headers['x-institution-id'] || TEST_INSTITUTION_ID;
      return jsonResponse(
        Array.from(state.rewards.values()).filter((r) => r.institutionId === instId && r.isActive)
      );
    }

    if (method === 'POST' && path === '/community/rewards/redeem') {
      const student = state.students.get(body.studentId);
      const reward = state.rewards.get(body.rewardId);
      if (!student || !reward || !reward.isActive) {
        return jsonResponse({ message: 'La recompensa seleccionada no está disponible.' }, 404);
      }
      if ((reward.stock ?? 0) <= 0) {
        return jsonResponse({ message: 'No hay stock disponible para esta recompensa.' }, 400);
      }
      if (student.communityPoints < reward.pointsCost) {
        return jsonResponse(
          { message: 'Puntos de comunidad insuficientes para canjear esta recompensa.' },
          400
        );
      }
      student.communityPoints -= reward.pointsCost;
      reward.stock = (reward.stock ?? 1) - 1;
      return jsonResponse({ remainingPoints: student.communityPoints });
    }

    if (method === 'GET' && /^\/parents\/children\/[^/]+\/weekly-summary$/.test(path)) {
      const sid = path.split('/')[3]!;
      const student = state.students.get(sid);
      const txs = state.transactions.filter(
        (t) => t.studentId === sid && t.direction === 'DEBIT'
      );
      const totalSpentCents = txs.reduce((sum, t) => sum + t.amountCents, 0);
      const catTotals = new Map<ProductCategory, number>([
        ['HEALTHY_SNACK', 0],
        ['HOT_MEAL', 0],
        ['DRINK', 0],
        ['CANDY', 0],
        ['STATIONERY', 0],
      ]);
      for (const tx of txs) {
        const cat = tx.metadata?.category || 'HEALTHY_SNACK';
        catTotals.set(cat, (catTotals.get(cat) ?? 0) + tx.amountCents);
      }
      const breakdownByCategory = Array.from(catTotals.entries()).map(([category, amountCents]) => ({
        category,
        amountCents,
        percentage: totalSpentCents > 0 ? Math.round((amountCents / totalSpentCents) * 100) : 0,
      }));
      const summary: WeeklyParentSummaryDto = {
        studentId: sid,
        startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        endDate: new Date().toISOString(),
        totalSpentCents,
        breakdownByCategory,
        recentPurchases: txs.map((t) => ({
          id: t.id,
          productName: t.description,
          category: t.metadata?.category || 'HEALTHY_SNACK',
          amountCents: t.amountCents,
          purchasedAt: t.createdAt,
        })),
        communityPointsEarned: student?.communityPoints ?? 0,
        blockedAttemptsCount: state.blockedAttempts.get(sid)?.length ?? 0,
      };
      return jsonResponse(summary);
    }

    return jsonResponse({ message: `Ruta de test no implementada: ${method} ${path}` }, 404);
  }) as typeof fetch;

  return {
    state,
    restore: () => {
      globalThis.fetch = originalFetch;
    },
  };
}
