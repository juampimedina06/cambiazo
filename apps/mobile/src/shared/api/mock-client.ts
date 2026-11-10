import {
  ValidateInviteCodeSchema,
  RegisterParentAndStudentSchema,
  GrantParentalConsentSchema,
  RevokeParentalConsentSchema,
  SpendingLimitsSchema,
  TopUpPreferenceRequestSchema,
  QrPaymentTokenSchema,
  ChargeQrRequestSchema,
  ProductCategorySchema,
  ExchangeModeSchema,
  ModerationStatusSchema,
  CreateExchangeItemSchema,
  SchoolRewardSchema,
  RedeemRewardSchema,
  LeaderboardEntryDtoSchema,
  CategorySpendingBreakdownSchema,
  WeeklyPurchaseItemDtoSchema,
  WeeklyParentSummaryDtoSchema,
  type ValidateInviteCodeDto,
  type RegisterParentAndStudentDto,
  type GrantParentalConsentDto,
  type RevokeParentalConsentDto,
  type SpendingLimitsDto,
  type TopUpPreferenceRequestDto,
  type QrPaymentTokenDto,
  type ChargeQrRequestDto,
  type CatalogProductDto,
  type ConsentStatus,
  type ProductCategory,
  type ExchangeMode,
  type ModerationStatus,
  type CreateExchangeItemDto,
  type SchoolRewardDto,
  type RedeemRewardDto,
  type LeaderboardEntryDto,
  type CategorySpendingBreakdownDto,
  type WeeklyPurchaseItemDto,
  type WeeklyParentSummaryDto,
} from '@cambiazo/shared';

export type ValidateInviteCodeInput = ValidateInviteCodeDto;
export type RegisterParentAndStudentInput = RegisterParentAndStudentDto;
export type GrantParentalConsentInput = GrantParentalConsentDto;
export type RevokeParentalConsentInput = RevokeParentalConsentDto;

export interface MockInstitution {
  id: string;
  name: string;
  code: string;
}

export interface MockParentUser {
  id: string;
  institutionId: string;
  fullName: string;
  email: string;
  dni: string;
  phone?: string;
}

export interface MockStudentUser {
  id: string;
  institutionId: string;
  parentId: string;
  fullName: string;
  dni: string;
  grade: string;
  dateOfBirth: string;
  consentStatus: ConsentStatus;
  balanceArsCents: number;
  dailyLimitCents: number;
  dailySpentCents: number;
  communityPoints: number;
}

export interface MockConsentRecord {
  id: string;
  studentId: string;
  parentId: string;
  status: ConsentStatus;
  acceptedTermsVersion: string;
  acceptedAt: string;
  signatureIp: string;
  revokedAt?: string;
  revocationReason?: string;
}

export interface MockSpendingLimits {
  studentId: string;
  dailyLimitCents: number;
  weeklyLimitCents: number;
  blockedCategories: ProductCategory[];
  isPaused: boolean;
}

export interface MockCatalogProduct {
  id: string;
  institutionId: string;
  name: string;
  category: ProductCategory;
  priceCents: number;
  stock: number;
  isActive: boolean;
  icon: string;
}

export interface MockQrTokenRecord {
  token: string;
  studentId: string;
  institutionId: string;
  expiresAt: string;
  backupCode: string;
}

export interface MockPurchase {
  id: string;
  studentId: string;
  studentName: string;
  amountCents: number;
  itemsSummary: string;
  category: ProductCategory;
  icon: string;
  timestamp: string;
  kioskName: string;
}

export interface MockSavingsGoal {
  id: string;
  studentId: string;
  title: string;
  targetAmountCents: number;
  savedAmountCents: number;
  icon: string;
  createdAt: string;
}

export interface MockExchangeItem {
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

export interface MockBlockedAttempt {
  id: string;
  studentId: string;
  reason: string;
  timestamp: string;
}

export class MockMobileApiClient {
  private baseUrl = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000/api/v1';

  private shouldUseRealBackend(): boolean {
    return process.env.NODE_ENV !== 'test' && process.env.EXPO_PUBLIC_USE_MOCKS === 'false';
  }

  private getHeaders(role: string = 'STUDENT', institutionId?: string, userId?: string) {
    const instId = institutionId || 'e28bb18a-66fe-4f8e-9092-2df283f55001';
    let uid = userId;
    if (!uid) {
      if (role === 'PARENT') uid = '11111111-1111-4111-8111-111111111111';
      else if (role === 'KIOSK') uid = 'kiosk-user-1';
      else uid = '22222222-2222-4222-8222-222222222222';
    }
    return {
      'Content-Type': 'application/json',
      'x-user-id': uid,
      'x-user-role': role,
      'x-institution-id': instId,
    };
  }

  private institutions: MockInstitution[] = [
    {
      id: 'e28bb18a-66fe-4f8e-9092-2df283f55001',
      name: 'Colegio Manuel Belgrano',
      code: 'BELGRANO2026',
    },
    {
      id: 'f39cc29b-77fa-5a9f-8183-3ef394f66002',
      name: 'Instituto San Martín',
      code: 'SANMARTIN2026',
    },
    {
      id: 'a10dd30c-88ab-6b0a-9294-4fa405f77003',
      name: 'Escuela Normal N° 1',
      code: 'NORMAL12026',
    },
  ];

  private parents: Map<string, MockParentUser> = new Map();
  private students: Map<string, MockStudentUser> = new Map();
  private consents: Map<string, MockConsentRecord> = new Map();
  private spendingLimits: Map<string, MockSpendingLimits> = new Map();
  private catalog: Map<string, MockCatalogProduct> = new Map();
  private activeQrTokens: Map<string, MockQrTokenRecord> = new Map();
  private purchases: MockPurchase[] = [];
  private idempotencyCache: Map<string, any> = new Map();
  private savingsGoals: Map<string, MockSavingsGoal> = new Map();
  private exchangeItems: Map<string, MockExchangeItem> = new Map();
  private schoolRewards: Map<string, SchoolRewardDto> = new Map();
  private blockedAttempts: MockBlockedAttempt[] = [];

  constructor() {
    this.seedDefaultData();
  }

