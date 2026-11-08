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

export class MockMobileApiClient {
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
}

export const mockApiClient = new MockMobileApiClient();

