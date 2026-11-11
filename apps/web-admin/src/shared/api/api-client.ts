import { mockAdapter } from './mock-adapter';
import { getActiveInstitutionId } from './tenant';
import {
  Institution,
  CreateInstitutionInput,
  InvitationCode,
  CreateInvitationInput,
  StudentRosterItem,
  InstitutionStatus,
  ConsentStatus,
  CatalogProduct,
  CreateCatalogProductInput,
  ChargeQrRequestInput,
  KioskWithdrawalRequestInput,
  KioskSale,
  KioskWithdrawal,
  KioskLedgerBalance,
  ProductCategory,
  ExchangeItem,
  ExchangeMode,
  ModerationStatus,
  ModerateExchangeItemDto,
  SchoolReward,
  LeaderboardEntry,
  RewardRedemption,
  SchoolReportMetrics,
  SuperAdminGlobalMetrics,
} from './types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1';

export class ApiClient {
  private useMocks: boolean;
  private baseUrl: string;

  constructor(useMocks: boolean = false, baseUrl: string = API_BASE_URL) {
    this.useMocks = useMocks;
    this.baseUrl = baseUrl;
  }

  private getHeaders(role: string = 'SUPER_ADMIN', institutionId?: string): Record<string, string> {
    const defaultInstId = getActiveInstitutionId();
    const targetInstitutionId = institutionId || (role !== 'SUPER_ADMIN' ? defaultInstId : undefined);

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'x-user-id': 'admin-web-user',
      'x-user-role': role,
      'x-user-name': 'Administrador Web',
      'x-user-email': 'admin@cambiazo.internal',
    };
    if (targetInstitutionId) {
      headers['x-institution-id'] = targetInstitutionId;
    }
    return headers;
  }

  // Institutions (Super Admin)
  async getInstitutions(): Promise<Institution[]> {
    if (this.useMocks) {
      return mockAdapter.getInstitutions();
    }
    const res = await fetch(`${this.baseUrl}/institutions`, {
      headers: this.getHeaders('SUPER_ADMIN'),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || `Error al cargar instituciones (${res.status})`);
    }
    return res.json();
  }

  async getInstitutionById(id: string): Promise<Institution | null> {
    if (this.useMocks) {
      return mockAdapter.getInstitutionById(id);
    }
    const res = await fetch(`${this.baseUrl}/institutions/${id}`, {
      headers: this.getHeaders('SUPER_ADMIN'),
    });
    if (res.status === 404) return null;
    if (!res.ok) {
      throw new Error(`Error al consultar institución (${res.status})`);
    }
    return res.json();
  }

  async createInstitution(data: CreateInstitutionInput): Promise<Institution> {
    if (this.useMocks) {
      return mockAdapter.createInstitution(data);
    }
    const res = await fetch(`${this.baseUrl}/institutions`, {
      method: 'POST',
      headers: this.getHeaders('SUPER_ADMIN'),
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || `Error al crear institución (${res.status})`);
    }
    const json = await res.json();
    return json?.institution ? json.institution : json;
  }

  async updateInstitutionStatus(
    id: string,
    status: InstitutionStatus
  ): Promise<Institution> {
    if (this.useMocks) {
      return mockAdapter.updateInstitutionStatus(id, status);
    }
    const res = await fetch(`${this.baseUrl}/institutions/${id}/status`, {
      method: 'PATCH',
      headers: this.getHeaders('SUPER_ADMIN'),
      body: JSON.stringify({ status }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || `Error al actualizar estado (${res.status})`);
    }
    return res.json();
  }

  private normalizeInvitation(inv: any): InvitationCode {
    const rawDate = inv.expiresAt;
    const expiresAt = rawDate
      ? typeof rawDate === 'string'
        ? rawDate
        : new Date(rawDate).toISOString()
      : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString();

    const createdAt = inv.createdAt
      ? typeof inv.createdAt === 'string'
        ? inv.createdAt
        : new Date(inv.createdAt).toISOString()
      : new Date().toISOString();

    return {
      id: inv.id,
      institutionId: inv.institutionId,
      code: inv.code,
      maxUses: typeof inv.maxUses === 'number' ? inv.maxUses : 100,
      currentUses: typeof inv.currentUses === 'number' ? inv.currentUses : (inv.usedCount ?? 0),
      expiresAt,
      createdAt,
      isActive: inv.isActive !== undefined ? Boolean(inv.isActive) : true,
    };
  }

  // Invitations (School Admin)
  async getInvitations(institutionId?: string): Promise<InvitationCode[]> {
    if (this.useMocks) {
      const list = await mockAdapter.getInvitations(institutionId);
      return list.map((inv) => this.normalizeInvitation(inv));
    }
    const query = institutionId ? `?institutionId=${institutionId}` : '';
    const res = await fetch(`${this.baseUrl}/invitations${query}`, {
      headers: this.getHeaders('SCHOOL_ADMIN', institutionId),
    });
    if (!res.ok) return [];
    const data = await res.json();
    if (Array.isArray(data)) {
      return data.map((inv) => this.normalizeInvitation(inv));
    }
    return [];
  }

  async createInvitation(data: CreateInvitationInput): Promise<InvitationCode> {
    if (this.useMocks) {
      const created = await mockAdapter.createInvitation(data);
      return this.normalizeInvitation(created);
    }
    const res = await fetch(`${this.baseUrl}/invitations`, {
      method: 'POST',
      headers: this.getHeaders('SCHOOL_ADMIN', data.institutionId),
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Error creating invitation');
    }
    const raw = await res.json();
    return this.normalizeInvitation(raw);
  }

  // Student and Family Roster (School Admin)
  async getStudentsRoster(institutionId?: string): Promise<StudentRosterItem[]> {
    if (this.useMocks) {
      return mockAdapter.getStudentsRoster(institutionId);
    }
    const query = institutionId ? `?institutionId=${institutionId}` : '';
    const res = await fetch(`${this.baseUrl}/consents/audit/all${query}`, {
      headers: this.getHeaders('SCHOOL_ADMIN', institutionId),
    });
    if (!res.ok) return [];
    const raw = await res.json().catch(() => []);
    if (!Array.isArray(raw)) return [];
    return raw.map((item: any) => ({
      id: item.id || `rost-${item.studentId || item.id || Math.random()}`,
      studentId: item.studentId || item.id || '',
      institutionId: item.institutionId || institutionId || '',
      studentName: item.studentName || item.fullName || item.name || 'Alumno sin nombre',
      studentDni: item.studentDni || item.dni || '',
      grade: item.grade || item.year || item.course || 'Sin curso',
      parentName: item.parentName || item.guardianName || 'Tutor',
      parentEmail: item.parentEmail || item.email || '',
      parentPhone: item.parentPhone || item.phone || '',
      consentStatus: item.consentStatus || item.status || 'PENDING',
      consentAudit: item.consentAudit || {},
      walletBalanceCents: item.walletBalanceCents ?? item.balanceArsCents ?? 0,
      communityPoints: item.communityPoints ?? 0,
      createdAt: item.createdAt || new Date().toISOString(),
    }));
  }

  async updateStudentConsent(
    studentId: string,
    status: ConsentStatus,
    reason?: string
  ): Promise<StudentRosterItem> {
    if (this.useMocks) {
      return mockAdapter.updateStudentConsent(studentId, status, reason);
    }
    const endpoint = status === 'REVOKED' ? '/consents/revoke' : '/consents/grant';
    const institutionId = getActiveInstitutionId();
    const res = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'POST',
      headers: this.getHeaders('PARENT', institutionId),
      body: JSON.stringify({
        studentId,
        reason,
        acceptedTermsVersion: 'v1.0',
        acceptedAt: new Date().toISOString(),
        signatureIp: '127.0.0.1',
      }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Error al actualizar el consentimiento parental');
    }
    const json = await res.json().catch(() => ({}));
    const roster = await this.getStudentsRoster(institutionId).catch(() => []);
    const matched = roster.find((item) => item.studentId === studentId || item.id === studentId);
    if (matched) {
      return {
        ...matched,
        consentStatus: status,
        consentAudit: {
          ...matched.consentAudit,
          revocationReason: reason,
          signedAt: new Date().toISOString(),
        },
        ...json,
      };
    }
    return {
      id: studentId,
      studentId,
      institutionId,
      studentName: json.studentName || 'Alumno',
      studentDni: json.studentDni || '-',
      grade: json.grade || 'Sin curso',
      parentName: json.parentName || 'Tutor',
      parentEmail: json.parentEmail || '',
      parentPhone: json.parentPhone || '',
      consentStatus: status,
      consentAudit: {
        acceptedTermsVersion: 'v1.0',
        signedAt: new Date().toISOString(),
        revocationReason: reason,
      },
      walletBalanceCents: json.walletBalanceCents ?? 0,
      communityPoints: json.communityPoints ?? 0,
      createdAt: json.createdAt || new Date().toISOString(),
    };
  }

  // Kiosk Catalog Management
  async getCatalogProducts(
    institutionId?: string,
    category?: ProductCategory
  ): Promise<CatalogProduct[]> {
    if (this.useMocks) {
      return mockAdapter.getCatalogProducts(institutionId, category);
    }
    const params = new URLSearchParams();
    if (institutionId) params.append('institutionId', institutionId);
    if (category) params.append('category', category);
    const query = params.toString() ? `?${params.toString()}` : '';
    const res = await fetch(`${this.baseUrl}/kiosk/products${query}`, {
      headers: this.getHeaders('KIOSK', institutionId),
    });
    if (!res.ok) throw new Error('Failed to fetch catalog products');
    return res.json();
  }

  async getCatalogProductById(id: string): Promise<CatalogProduct | null> {
    if (this.useMocks) {
      return mockAdapter.getCatalogProductById(id);
    }
    const res = await fetch(`${this.baseUrl}/kiosk/products/${id}`, {
      headers: this.getHeaders('KIOSK'),
    });
    if (res.status === 404) return null;
    if (!res.ok) throw new Error('Failed to fetch catalog product');
    return res.json();
  }

  async createCatalogProduct(
    data: CreateCatalogProductInput
  ): Promise<CatalogProduct> {
    if (this.useMocks) {
      return mockAdapter.createCatalogProduct(data);
    }
    const res = await fetch(`${this.baseUrl}/kiosk/products`, {
      method: 'POST',
      headers: this.getHeaders('KIOSK', data.institutionId),
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Error creating product');
    }
    return res.json();
  }

  async updateCatalogProduct(
    id: string,
    data: Partial<CreateCatalogProductInput>
  ): Promise<CatalogProduct> {
    if (this.useMocks) {
      return mockAdapter.updateCatalogProduct(id, data);
    }
    const res = await fetch(`${this.baseUrl}/kiosk/products/${id}`, {
      method: 'PATCH',
      headers: this.getHeaders('KIOSK'),
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to update product');
    return res.json();
  }

  async deleteCatalogProduct(id: string): Promise<boolean> {
    if (this.useMocks) {
      return mockAdapter.deleteCatalogProduct(id);
    }
    const res = await fetch(`${this.baseUrl}/kiosk/products/${id}`, {
      method: 'DELETE',
      headers: this.getHeaders('KIOSK'),
    });
    if (!res.ok) throw new Error('Failed to delete product');
    return true;
  }

  // Kiosk Sales Monitor & POS Web Terminal
  async getKioskSales(institutionId?: string): Promise<KioskSale[]> {
    if (this.useMocks) {
      return mockAdapter.getKioskSales(institutionId);
    }
    const query = institutionId ? `?institutionId=${institutionId}` : '';
    const res = await fetch(`${this.baseUrl}/kiosk/sales${query}`, {
      headers: this.getHeaders('KIOSK', institutionId),
    });
    if (!res.ok) throw new Error('Failed to fetch kiosk sales');
    return res.json();
  }

  async processKioskCharge(
    charge: ChargeQrRequestInput,
    institutionId?: string
  ): Promise<KioskSale> {
    if (this.useMocks) {
      return mockAdapter.processKioskCharge(charge, institutionId);
    }
    const res = await fetch(`${this.baseUrl}/kiosk/charge`, {
      method: 'POST',
      headers: this.getHeaders('KIOSK', institutionId),
      body: JSON.stringify(charge),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Error processing kiosk charge');
    }
    return res.json();
  }

  // Kiosk Ledger Balance & Mercado Pago Withdrawals
  async getKioskLedgerBalance(
    institutionId?: string
  ): Promise<KioskLedgerBalance> {
    if (this.useMocks) {
      return mockAdapter.getKioskLedgerBalance(institutionId);
    }
    const query = institutionId ? `?institutionId=${institutionId}` : '';
    const res = await fetch(`${this.baseUrl}/kiosk/ledger-balance${query}`, {
      headers: this.getHeaders('KIOSK', institutionId),
    });
    if (!res.ok) throw new Error('Failed to fetch kiosk ledger balance');
    return res.json();
  }

  async getKioskWithdrawals(
    institutionId?: string
  ): Promise<KioskWithdrawal[]> {
    if (this.useMocks) {
      return mockAdapter.getKioskWithdrawals(institutionId);
    }
    const query = institutionId ? `?institutionId=${institutionId}` : '';
    const res = await fetch(`${this.baseUrl}/kiosk/withdrawals${query}`, {
      headers: this.getHeaders('KIOSK', institutionId),
    });
    if (!res.ok) throw new Error('Failed to fetch kiosk withdrawals');
    return res.json();
  }

  async requestKioskWithdrawal(
    request: KioskWithdrawalRequestInput,
    institutionId?: string
  ): Promise<KioskWithdrawal> {
    if (this.useMocks) {
      return mockAdapter.requestKioskWithdrawal(request, institutionId);
    }
    const res = await fetch(`${this.baseUrl}/kiosk/withdrawals`, {
      method: 'POST',
      headers: this.getHeaders('KIOSK', institutionId),
      body: JSON.stringify(request),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Error requesting withdrawal');
    }
    const json = await res.json();
    return {
      id: json.withdrawalId || json.id || `wd-${Date.now()}`,
      institutionId: institutionId || 'e28bb18a-66fe-4f8e-9092-2df283f55001',
      amountCents: json.amountCents ?? request.amountCents,
      mercadoPagoAliasOrCvu: json.destination || request.mercadoPagoAliasOrCvu,
      status: 'PROCESSED',
      idempotencyKey: request.idempotencyKey,
      createdAt: new Date().toISOString(),
      processedAt: new Date().toISOString(),
    };
  }

  // School Moderation Desk & Pickup Point
  async getExchangeItems(
    institutionId?: string,
    status?: ModerationStatus,
    mode?: ExchangeMode
  ): Promise<ExchangeItem[]> {
    if (this.useMocks) {
      return mockAdapter.getExchangeItems(institutionId, status, mode);
    }
    const params = new URLSearchParams();
    if (institutionId) params.append('institutionId', institutionId);
    if (status) params.append('status', status);
    if (mode) params.append('mode', mode);
    const query = params.toString() ? `?${params.toString()}` : '';
    const res = await fetch(`${this.baseUrl}/community/items${query}`, {
      headers: this.getHeaders('SCHOOL_ADMIN', institutionId),
    });
    if (!res.ok) {
      throw new Error('Failed to fetch exchange items');
    }
    return res.json();
  }

  async getExchangeItemById(id: string): Promise<ExchangeItem | null> {
    if (this.useMocks) {
      return mockAdapter.getExchangeItemById(id);
    }
    const res = await fetch(`${this.baseUrl}/community/items/${id}`, {
      headers: this.getHeaders('SCHOOL_ADMIN'),
    });
    if (res.status === 404) return null;
    if (!res.ok) throw new Error('Failed to fetch exchange item');
    return res.json();
  }

  async moderateExchangeItem(
    payload: ModerateExchangeItemDto
  ): Promise<ExchangeItem> {
    if (this.useMocks) {
      return mockAdapter.moderateExchangeItem(payload);
    }
    const res = await fetch(
      `${this.baseUrl}/community/items/${payload.itemId}/moderate`,
      {
        method: 'PATCH',
        headers: this.getHeaders('SCHOOL_ADMIN'),
        body: JSON.stringify(payload),
      }
    );
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Error moderating exchange item');
    }
    return res.json();
  }

  // School Rewards & Badges ABM
  async getSchoolRewards(institutionId?: string): Promise<SchoolReward[]> {
    if (this.useMocks) {
      return mockAdapter.getSchoolRewards(institutionId);
    }
    const query = institutionId ? `?institutionId=${institutionId}` : '';
    const res = await fetch(`${this.baseUrl}/community/rewards${query}`, {
      headers: this.getHeaders('SCHOOL_ADMIN', institutionId),
    });
    if (!res.ok) {
      throw new Error('Failed to fetch school rewards');
    }
    return res.json();
  }

  async createSchoolReward(reward: SchoolReward): Promise<SchoolReward> {
    if (this.useMocks) {
      return mockAdapter.createSchoolReward(reward);
    }
    const res = await fetch(`${this.baseUrl}/community/rewards`, {
      method: 'POST',
      headers: this.getHeaders('SCHOOL_ADMIN', reward.institutionId),
      body: JSON.stringify(reward),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Error creating school reward');
    }
    return res.json();
  }

  async updateSchoolReward(
    id: string,
    partial: Partial<SchoolReward>
  ): Promise<SchoolReward> {
    if (this.useMocks) {
      return mockAdapter.updateSchoolReward(id, partial);
    }
    const res = await fetch(`${this.baseUrl}/community/rewards/${id}`, {
      method: 'PATCH',
      headers: this.getHeaders('SCHOOL_ADMIN'),
      body: JSON.stringify(partial),
    });
    if (!res.ok) throw new Error('Failed to update school reward');
    return res.json();
  }

  async deleteSchoolReward(id: string): Promise<boolean> {
    if (this.useMocks) {
      return mockAdapter.deleteSchoolReward(id);
    }
    const res = await fetch(`${this.baseUrl}/community/rewards/${id}`, {
      method: 'DELETE',
      headers: this.getHeaders('SCHOOL_ADMIN'),
    });
    if (!res.ok) throw new Error('Failed to delete school reward');
    return true;
  }

  // School Leaderboard & Gamification Ranking
  async getSchoolLeaderboard(
    institutionId?: string
  ): Promise<LeaderboardEntry[]> {
    if (this.useMocks) {
      return mockAdapter.getSchoolLeaderboard(institutionId);
    }
    const query = institutionId ? `?institutionId=${institutionId}` : '';
    const res = await fetch(`${this.baseUrl}/community/leaderboard${query}`, {
      headers: this.getHeaders('SCHOOL_ADMIN', institutionId),
    });
    if (!res.ok) {
      throw new Error('Failed to fetch leaderboard');
    }
    return res.json();
  }

  // Reward Redemptions Management
  async getRewardRedemptions(
    institutionId?: string
  ): Promise<RewardRedemption[]> {
    if (this.useMocks) {
      return mockAdapter.getRewardRedemptions(institutionId);
    }
    const query = institutionId ? `?institutionId=${institutionId}` : '';
    const res = await fetch(`${this.baseUrl}/community/rewards/redemptions${query}`, {
      headers: this.getHeaders('SCHOOL_ADMIN', institutionId),
    });
    if (!res.ok) throw new Error('Failed to fetch reward redemptions');
    return res.json();
  }

  async fulfillRewardRedemption(
    redemptionId: string
  ): Promise<RewardRedemption> {
    if (this.useMocks) {
      return mockAdapter.fulfillRewardRedemption(redemptionId);
    }
    const res = await fetch(
      `${this.baseUrl}/community/rewards/redemptions/${redemptionId}/fulfill`,
      {
        method: 'PATCH',
        headers: this.getHeaders('SCHOOL_ADMIN'),
      }
    );
    if (!res.ok) throw new Error('Failed to fulfill reward redemption');
    return res.json();
  }

  // School Reports Dashboard
  async getSchoolReportMetrics(
    institutionId?: string
  ): Promise<SchoolReportMetrics> {
    if (this.useMocks) {
      return mockAdapter.getSchoolReportMetrics(institutionId);
    }
    const [sales, items] = await Promise.all([
      this.getKioskSales(institutionId).catch(() => []),
      this.getExchangeItems(institutionId).catch(() => []),
    ]);

    let healthyCount = 0;
    let candyCount = 0;
    let totalSpentCents = 0;
    const categoryMap = new Map<ProductCategory, { count: number; cents: number }>();

    for (const sale of sales) {
      for (const item of sale.items) {
        totalSpentCents += item.subtotalCents;
        const current = categoryMap.get(item.category) || { count: 0, cents: 0 };
        categoryMap.set(item.category, {
          count: current.count + item.quantity,
          cents: current.cents + item.subtotalCents,
        });

        if (item.category === 'HEALTHY_SNACK') healthyCount += item.quantity;
        else if (item.category === 'CANDY') candyCount += item.quantity;
      }
    }

    const totalFoodCount = healthyCount + candyCount;
    const healthyPercentage = totalFoodCount > 0 ? Math.round((healthyCount / totalFoodCount) * 100) : 0;
    const candyPercentage = totalFoodCount > 0 ? Math.round((candyCount / totalFoodCount) * 100) : 0;

    const categoryBreakdown = Array.from(categoryMap.entries()).map(([cat, val]) => ({
      category: cat,
      itemCount: val.count,
      amountCents: val.cents,
      percentage: totalSpentCents > 0 ? Math.round((val.cents / totalSpentCents) * 100) : 0,
    }));

    const itemsByMode = {
      BARTER: items.filter((i) => i.mode === 'BARTER').length,
      DONATION: items.filter((i) => i.mode === 'DONATION').length,
      LOAN: items.filter((i) => i.mode === 'LOAN').length,
    };

    const itemsByStatus = {
      PENDING: items.filter((i) => i.status === 'PENDING').length,
      APPROVED: items.filter((i) => i.status === 'APPROVED').length,
      REJECTED: items.filter((i) => i.status === 'REJECTED').length,
      DELIVERED: items.filter((i) => (i.status as any) === 'DELIVERED').length,
    };

    return {
      healthyCount,
      candyCount,
      healthyPercentage,
      candyPercentage,
      totalSpentCents,
      categoryBreakdown,
      totalReusedItems: items.length,
      itemsByMode,
      itemsByStatus,
      totalCommunityPointsAwarded: items.length * 20,
      activeParticipantStudentsCount: new Set(items.map((i) => i.studentId)).size,
    };
  }

  // Super Admin Global Metrics & Billing Calculation
  async getSuperAdminMetrics(): Promise<SuperAdminGlobalMetrics> {
    if (this.useMocks) {
      return mockAdapter.getSuperAdminMetrics();
    }
    const insts = await this.getInstitutions();
    const activeSchools = insts.filter((i) => i.status === 'ACTIVE');
    const totalActiveStudents = insts.reduce((sum, i) => sum + i.activeStudentsCount, 0);

    const salesPerSchool = await Promise.all(
      insts.map((inst) =>
        this.getKioskSales(inst.id)
          .then((sales) => sales.reduce((acc, s) => acc + s.totalAmountCents, 0))
          .catch(() => 0)
      )
    );

    let totalMonthlyBillingCents = 0;
    let totalKioskVolumeCents = 0;

    const institutionsBilling = insts.map((inst, index) => {
      const kioskVolumeCents = salesPerSchool[index] ?? 0;
      totalKioskVolumeCents += kioskVolumeCents;

      let calculatedMonthlyFeeCents = 0;
      if (inst.status === 'ACTIVE') {
        if (inst.billingPlanType === 'FIXED_MONTHLY') {
          calculatedMonthlyFeeCents = inst.monthlyFeeCents;
        } else {
          calculatedMonthlyFeeCents = inst.activeStudentsCount * inst.monthlyFeeCents;
        }
      }
      totalMonthlyBillingCents += calculatedMonthlyFeeCents;
      return {
        institutionId: inst.id,
        institutionName: inst.name,
        cuit: inst.cuit,
        status: inst.status,
        billingPlanType: inst.billingPlanType,
        monthlyRateCents: inst.monthlyFeeCents,
        activeStudentsCount: inst.activeStudentsCount,
        calculatedMonthlyFeeCents,
        kioskVolumeCents,
      };
    });

    return {
      totalSchoolsCount: insts.length,
      activeSchoolsCount: activeSchools.length,
      totalActiveStudents,
      totalKioskVolumeCents,
      totalMonthlyBillingCents,
      institutionsBilling,
    };
  }
}

export const apiClient = new ApiClient(false);