  private seedDefaultData() {
    const defaultParentId = '11111111-1111-4111-8111-111111111111';
    const defaultStudentId = '22222222-2222-4222-8222-222222222222';
    const institutionId = this.institutions[0]!.id;

    this.parents.set(defaultParentId, {
      id: defaultParentId,
      institutionId,
      fullName: 'Carolina Gómez',
      email: 'carolina.gomez@ejemplo.com',
      dni: '32109876',
      phone: '+5491122334455',
    });

    this.students.set(defaultStudentId, {
      id: defaultStudentId,
      institutionId,
      parentId: defaultParentId,
      fullName: 'Mateo Gómez',
      dni: '52345678',
      grade: '6° Primaria',
      dateOfBirth: '2014-05-12',
      consentStatus: 'PENDING',
      balanceArsCents: 450000, // $4.500
      dailyLimitCents: 200000, // $2.000
      dailySpentCents: 50000,  // $500
      communityPoints: 120,    // 120 pts
    });

    this.spendingLimits.set(defaultStudentId, {
      studentId: defaultStudentId,
      dailyLimitCents: 200000, // $2.000
      weeklyLimitCents: 1000000, // $10.000
      blockedCategories: [],
      isPaused: false,
    });

    const products: MockCatalogProduct[] = [
      {
        id: '10000000-0000-4000-8000-000000000001',
        institutionId,
        name: 'Alfajor Triple Chocolate',
        category: 'CANDY',
        priceCents: 120000, // $1.200
        stock: 50,
        isActive: true,
        icon: '🍫',
      },
      {
        id: '10000000-0000-4000-8000-000000000002',
        institutionId,
        name: 'Tostado Jamón y Queso',
        category: 'HOT_MEAL',
        priceCents: 200000, // $2.000
        stock: 30,
        isActive: true,
        icon: '🥪',
      },
      {
        id: '10000000-0000-4000-8000-000000000003',
        institutionId,
        name: 'Jugo Natural de Naranja',
        category: 'DRINK',
        priceCents: 100000, // $1.000
        stock: 45,
        isActive: true,
        icon: '🧃',
      },
      {
        id: '10000000-0000-4000-8000-000000000004',
        institutionId,
        name: 'Manzana Roja Fresca',
        category: 'HEALTHY_SNACK',
        priceCents: 60000, // $600
        stock: 40,
        isActive: true,
        icon: '🍎',
      },
      {
        id: '10000000-0000-4000-8000-000000000005',
        institutionId,
        name: 'Barra de Cereal con Miel',
        category: 'HEALTHY_SNACK',
        priceCents: 80000, // $800
        stock: 35,
        isActive: true,
        icon: '🌾',
      },
      {
        id: '10000000-0000-4000-8000-000000000006',
        institutionId,
        name: 'Cuaderno Rayado Escolar',
        category: 'STATIONERY',
        priceCents: 150000, // $1.500
        stock: 20,
        isActive: true,
        icon: '📓',
      },
    ];

    products.forEach((p) => this.catalog.set(p.id, p));

    this.purchases = [
      {
        id: 'pur-1',
        studentId: defaultStudentId,
        studentName: 'Mateo Gómez',
        amountCents: 180000,
        itemsSummary: 'Tostado de Jamón y Queso',
        category: 'HOT_MEAL',
        icon: '🥪',
        timestamp: 'Hoy 10:15 hs',
        kioskName: 'Kiosco Central Belgrano',
      },
      {
        id: 'pur-2',
        studentId: defaultStudentId,
        studentName: 'Mateo Gómez',
        amountCents: 90000,
        itemsSummary: 'Jugo de Naranja 250ml',
        category: 'DRINK',
        icon: '🧃',
        timestamp: 'Ayer 10:20 hs',
        kioskName: 'Kiosco Central Belgrano',
      },
      {
        id: 'pur-3',
        studentId: defaultStudentId,
        studentName: 'Mateo Gómez',
        amountCents: 60000,
        itemsSummary: 'Manzana Roja',
        category: 'HEALTHY_SNACK',
        icon: '🍎',
        timestamp: '05/11 15:45 hs',
        kioskName: 'Kiosco Central Belgrano',
      },
    ];

    this.blockedAttempts = [
      {
        id: 'ba-1',
        studentId: defaultStudentId,
        reason: 'Intento de compra en categoría Golosinas (bloqueada por el tutor)',
        timestamp: 'Ayer 15:30 hs',
      },
    ];

    this.seedSavingsGoals();
    this.seedExchangeItems();
    this.seedSchoolRewards();
  }

  public resetToDefault() {
    this.parents.clear();
    this.students.clear();
    this.consents.clear();
    this.spendingLimits.clear();
    this.catalog.clear();
    this.activeQrTokens.clear();
    this.purchases = [];
    this.idempotencyCache.clear();
    this.savingsGoals.clear();
    this.exchangeItems.clear();
    this.schoolRewards.clear();
    this.blockedAttempts = [];
    this.seedDefaultData();
  }

  /**
   * Validates invite code against ValidateInviteCodeSchema and checks institution registry
   */
  public async validateInviteCode(code: string): Promise<{
    success: boolean;
    institution?: MockInstitution;
    error?: string;
  }> {
    const validation = ValidateInviteCodeSchema.safeParse({ code: code.trim().toUpperCase() });
    if (!validation.success) {
      return {
        success: false,
        error: validation.error.errors[0]?.message || 'Código escolar inválido',
      };
    }

    if (this.shouldUseRealBackend()) {
      try {
        const res = await fetch(`${this.baseUrl}/invitations/validate/${encodeURIComponent(validation.data.code)}`);
        const json = await res.json();
        if (!res.ok) {
          return {
            success: false,
            error: json.message || 'El código no corresponde a ninguna institución activa.',
          };
        }
        return {
          success: true,
          institution: {
            id: json.institutionId,
            name: json.institutionName,
            code: validation.data.code,
          },
        };
      } catch (err: any) {
        return { success: false, error: err.message || 'Error conectando con el servidor' };
      }
    }

    const institution = this.institutions.find(
      (inst) => inst.code.toUpperCase() === validation.data.code
    );

    if (!institution) {
      return {
        success: false,
        error: 'El código no corresponde a ninguna institución activa.',
      };
    }

    return {
      success: true,
      institution,
    };
  }

  /**
   * Registers Parent and Student under RegisterParentAndStudentSchema.
   * Sets initial student consentStatus to PENDING.
   */
  public async registerFamily(input: RegisterParentAndStudentInput): Promise<{
    success: boolean;
    parent?: MockParentUser;
    student?: MockStudentUser;
    error?: string;
  }> {
    const validation = RegisterParentAndStudentSchema.safeParse(input);
    if (!validation.success) {
      return {
        success: false,
        error: validation.error.errors[0]?.message || 'Datos de registro inválidos',
      };
    }

    if (this.shouldUseRealBackend()) {
      try {
        const res = await fetch(`${this.baseUrl}/onboarding/register-family`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(validation.data),
        });
        const json = await res.json();
        if (!res.ok) {
          return { success: false, error: json.message || 'Error registrando familia' };
        }
        const parentUser: MockParentUser = {
          id: json.parent?.id || `p-${Date.now()}`,
          institutionId: json.parent?.institutionId || '',
          fullName: json.parent?.fullName || validation.data.parent.fullName,
          email: json.parent?.email || validation.data.parent.email,
          dni: json.parent?.dni || validation.data.parent.dni,
          phone: json.parent?.phone || validation.data.parent.phone,
        };
        const studentUser: MockStudentUser = {
          id: json.student?.id || `s-${Date.now()}`,
          institutionId: json.student?.institutionId || parentUser.institutionId,
          parentId: parentUser.id,
          fullName: json.student?.fullName || validation.data.student.fullName,
          dni: json.student?.dni || validation.data.student.dni,
          grade: json.student?.grade || validation.data.student.grade,
          dateOfBirth: json.student?.dateOfBirth || validation.data.student.dateOfBirth,
          consentStatus: json.student?.consentStatus || 'PENDING',
          balanceArsCents: 0,
          dailyLimitCents: 150000,
          dailySpentCents: 0,
          communityPoints: 0,
        };
        this.parents.set(parentUser.id, parentUser);
        this.students.set(studentUser.id, studentUser);
        return { success: true, parent: parentUser, student: studentUser };
      } catch (err: any) {
        return { success: false, error: err.message || 'Error conectando con el servidor' };
      }
    }

    const inviteResult = await this.validateInviteCode(validation.data.inviteCode);
    if (!inviteResult.success || !inviteResult.institution) {
      return {
        success: false,
        error: inviteResult.error || 'Código escolar inválido',
      };
    }

