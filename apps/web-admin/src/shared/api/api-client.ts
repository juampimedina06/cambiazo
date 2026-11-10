import { mockAdapter } from './mock-adapter';
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

const USE_MOCKS = process.env.NEXT_PUBLIC_USE_MOCKS !== 'false';
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1';

export class ApiClient {
  private useMocks: boolean;
  private baseUrl: string;

  constructor(useMocks: boolean = USE_MOCKS, baseUrl: string = API_BASE_URL) {
    this.useMocks = useMocks;
    this.baseUrl = baseUrl;
  }

  private getHeaders(role: string = 'SUPER_ADMIN', institutionId?: string): Record<string, string> {
    const defaultInstId =
      typeof window !== 'undefined'
        ? localStorage.getItem('cambiazo_institution_id') || 'e28bb18a-66fe-4f8e-9092-2df283f55001'
        : 'e28bb18a-66fe-4f8e-9092-2df283f55001';

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
    try {
      const res = await fetch(`${this.baseUrl}/institutions`, {
        headers: this.getHeaders('SUPER_ADMIN'),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || `Failed to fetch institutions: ${res.statusText}`);
      }
      return res.json();
    } catch (err: any) {
      console.warn(`[ApiClient] Live backend request failed (${err.message}). Using fallback.`);
      return mockAdapter.getInstitutions();
    }
  }

  async getInstitutionById(id: string): Promise<Institution | null> {
    if (this.useMocks) {
      return mockAdapter.getInstitutionById(id);
    }
    try {
      const res = await fetch(`${this.baseUrl}/institutions/${id}`, {
        headers: this.getHeaders('SUPER_ADMIN'),
      });
      if (res.status === 404) return null;
      if (!res.ok) throw new Error(`Failed to fetch institution: ${res.statusText}`);
      return res.json();
    } catch (err: any) {
      console.warn(`[ApiClient] Live backend request failed (${err.message}). Using fallback.`);
      return mockAdapter.getInstitutionById(id);
    }
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
      throw new Error(err.message || 'Error creating institution');
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
    if (!res.ok) throw new Error('Error updating institution status');
    return res.json();
  }

  // Invitations (School Admin)
  async getInvitations(institutionId?: string): Promise<InvitationCode[]> {
    if (this.useMocks) {
      return mockAdapter.getInvitations(institutionId);
    }
    try {
      const query = institutionId ? `?institutionId=${institutionId}` : '';
      const res = await fetch(`${this.baseUrl}/invitations${query}`, {
        headers: this.getHeaders('SCHOOL_ADMIN', institutionId),
      });
      if (!res.ok) throw new Error('Failed to fetch invitations');
      return res.json();
    } catch {
      return mockAdapter.getInvitations(institutionId);
    }
  }

  async createInvitation(data: CreateInvitationInput): Promise<InvitationCode> {
    if (this.useMocks) {
      return mockAdapter.createInvitation(data);
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
    return res.json();
  }

  // Student and Family Roster (School Admin)
  async getStudentsRoster(institutionId?: string): Promise<StudentRosterItem[]> {
    if (this.useMocks) {
      return mockAdapter.getStudentsRoster(institutionId);
    }
    try {
      const query = institutionId ? `?institutionId=${institutionId}` : '';
      const res = await fetch(`${this.baseUrl}/consents/audit/all${query}`, {
        headers: this.getHeaders('SCHOOL_ADMIN', institutionId),
      });
      if (!res.ok) {
        return mockAdapter.getStudentsRoster(institutionId);
      }
      return res.json();
    } catch {
      return mockAdapter.getStudentsRoster(institutionId);
    }
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
    const res = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'POST',
      headers: this.getHeaders('PARENT'),
      body: JSON.stringify({
        studentId,
        reason,
        acceptedTermsVersion: 'v1.0',
        acceptedAt: new Date().toISOString(),
        signatureIp: '127.0.0.1',
      }),
    });
    if (!res.ok) throw new Error('Failed to update parental consent');
    return mockAdapter.updateStudentConsent(studentId, status, reason);
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
    if (!res.ok) throw new Error('Failed to fetch product');
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
    if (!res.ok) throw new Error('Failed to fetch sales');
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
    if (!res.ok) throw new Error('Failed to fetch kiosk balance');
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
    if (!res.ok) throw new Error('Failed to fetch withdrawals');
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
    return res.json();
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
    try {
      const params = new URLSearchParams();
      if (institutionId) params.append('institutionId', institutionId);
      if (status) params.append('status', status);
      if (mode) params.append('mode', mode);
      const query = params.toString() ? `?${params.toString()}` : '';
      const res = await fetch(`${this.baseUrl}/community/items${query}`, {
        headers: this.getHeaders('SCHOOL_ADMIN', institutionId),
      });
      if (!res.ok) {
        return mockAdapter.getExchangeItems(institutionId, status, mode);
      }
      const data = await res.json();
      return Array.isArray(data) && data.length > 0
        ? data
        : mockAdapter.getExchangeItems(institutionId, status, mode);
    } catch {
      return mockAdapter.getExchangeItems(institutionId, status, mode);
    }
  }

  async getExchangeItemById(id: string): Promise<ExchangeItem | null> {
    if (this.useMocks) {
      return mockAdapter.getExchangeItemById(id);
    }
    try {
      const res = await fetch(`${this.baseUrl}/community/items/${id}`, {
        headers: this.getHeaders('SCHOOL_ADMIN'),
      });
      if (res.status === 404) return null;
      if (!res.ok) return mockAdapter.getExchangeItemById(id);
      return res.json();
    } catch {
      return mockAdapter.getExchangeItemById(id);
    }
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
    try {
      const query = institutionId ? `?institutionId=${institutionId}` : '';
      const res = await fetch(`${this.baseUrl}/community/rewards${query}`, {
        headers: this.getHeaders('SCHOOL_ADMIN', institutionId),
      });
      if (!res.ok) {
        return mockAdapter.getSchoolRewards(institutionId);
      }
      const data = await res.json();
      return Array.isArray(data) && data.length > 0
        ? data
        : mockAdapter.getSchoolRewards(institutionId);
    } catch {
      return mockAdapter.getSchoolRewards(institutionId);
    }
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
    try {
      const query = institutionId ? `?institutionId=${institutionId}` : '';
      const res = await fetch(`${this.baseUrl}/community/leaderboard${query}`, {
        headers: this.getHeaders('SCHOOL_ADMIN', institutionId),
      });
      if (!res.ok) {
        return mockAdapter.getSchoolLeaderboard(institutionId);
      }
      const data = await res.json();
      return Array.isArray(data) && data.length > 0
        ? data
        : mockAdapter.getSchoolLeaderboard(institutionId);
    } catch {
      return mockAdapter.getSchoolLeaderboard(institutionId);
    }
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
    if (!res.ok) return mockAdapter.getRewardRedemptions(institutionId);
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
    if (!res.ok) return mockAdapter.fulfillRewardRedemption(redemptionId);
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

    let totalMonthlyBillingCents = 0;
    const institutionsBilling = insts.map((inst) => {
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
        kioskVolumeCents: 12000000,
      };
    });

    return {
      totalSchoolsCount: insts.length,
      activeSchoolsCount: activeSchools.length,
      totalActiveStudents,
      totalKioskVolumeCents: 154000000,
      totalMonthlyBillingCents,
      institutionsBilling,
    };
  }
}

export const apiClient = new ApiClient();