    const institutionId = inviteResult.institution.id;
    const parentId = `p-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const studentId = `s-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

    const parent: MockParentUser = {
      id: parentId,
      institutionId,
      fullName: validation.data.parent.fullName,
      email: validation.data.parent.email,
      dni: validation.data.parent.dni,
      phone: validation.data.parent.phone,
    };

    const student: MockStudentUser = {
      id: studentId,
      institutionId,
      parentId,
      fullName: validation.data.student.fullName,
      dni: validation.data.student.dni,
      grade: validation.data.student.grade,
      dateOfBirth: validation.data.student.dateOfBirth,
      consentStatus: 'PENDING',
      balanceArsCents: 0,
      dailyLimitCents: 150000,
      dailySpentCents: 0,
      communityPoints: 0,
    };

    this.parents.set(parentId, parent);
    this.students.set(studentId, student);

    return {
      success: true,
      parent,
      student,
    };
  }

  /**
   * Grants digital parental consent under Ley 25.326 using GrantParentalConsentSchema.
   */
  public async grantParentalConsent(input: GrantParentalConsentInput): Promise<{
    success: boolean;
    consentRecord?: MockConsentRecord;
    error?: string;
  }> {
    const validation = GrantParentalConsentSchema.safeParse(input);
    if (!validation.success) {
      return {
        success: false,
        error: validation.error.errors[0]?.message || 'Datos de consentimiento inválidos',
      };
    }

    const student = this.students.get(validation.data.studentId);

    if (this.shouldUseRealBackend()) {
      try {
        const res = await fetch(`${this.baseUrl}/consents/grant`, {
          method: 'POST',
          headers: this.getHeaders('PARENT', student?.institutionId, student?.parentId),
          body: JSON.stringify(validation.data),
        });
        const json = await res.json();
        if (!res.ok) {
          return { success: false, error: json.message || 'Error al firmar consentimiento' };
        }
        if (student) student.consentStatus = 'GRANTED';
        return { success: true, consentRecord: json };
      } catch (err: any) {
        return { success: false, error: err.message || 'Error conectando con el servidor' };
      }
    }

    if (!student) {
      return {
        success: false,
        error: 'Alumno no encontrado para otorgar consentimiento',
      };
    }

    student.consentStatus = 'GRANTED';
    const consentId = `c-${Date.now()}`;
    const consentRecord: MockConsentRecord = {
      id: consentId,
      studentId: student.id,
      parentId: student.parentId,
      status: 'GRANTED',
      acceptedTermsVersion: validation.data.acceptedTermsVersion,
      acceptedAt: validation.data.acceptedAt,
      signatureIp: validation.data.signatureIp,
    };

    this.consents.set(student.id, consentRecord);

    return {
      success: true,
      consentRecord,
    };
  }

  /**
   * Revokes parental consent using RevokeParentalConsentSchema.
   * Instantly pauses/blocks student account access.
   */
  public async revokeParentalConsent(input: RevokeParentalConsentInput): Promise<{
    success: boolean;
    consentRecord?: MockConsentRecord;
    error?: string;
  }> {
    const validation = RevokeParentalConsentSchema.safeParse(input);
    if (!validation.success) {
      return {
        success: false,
        error: validation.error.errors[0]?.message || 'Motivo de revocación inválido',
      };
    }

    const student = this.students.get(validation.data.studentId);

    if (this.shouldUseRealBackend()) {
      try {
        const res = await fetch(`${this.baseUrl}/consents/revoke`, {
          method: 'POST',
          headers: this.getHeaders('PARENT', student?.institutionId, student?.parentId),
          body: JSON.stringify(validation.data),
        });
        const json = await res.json();
        if (!res.ok) {
          return { success: false, error: json.message || 'Error al revocar consentimiento' };
        }
        if (student) student.consentStatus = 'REVOKED';
        return { success: true, consentRecord: json };
      } catch (err: any) {
        return { success: false, error: err.message || 'Error conectando con el servidor' };
      }
    }

    if (!student) {
      return {
        success: false,
        error: 'Alumno no encontrado para revocar consentimiento',
      };
    }

    student.consentStatus = 'REVOKED';
    let consentRecord = this.consents.get(student.id);
    if (!consentRecord) {
      consentRecord = {
        id: `c-rev-${Date.now()}`,
        studentId: student.id,
        parentId: student.parentId,
        status: 'REVOKED',
        acceptedTermsVersion: 'v1.0',
        acceptedAt: new Date().toISOString(),
        signatureIp: '127.0.0.1',
        revokedAt: new Date().toISOString(),
        revocationReason: validation.data.reason,
      };
    } else {
      consentRecord.status = 'REVOKED';
      consentRecord.revokedAt = new Date().toISOString();
      consentRecord.revocationReason = validation.data.reason;
    }

    this.consents.set(student.id, consentRecord);

    return {
      success: true,
      consentRecord,
    };
  }

  /**
   * Verification guard: checks whether student has GRANTED status to enter student portal.
   */
  public checkStudentAccess(studentId: string): {
    allowed: boolean;
    status: ConsentStatus;
    student?: MockStudentUser;
    reason?: string;
  } {
    const student = this.students.get(studentId);
    if (!student) {
      return {
        allowed: false,
        status: 'PENDING',
        reason: 'Alumno no registrado en el sistema',
      };
    }

    if (student.consentStatus === 'GRANTED') {
      return {
        allowed: true,
        status: 'GRANTED',
        student,
      };
    }

    return {
      allowed: false,
      status: student.consentStatus,
      student,
      reason:
        student.consentStatus === 'REVOKED'
          ? 'El consentimiento parental fue revocado por tu tutor.'
          : 'El consentimiento parental aún no ha sido firmado.',
    };
  }

  public getStudent(studentId: string): MockStudentUser | undefined {
    return this.students.get(studentId);
  }

  public getParent(parentId: string): MockParentUser | undefined {
    return this.parents.get(parentId);
  }

  public getConsent(studentId: string): MockConsentRecord | undefined {
    return this.consents.get(studentId);
  }

  // --- Wave 2: Spending Limits & Controls ---

  public getSpendingLimits(studentId: string): MockSpendingLimits {
    const existing = this.spendingLimits.get(studentId);
    if (existing) {
      return existing;
    }
    const fallback: MockSpendingLimits = {
      studentId,
      dailyLimitCents: 200000,
      weeklyLimitCents: 1000000,
      blockedCategories: [],
      isPaused: false,
    };
    this.spendingLimits.set(studentId, fallback);
    return fallback;
  }

  public async updateSpendingLimits(input: SpendingLimitsDto): Promise<{
    success: boolean;
    limits?: MockSpendingLimits;
    error?: string;
  }> {
    const validation = SpendingLimitsSchema.safeParse(input);
    if (!validation.success) {
      return {
        success: false,
        error: validation.error.errors[0]?.message || 'Límites de gasto inválidos',
      };
    }

    const studentId = validation.data.studentId || input.studentId;
    if (!studentId) {
      return {
        success: false,
        error: 'El ID del alumno es obligatorio',
      };
    }

    const student = this.students.get(studentId);

    if (this.shouldUseRealBackend()) {
      try {
        const res = await fetch(`${this.baseUrl}/students/${studentId}/limits`, {
          method: 'PUT',
          headers: this.getHeaders('PARENT', student?.institutionId, student?.parentId),
          body: JSON.stringify(validation.data),
        });
        const json = await res.json();
        if (!res.ok) {
          return { success: false, error: json.message || 'Error al actualizar límites de gasto' };
        }
        const updated: MockSpendingLimits = {
          studentId,
          dailyLimitCents: json.dailyLimitCents ?? validation.data.dailyLimitCents,
          weeklyLimitCents: json.weeklyLimitCents ?? validation.data.weeklyLimitCents,
          blockedCategories: json.blockedCategories ?? validation.data.blockedCategories,
          isPaused: json.isPaused ?? validation.data.isPaused,
        };
        this.spendingLimits.set(studentId, updated);
        if (student) student.dailyLimitCents = updated.dailyLimitCents;
        return { success: true, limits: updated };
      } catch (err: any) {
        return { success: false, error: err.message || 'Error conectando con el servidor' };
      }
    }

    if (!student) {
      return {
        success: false,
        error: 'Alumno no encontrado para configurar límites',
      };
    }

    student.dailyLimitCents = validation.data.dailyLimitCents;

    const updated: MockSpendingLimits = {
      studentId,
      dailyLimitCents: validation.data.dailyLimitCents,
      weeklyLimitCents: validation.data.weeklyLimitCents,
      blockedCategories: validation.data.blockedCategories,
      isPaused: validation.data.isPaused,
    };

    this.spendingLimits.set(studentId, updated);

    return {
      success: true,
      limits: updated,
    };
  }

  public isAccountPaused(studentId: string): boolean {
    const limits = this.getSpendingLimits(studentId);
    return limits.isPaused;
  }

  // --- Wave 2: 1-to-1 Balance Top-Up (Mercado Pago simulation) ---

  public async createTopUpPreference(input: TopUpPreferenceRequestDto): Promise<{
    success: boolean;
    preferenceId?: string;
    initPoint?: string;
    amountCents?: number;
    studentId?: string;
    error?: string;
  }> {
    const validation = TopUpPreferenceRequestSchema.safeParse(input);
    if (!validation.success) {
      return {
        success: false,
        error: validation.error.errors[0]?.message || 'Monto de recarga inválido',
      };
    }

    const student = this.students.get(validation.data.studentId);

    if (this.shouldUseRealBackend()) {
      try {
        const res = await fetch(`${this.baseUrl}/wallet/top-up-preference`, {
          method: 'POST',
          headers: this.getHeaders('PARENT', student?.institutionId, student?.parentId),
          body: JSON.stringify(validation.data),
        });
        const json = await res.json();
        if (!res.ok) {
          return { success: false, error: json.message || 'Error al generar preferencia de recarga' };
        }
        return {
          success: true,
          preferenceId: json.preferenceId,
          initPoint: json.initPoint,
          amountCents: validation.data.amountCents,
          studentId: validation.data.studentId,
        };
      } catch (err: any) {
        return { success: false, error: err.message || 'Error conectando con el servidor' };
      }
    }

    if (!student) {
      return {
        success: false,
        error: 'Alumno no encontrado para la recarga',
      };
    }

    const preferenceId = `pref_mp_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const initPoint = `https://www.mercadopago.com.ar/checkout/v1/redirect?pref_id=${preferenceId}`;

    return {
      success: true,
      preferenceId,
      initPoint,
      amountCents: validation.data.amountCents,
      studentId: validation.data.studentId,
    };
  }

  public async completeTopUp(
    studentId: string,
    amountCents: number,
    preferenceId: string
  ): Promise<{
    success: boolean;
    newBalanceArsCents?: number;
    error?: string;
  }> {
    if (amountCents <= 0) {
      return {
        success: false,
        error: 'El monto a acreditar debe ser mayor a cero',
      };
    }

    const student = this.students.get(studentId);
    if (!student) {
      return {
        success: false,
        error: 'Alumno no encontrado para acreditar saldo',
      };
    }

    // 1-to-1 exact ratio ($1 loaded = $1 in kiosk balance, 1 ARS = 100 cents)
    student.balanceArsCents += amountCents;

    return {
      success: true,
      newBalanceArsCents: student.balanceArsCents,
    };
  }

  // --- Wave 2: School Kiosk Catalog ---

  public getCatalogProducts(institutionId?: string): MockCatalogProduct[] {
    const all = Array.from(this.catalog.values());
    if (!institutionId) {
      return all.filter((p) => p.isActive);
    }
    return all.filter((p) => p.isActive && p.institutionId === institutionId);
  }

  public getCatalogProduct(productId: string): MockCatalogProduct | undefined {
    return this.catalog.get(productId);
  }

  // --- Wave 2: Ephemeral QR Payment Token & 6-digit Code ---

  public async generateQrPaymentToken(studentId: string): Promise<{
    success: boolean;
    qrToken?: QrPaymentTokenDto;
    backupCode?: string;
    expiresInSeconds?: number;
    error?: string;
  }> {
    const student = this.students.get(studentId);

    if (this.shouldUseRealBackend()) {
      try {
        const res = await fetch(`${this.baseUrl}/student/payment-token`, {
          method: 'POST',
          headers: this.getHeaders('STUDENT', student?.institutionId, studentId),
        });
        const json = await res.json();
        if (!res.ok) {
          return { success: false, error: json.message || 'Error al generar código QR' };
        }
        const qrToken: QrPaymentTokenDto = {
          token: json.ephemeralToken || json.qrPayload,
          studentId,
          institutionId: student?.institutionId || 'e28bb18a-66fe-4f8e-9092-2df283f55001',
          expiresAt: json.expiresAt,
        };
        return {
          success: true,
          qrToken,
          backupCode: json.backupCode,
          expiresInSeconds: json.expiresInSeconds || 120,
        };
      } catch (err: any) {
        return { success: false, error: err.message || 'Error conectando con el servidor' };
      }
    }

    if (!student) {
      return {
        success: false,
        error: 'Alumno no encontrado',
      };
    }

    if (student.consentStatus !== 'GRANTED') {
      return {
        success: false,
        error: 'El alumno no tiene consentimiento parental firmado.',
      };
    }

    const limits = this.getSpendingLimits(studentId);
    if (limits.isPaused) {
      return {
        success: false,
        error: 'La cuenta del alumno está pausada por el tutor. No se pueden generar pagos.',
      };
    }

    // Generate 6-digit numeric backup code
    const backupCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 120 * 1000).toISOString();
    const token = `cambiazo_qr_${studentId.substring(0, 8)}_${backupCode}_${Date.now()}`;

    const qrToken: QrPaymentTokenDto = {
      token,
      studentId,
      institutionId: student.institutionId,
      expiresAt,
    };

    const record: MockQrTokenRecord = {
      token,
      studentId,
      institutionId: student.institutionId,
      expiresAt,
      backupCode,
    };

    this.activeQrTokens.set(token, record);
    this.activeQrTokens.set(backupCode, record);

    return {
      success: true,
      qrToken,
      backupCode,
      expiresInSeconds: 120,
    };
  }

  // --- Wave 2: Sub-5s Kiosk POS Charging with Idempotency & Category Blocking ---

  public async chargeQrPayment(input: ChargeQrRequestDto): Promise<{
    success: boolean;
    chargeId?: string;
    totalChargedCents?: number;
    studentName?: string;
    remainingDailyLimitCents?: number;
    itemsSummary?: string;
    error?: string;
  }> {
    const validation = ChargeQrRequestSchema.safeParse(input);
    if (!validation.success) {
      return {
        success: false,
        error: validation.error.errors[0]?.message || 'Solicitud de cobro inválida',
      };
    }

    if (this.shouldUseRealBackend()) {
      try {
        const res = await fetch(`${this.baseUrl}/kiosk/charge`, {
          method: 'POST',
          headers: this.getHeaders('KIOSK', undefined, 'kiosk-user-1'),
          body: JSON.stringify(validation.data),
        });
        const json = await res.json();
        if (!res.ok) {
          return { success: false, error: json.message || 'Error al procesar cobro' };
        }
        return {
          success: true,
          chargeId: json.transactionId,
          totalChargedCents: json.totalAmountCents,
          studentName: json.studentName || 'Alumno',
          remainingDailyLimitCents: json.remainingDailyLimitCents,
          itemsSummary: validation.data.items.map((i) => `${this.catalog.get(i.productId)?.name || 'Producto'} (x${i.quantity})`).join(', '),
        };
      } catch (err: any) {
        return { success: false, error: err.message || 'Error conectando con el servidor' };
      }
    }

    const { paymentTokenOrCode, items, idempotencyKey } = validation.data;

    // Idempotency check: if processed, return cached outcome
    if (this.idempotencyCache.has(idempotencyKey)) {
      return this.idempotencyCache.get(idempotencyKey);
    }

    const qrRecord = this.activeQrTokens.get(paymentTokenOrCode.trim());
    if (!qrRecord) {
      return {
        success: false,
        error: 'Código QR o clave de 6 dígitos inválida.',
      };
    }

    if (new Date(qrRecord.expiresAt).getTime() < Date.now()) {
      return {
        success: false,
        error: 'El código QR ha expirado (validez de 120 segundos).',
      };
    }

    const student = this.students.get(qrRecord.studentId);
    if (!student) {
      return {
        success: false,
        error: 'Alumno no encontrado para procesar el cobro.',
      };
    }

    if (student.consentStatus !== 'GRANTED') {
      return {
        success: false,
        error: 'El alumno no posee consentimiento parental firmado.',
      };
    }

    const limits = this.getSpendingLimits(student.id);
    if (limits.isPaused) {
      this.recordBlockedAttempt(student.id, 'Cuenta pausada por el tutor');
      return {
        success: false,
        error: 'Cobro rechazado: La cuenta del alumno está pausada por el tutor.',
      };
    }

    let totalCents = 0;
    const summaryParts: string[] = [];
    let mainCategory: ProductCategory = 'CANDY';
    let mainIcon = '🛍️';

    for (const item of items) {
      const product = this.catalog.get(item.productId);
      if (!product) {
        return {
          success: false,
          error: `Producto no encontrado en el catálogo escolar (${item.productId})`,
        };
      }

      // Check category blocking
      if (limits.blockedCategories.includes(product.category)) {
        this.recordBlockedAttempt(student.id, `Categoría '${product.category}' bloqueada por el tutor`);
        return {
          success: false,
          error: `Cobro rechazado: La categoría '${product.category}' se encuentra bloqueada por el tutor.`,
        };
      }

      totalCents += product.priceCents * item.quantity;
      summaryParts.push(item.quantity > 1 ? `${item.quantity}x ${product.name}` : product.name);
      mainCategory = product.category;
      mainIcon = product.icon;
    }

    if (student.balanceArsCents < totalCents) {
      const balanceFormatted = (student.balanceArsCents / 100).toLocaleString('es-AR');
      return {
        success: false,
        error: `Cobro rechazado: Saldo insuficiente en la billetera escolar ($${balanceFormatted} disponible).`,
      };
    }

    if (student.dailySpentCents + totalCents > limits.dailyLimitCents) {
      this.recordBlockedAttempt(student.id, 'Supera el límite diario escolar');
      const limitFormatted = (limits.dailyLimitCents / 100).toLocaleString('es-AR');
      return {
        success: false,
        error: `Cobro rechazado: Supera el límite diario escolar fijado por el tutor ($${limitFormatted}).`,
      };
    }

    // Apply charge
    student.balanceArsCents -= totalCents;
    student.dailySpentCents += totalCents;

    // Invalidate token
    this.activeQrTokens.delete(qrRecord.token);
    this.activeQrTokens.delete(qrRecord.backupCode);

    const itemsSummary = summaryParts.join(' + ');
    const chargeId = `chg_${Date.now()}`;
    const newPurchase: MockPurchase = {
      id: chargeId,
      studentId: student.id,
      studentName: student.fullName,
      amountCents: totalCents,
      itemsSummary,
      category: mainCategory,
      icon: mainIcon,
      timestamp: 'Ahora mismo',
      kioskName: 'Kiosco Central Belgrano',
    };
    this.purchases.unshift(newPurchase);

    const remainingDaily = Math.max(0, limits.dailyLimitCents - student.dailySpentCents);
    const result = {
      success: true,
      chargeId,
      totalChargedCents: totalCents,
      studentName: student.fullName,
      remainingDailyLimitCents: remainingDaily,
      itemsSummary,
    };

    this.idempotencyCache.set(idempotencyKey, result);
    return result;
  }

  // --- Wave 2: Purchases / Notifications History ---

  public getPurchases(studentId?: string): MockPurchase[] {
    if (!studentId) {
      return [...this.purchases];
    }
    return this.purchases.filter((p) => p.studentId === studentId);
  }

  // --- Wave 3: Blocked Attempts & Weekly Summary for Parents ---

  public recordBlockedAttempt(studentId: string, reason: string): void {
    this.blockedAttempts.unshift({
      id: `ba-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
      studentId,
      reason,
      timestamp: 'Hoy ' + new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' }),
    });
  }

  public getBlockedAttempts(studentId: string): MockBlockedAttempt[] {
    return this.blockedAttempts.filter((b) => b.studentId === studentId);
  }

  public getWeeklyParentSummary(studentId: string): WeeklyParentSummaryDto {
    const student = this.students.get(studentId) || this.students.get('22222222-2222-4222-8222-222222222222');
    const studentIdToUse = student ? student.id : '22222222-2222-4222-8222-222222222222';

    const now = new Date();
    const startOfWeek = new Date(now);
    const day = now.getDay();
    const diff = now.getDate() - day + (day === 0 ? -6 : 1); // Monday
    startOfWeek.setDate(diff);
    startOfWeek.setHours(0, 0, 0, 0);

    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);

    const studentPurchases = this.purchases.filter((p) => p.studentId === studentIdToUse);

    const recentPurchases: WeeklyPurchaseItemDto[] = studentPurchases.map((p, idx) => {
      const id = p.id.includes('-') && p.id.length === 36
        ? p.id
        : `44444444-4444-4444-8444-${String(idx + 1).padStart(12, '0')}`;

      const purchaseTime = new Date(now.getTime() - (idx + 1) * 3600 * 1000 * 6).toISOString();

      return {
        id,
        productName: p.itemsSummary,
        category: p.category,
        amountCents: p.amountCents,
        purchasedAt: purchaseTime,
      };
    });

    const totalSpentCents = recentPurchases.reduce((sum, item) => sum + item.amountCents, 0);

    const categories: ProductCategory[] = ['HEALTHY_SNACK', 'HOT_MEAL', 'DRINK', 'CANDY', 'STATIONERY'];
    const breakdownByCategory: CategorySpendingBreakdownDto[] = categories.map((cat) => {
      const catAmount = recentPurchases
        .filter((item) => item.category === cat)
        .reduce((sum, item) => sum + item.amountCents, 0);

      const percentage = totalSpentCents > 0
        ? Math.round((catAmount / totalSpentCents) * 100)
        : 0;

      return {
        category: cat,
        amountCents: catAmount,
        percentage,
      };
    });

    const studentBlocked = this.blockedAttempts.filter((b) => b.studentId === studentIdToUse);

    const summary: WeeklyParentSummaryDto = {
      studentId: studentIdToUse,
      startDate: startOfWeek.toISOString().split('T')[0]!,
      endDate: endOfWeek.toISOString().split('T')[0]!,
      totalSpentCents,
      breakdownByCategory,
      recentPurchases,
      communityPointsEarned: student?.communityPoints ?? 120,
      blockedAttemptsCount: studentBlocked.length,
    };

    return WeeklyParentSummaryDtoSchema.parse(summary);
  }

  // --- Wave 3: Educational Savings Goals ---

  private seedSavingsGoals() {
    const defaultStudentId = '22222222-2222-4222-8222-222222222222';
    const goals: MockSavingsGoal[] = [
      {
        id: 'goal-1',
        studentId: defaultStudentId,
        title: 'Libro de Aventuras Escolar',
        targetAmountCents: 300000, // $3.000
        savedAmountCents: 180000,  // $1.800
        icon: '📚',
        createdAt: '2026-11-01T10:00:00.000Z',
      },
      {
        id: 'goal-2',
        studentId: defaultStudentId,
        title: 'Almuerzo Especial de Fin de Mes',
        targetAmountCents: 250000, // $2.500
        savedAmountCents: 100000,  // $1.000
        icon: '🥪',
        createdAt: '2026-11-03T11:30:00.000Z',
      },
    ];
    goals.forEach((g) => this.savingsGoals.set(g.id, g));
  }

  public getSavingsGoals(studentId: string): MockSavingsGoal[] {
    return Array.from(this.savingsGoals.values()).filter((g) => g.studentId === studentId);
  }

  public async createSavingsGoal(
    studentId: string,
    input: { title: string; targetAmountCents: number; icon?: string }
  ): Promise<{ success: boolean; goal?: MockSavingsGoal; error?: string }> {
    if (!input.title || input.title.trim().length < 2) {
      return { success: false, error: 'El título de la meta debe tener al menos 2 caracteres.' };
    }
    if (!input.targetAmountCents || input.targetAmountCents <= 0) {
      return { success: false, error: 'El monto objetivo debe ser mayor a cero.' };
    }

    if (this.shouldUseRealBackend()) {
      try {
        const res = await fetch(`${this.baseUrl}/wallet/savings-goals`, {
          method: 'POST',
          headers: this.getHeaders('STUDENT', undefined, studentId),
          body: JSON.stringify({
            title: input.title.trim(),
            targetAmountCents: input.targetAmountCents,
          }),
        });
        const json = await res.json();
        if (!res.ok) {
          return { success: false, error: json.message || 'Error al crear meta de ahorro' };
        }
        const goal: MockSavingsGoal = {
          id: json.id,
          studentId: json.studentUserId || studentId,
          title: json.title,
          targetAmountCents: json.targetAmountCents,
          savedAmountCents: json.savedAmountCents || 0,
          icon: input.icon || '🎯',
          createdAt: json.createdAt || new Date().toISOString(),
        };
        this.savingsGoals.set(goal.id, goal);
        return { success: true, goal };
      } catch (err: any) {
        return { success: false, error: err.message || 'Error conectando con el servidor' };
      }
    }

    const student = this.students.get(studentId);
    if (!student) {
      return { success: false, error: 'Alumno no encontrado.' };
    }

    const id = `goal-${Date.now()}`;
    const newGoal: MockSavingsGoal = {
      id,
      studentId,
      title: input.title.trim(),
      targetAmountCents: input.targetAmountCents,
      savedAmountCents: 0,
      icon: input.icon || '🎯',
      createdAt: new Date().toISOString(),
    };

    this.savingsGoals.set(id, newGoal);
    return { success: true, goal: newGoal };
  }

  public async allocateToGoal(
    studentId: string,
    goalId: string,
    amountCents: number
  ): Promise<{ success: boolean; goal?: MockSavingsGoal; error?: string }> {
    if (amountCents <= 0) {
      return { success: false, error: 'El monto a separar debe ser mayor a cero.' };
    }

    if (this.shouldUseRealBackend()) {
      try {
        const res = await fetch(`${this.baseUrl}/wallet/savings-goals/${goalId}/deposit`, {
          method: 'POST',
          headers: this.getHeaders('STUDENT', undefined, studentId),
          body: JSON.stringify({ amountCents }),
        });
        const json = await res.json();
        if (!res.ok) {
          return { success: false, error: json.message || 'Error al guardar dinero en la meta' };
        }
        const goal = this.savingsGoals.get(goalId);
        if (goal) {
          goal.savedAmountCents = json.savedAmountCents ?? (goal.savedAmountCents + amountCents);
        }
        return { success: true, goal: goal || json };
      } catch (err: any) {
        return { success: false, error: err.message || 'Error conectando con el servidor' };
      }
    }

    const student = this.students.get(studentId);
    if (!student) {
      return { success: false, error: 'Alumno no encontrado.' };
    }

    const goal = this.savingsGoals.get(goalId);
    if (!goal || goal.studentId !== studentId) {
      return { success: false, error: 'Meta no encontrada.' };
    }

    if (student.balanceArsCents < amountCents) {
      const balanceFormatted = (student.balanceArsCents / 100).toLocaleString('es-AR');
      return {
        success: false,
        error: `Saldo insuficiente en tu billetera ($${balanceFormatted}).`,
      };
    }

    student.balanceArsCents -= amountCents;
    goal.savedAmountCents += amountCents;

    return { success: true, goal };
  }

  public async withdrawFromGoal(
    studentId: string,
    goalId: string,
    amountCents: number
  ): Promise<{ success: boolean; goal?: MockSavingsGoal; error?: string }> {
    if (amountCents <= 0) {
      return { success: false, error: 'El monto a liberar debe ser mayor a cero.' };
    }

    if (this.shouldUseRealBackend()) {
      try {
        const res = await fetch(`${this.baseUrl}/wallet/savings-goals/${goalId}`, {
          method: 'DELETE',
          headers: this.getHeaders('STUDENT', undefined, studentId),
        });
        if (!res.ok) {
          const json = await res.json().catch(() => ({}));
          return { success: false, error: json.message || 'Error al liberar fondos de la meta' };
        }
        const goal = this.savingsGoals.get(goalId);
        if (goal) {
          goal.savedAmountCents = Math.max(0, goal.savedAmountCents - amountCents);
        }
        return { success: true, goal };
      } catch (err: any) {
        return { success: false, error: err.message || 'Error conectando con el servidor' };
      }
    }

    const student = this.students.get(studentId);
    if (!student) {
      return { success: false, error: 'Alumno no encontrado.' };
    }

    const goal = this.savingsGoals.get(goalId);
    if (!goal || goal.studentId !== studentId) {
      return { success: false, error: 'Meta no encontrada.' };
    }

    if (goal.savedAmountCents < amountCents) {
      return { success: false, error: 'El monto a liberar supera lo ahorrado en la meta.' };
    }

    goal.savedAmountCents -= amountCents;
    student.balanceArsCents += amountCents;

    return { success: true, goal };
  }

  // --- Wave 3: Community School Items Feed & Publication ---

  private seedExchangeItems() {
    const institutionId = this.institutions[0]!.id;
    const defaultStudentId = '22222222-2222-4222-8222-222222222222';

    const items: MockExchangeItem[] = [
      {
        id: 'item-1',
        studentId: '55555555-5555-4555-8555-555555555551',
        institutionId,
        studentAlias: 'Lucía M.',
        title: 'Diccionario Escolar Español Ilustrado',
        description: 'En excelente estado, completo, sin hojas rotas. Ideal para 5° y 6° grado.',
        category: 'Libros',
        mode: 'BARTER',
        status: 'APPROVED',
        photoUrls: ['https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=400'],
        pickupLocation: 'Punto de Entrega Escolar Moderado (Biblioteca)',
        createdAt: '2026-11-04T12:00:00.000Z',
      },
      {
        id: 'item-2',
        studentId: '55555555-5555-4555-8555-555555555552',
        institutionId,
        studentAlias: 'Sofía R.',
        title: 'Set de Reglas y Escuadra Geometría',
        description: 'Regla de 30cm, escuadra y transportador plástico transparente sin rayones.',
        category: 'Útiles',
        mode: 'DONATION',
        status: 'APPROVED',
        photoUrls: ['https://images.unsplash.com/photo-1588072432836-e10032774350?w=400'],
        pickupLocation: 'Punto de Entrega Escolar Moderado (Recepción)',
        createdAt: '2026-11-05T09:30:00.000Z',
      },
      {
        id: 'item-3',
        studentId: defaultStudentId,
        institutionId,
        studentAlias: 'Mateo Gómez',
        title: 'Calculadora Científica Casio',
        description: 'Préstamo para pruebas de matemática y física. Con tapa protectora y pila nueva.',
        category: 'Tecnología',
        mode: 'LOAN',
        status: 'APPROVED',
        photoUrls: ['https://images.unsplash.com/photo-1594980596870-8aa52a78d8cd?w=400'],
        pickupLocation: 'Punto de Entrega Escolar Moderado (Laboratorio)',
        createdAt: '2026-11-06T14:15:00.000Z',
      },
      {
        id: 'item-4',
        studentId: '55555555-5555-4555-8555-555555555553',
        institutionId,
        studentAlias: 'Joaquín T.',
        title: 'Compás de Precisión Metálico',
        description: 'Compás metálico con repuesto de minas incluido. Listo para usar en dibujo técnico.',
        category: 'Útiles',
        mode: 'DONATION',
        status: 'APPROVED',
        photoUrls: ['https://images.unsplash.com/photo-1583485088034-697b5bc54ccd?w=400'],
        pickupLocation: 'Punto de Entrega Escolar Moderado (Recepción)',
        createdAt: '2026-11-07T08:45:00.000Z',
      },
      {
        id: 'item-5',
        studentId: '55555555-5555-4555-8555-555555555554',
        institutionId,
        studentAlias: 'Valentina P.',
        title: 'Mochila Escolar Azul Reforzada',
        description: 'Mochila con tres compartimentos, cierres en perfecto estado.',
        category: 'Accesorios',
        mode: 'BARTER',
        status: 'APPROVED',
        photoUrls: ['https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400'],
        pickupLocation: 'Punto de Entrega Escolar Moderado (Biblioteca)',
        createdAt: '2026-11-07T16:00:00.000Z',
      },
    ];

    items.forEach((item) => this.exchangeItems.set(item.id, item));
  }

  public getExchangeItems(institutionId: string, modeFilter?: ExchangeMode): MockExchangeItem[] {
    return Array.from(this.exchangeItems.values()).filter((item) => {
      if (item.institutionId !== institutionId || item.status !== 'APPROVED') {
        return false;
      }
      if (modeFilter && item.mode !== modeFilter) {
        return false;
      }
      return true;
    });
  }

  public async createExchangeItem(
    studentId: string,
    institutionId: string,
    input: CreateExchangeItemDto
  ): Promise<{ success: boolean; item?: MockExchangeItem; error?: string }> {
    const validation = CreateExchangeItemSchema.safeParse(input);
    if (!validation.success) {
      return {
        success: false,
        error: validation.error.errors[0]?.message || 'Datos del útil escolar inválidos',
      };
    }

    if (this.shouldUseRealBackend()) {
      try {
        const res = await fetch(`${this.baseUrl}/community/items`, {
          method: 'POST',
          headers: this.getHeaders('STUDENT', institutionId, studentId),
          body: JSON.stringify(validation.data),
        });
        const json = await res.json();
        if (!res.ok) {
          return { success: false, error: json.message || 'Error al publicar artículo' };
        }
        const item: MockExchangeItem = {
          id: json.id,
          studentId: json.studentUserId || studentId,
          institutionId: json.institutionId || institutionId,
          studentAlias: 'Alumno',
          title: json.title,
          description: json.description,
          category: json.category,
          mode: json.mode,
          status: json.moderationStatus || json.status || 'PENDING',
          photoUrls: json.photoUrls || [],
          pickupLocation: json.pickupLocation || 'Punto de Entrega Escolar',
          createdAt: json.createdAt || new Date().toISOString(),
        };
        this.exchangeItems.set(item.id, item);
        return { success: true, item };
      } catch (err: any) {
        return { success: false, error: err.message || 'Error conectando con el servidor' };
      }
    }

    const student = this.students.get(studentId);
    const studentAlias = student
      ? student.fullName.split(' ')[0] + ' ' + (student.fullName.split(' ')[1]?.[0] || '') + '.'
      : 'Alumno';

    const id = `item-${Date.now()}`;
    const newItem: MockExchangeItem = {
      id,
      studentId,
      institutionId,
      studentAlias,
      title: validation.data.title,
      description: validation.data.description,
      category: validation.data.category,
      mode: validation.data.mode,
      status: 'PENDING',
      photoUrls: validation.data.photoUrls,
      pickupLocation: 'Punto de Entrega Escolar Moderado (Mesa de Recepción)',
      createdAt: new Date().toISOString(),
    };

    this.exchangeItems.set(id, newItem);

    return {
      success: true,
      item: newItem,
    };
  }

  // --- Wave 3: Points, Badges, School Leaderboard & Rewards ---

  private seedSchoolRewards() {
    const institutionId = this.institutions[0]!.id;

    const rewards: SchoolRewardDto[] = [
      {
        id: '66666666-6666-4666-8666-111111111111',
        institutionId,
        title: 'Pase Libre de Biblioteca por 1 Mes',
        description: 'Acceso ilimitado a préstamo especial de libros y cómics escolares.',
        pointsCost: 50,
        stock: 15,
        isActive: true,
      },
      {
        id: '66666666-6666-4666-8666-222222222222',
        institutionId,
        title: 'Kit de Marcadores Ecológicos',
        description: 'Set de 6 marcadores escolares recargables con tinta al agua.',
        pointsCost: 80,
        stock: 8,
        isActive: true,
      },
      {
        id: '66666666-6666-4666-8666-333333333333',
        institutionId,
        title: 'Mención de Honor al Mérito Solidario',
        description: 'Diploma escolar oficial firmado por dirección en el acto escolar.',
        pointsCost: 100,
        stock: 25,
        isActive: true,
      },
      {
        id: '66666666-6666-4666-8666-444444444444',
        institutionId,
        title: 'Almuerzo Saludable Especial en Kiosco',
        description: 'Tostado especial + jugo natural en el recreo largo como reconocimiento escolar.',
        pointsCost: 150,
        stock: 5,
        isActive: true,
      },
    ];

    rewards.forEach((r) => {
      SchoolRewardSchema.parse(r);
      this.schoolRewards.set(r.id, r);
    });
  }

  public async getLeaderboard(institutionId: string): Promise<LeaderboardEntryDto[]> {
    if (this.shouldUseRealBackend()) {
      try {
        const res = await fetch(`${this.baseUrl}/community/leaderboard`, {
          headers: this.getHeaders('STUDENT', institutionId),
        });
        if (res.ok) {
          const json = await res.json();
          if (Array.isArray(json) && json.length > 0) return json;
        }
      } catch {}
    }

    const defaultStudentId = '22222222-2222-4222-8222-222222222222';
    const student = this.students.get(defaultStudentId);
    const studentPoints = student?.communityPoints ?? 120;

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
        studentId: defaultStudentId,
        studentAlias: 'Mateo G.',
        accumulatedPoints: studentPoints,
        badges: ['Primer Canje', 'Solidario'],
      },
      {
        rank: 3,
        studentId: '77777777-7777-4777-8777-333333333333',
        studentAlias: 'Sofía R.',
        accumulatedPoints: 95,
        badges: ['Generosidad'],
      },
      {
        rank: 4,
        studentId: '77777777-7777-4777-8777-444444444444',
        studentAlias: 'Joaquín T.',
        accumulatedPoints: 70,
        badges: ['Participación'],
      },
      {
        rank: 5,
        studentId: '77777777-7777-4777-8777-555555555555',
        studentAlias: 'Valentina P.',
        accumulatedPoints: 50,
        badges: ['Eco Amigo'],
      },
    ];

    entries.forEach((e) => LeaderboardEntryDtoSchema.parse(e));
    return entries;
  }

  public async getSchoolRewards(institutionId: string): Promise<SchoolRewardDto[]> {
    if (this.shouldUseRealBackend()) {
      try {
        const res = await fetch(`${this.baseUrl}/community/rewards`, {
          headers: this.getHeaders('STUDENT', institutionId),
        });
        if (res.ok) {
          const json = await res.json();
          if (Array.isArray(json) && json.length > 0) return json;
        }
      } catch {}
    }

    return Array.from(this.schoolRewards.values()).filter(
      (r) => r.isActive && r.institutionId === institutionId
    );
  }

  public async redeemReward(input: RedeemRewardDto): Promise<{
    success: boolean;
    remainingPoints?: number;
    error?: string;
  }> {
    const validation = RedeemRewardSchema.safeParse(input);
    if (!validation.success) {
      return {
        success: false,
        error: validation.error.errors[0]?.message || 'Solicitud de canje inválida',
      };
    }

    const reward = this.schoolRewards.get(validation.data.rewardId);
    if (!reward || !reward.isActive) {
      return {
        success: false,
        error: 'La recompensa escolar seleccionada no está disponible.',
      };
    }

    if (reward.stock !== undefined && reward.stock <= 0) {
      return {
        success: false,
        error: 'No hay stock disponible para esta recompensa.',
      };
    }

    const student = this.students.get(validation.data.studentId);

    if (this.shouldUseRealBackend()) {
      try {
        const res = await fetch(`${this.baseUrl}/community/rewards/redeem`, {
          method: 'POST',
          headers: this.getHeaders('STUDENT', undefined, validation.data.studentId),
          body: JSON.stringify(validation.data),
        });
        const json = await res.json();
        if (!res.ok) {
          return { success: false, error: json.message || 'Error al canjear recompensa' };
        }
        return {
          success: true,
          remainingPoints: json.remainingPoints ?? 0,
        };
      } catch (err: any) {
        return { success: false, error: err.message || 'Error conectando con el servidor' };
      }
    }

    if (!student) {
      return {
        success: false,
        error: 'Alumno no encontrado.',
      };
    }

    if (student.communityPoints < reward.pointsCost) {
      return {
        success: false,
        error: `Puntos insuficientes. Necesitás ${reward.pointsCost} puntos (tenés ${student.communityPoints} pts).`,
      };
    }

    student.communityPoints -= reward.pointsCost;
    if (reward.stock !== undefined) {
      reward.stock -= 1;
    }

    return {
      success: true,
      remainingPoints: student.communityPoints,
    };
  }

  public async fetchCatalogProducts(institutionId?: string): Promise<MockCatalogProduct[]> {
    if (this.shouldUseRealBackend()) {
      try {
        const res = await fetch(`${this.baseUrl}/kiosk/products`, {
          headers: this.getHeaders('KIOSK', institutionId),
        });
        if (res.ok) {
          const json = await res.json();
          if (Array.isArray(json) && json.length > 0) {
            const mapped: MockCatalogProduct[] = json.map((p) => ({
              id: p.id,
              institutionId: p.institutionId || institutionId || 'e28bb18a-66fe-4f8e-9092-2df283f55001',
              name: p.name,
              category: p.category,
              priceCents: p.priceCents,
              stock: p.stock ?? 10,
              isActive: p.isActive ?? true,
              icon: p.icon || '🥪',
            }));
            mapped.forEach((p) => this.catalog.set(p.id, p));
            return mapped;
          }
        }
      } catch {}
    }
    return this.getCatalogProducts(institutionId);
  }

  public async fetchExchangeItems(institutionId: string, modeFilter?: ExchangeMode): Promise<MockExchangeItem[]> {
    if (this.shouldUseRealBackend()) {
      try {
        const res = await fetch(`${this.baseUrl}/community/items?status=APPROVED`, {
          headers: this.getHeaders('STUDENT', institutionId),
        });
        if (res.ok) {
          const json = await res.json();
          if (Array.isArray(json) && json.length > 0) {
            const mapped: MockExchangeItem[] = json.map((item) => ({
              id: item.id,
              studentId: item.studentUserId,
              institutionId: item.institutionId,
              studentAlias: 'Alumno',
              title: item.title,
              description: item.description,
              category: item.category,
              mode: item.mode,
              status: item.moderationStatus || 'APPROVED',
              photoUrls: item.photoUrls || [],
              pickupLocation: item.pickupLocation || 'Punto de Entrega Escolar',
              createdAt: item.createdAt || new Date().toISOString(),
            }));
            mapped.forEach((item) => this.exchangeItems.set(item.id, item));
            return this.getExchangeItems(institutionId, modeFilter);
          }
        }
      } catch {}
    }
    return this.getExchangeItems(institutionId, modeFilter);
  }

  public async fetchWeeklyParentSummary(studentId: string): Promise<WeeklyParentSummaryDto> {
    if (this.shouldUseRealBackend()) {
      try {
        const student = this.students.get(studentId);
        const res = await fetch(`${this.baseUrl}/parents/children/${studentId}/weekly-summary`, {
          headers: this.getHeaders('PARENT', student?.institutionId, student?.parentId),
        });
        if (res.ok) {
          return await res.json();
        }
      } catch {}
    }
    return this.getWeeklyParentSummary(studentId);
  }
}

export const mockApiClient = new MockMobileApiClient();

