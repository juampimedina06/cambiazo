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
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

export class ApiClient {
  private useMocks: boolean;
  private baseUrl: string;

  constructor(useMocks: boolean = USE_MOCKS, baseUrl: string = API_BASE_URL) {
    this.useMocks = useMocks;
    this.baseUrl = baseUrl;
  }

  // Institutions (Super Admin)
  async getInstitutions(): Promise<Institution[]> {
    if (this.useMocks) {
      return mockAdapter.getInstitutions();
    }
    try {
      const res = await fetch(`${this.baseUrl}/institutions`);
      if (!res.ok) throw new Error(`Failed to fetch institutions: ${res.statusText}`);
      return res.json();
    } catch (err) {
      console.warn(`[ApiClient] Backend unreachable at ${this.baseUrl}/institutions. Falling back to mocks:`, err);
      return mockAdapter.getInstitutions();
    }
  }

  async getInstitutionById(id: string): Promise<Institution | null> {
    if (this.useMocks) {
      return mockAdapter.getInstitutionById(id);
    }
    try {
      const res = await fetch(`${this.baseUrl}/institutions/${id}`);
      if (res.status === 404) return null;
      if (!res.ok) throw new Error(`Failed to fetch institution: ${res.statusText}`);
      return res.json();
    } catch (err) {
      console.warn(`[ApiClient] Backend unreachable at ${this.baseUrl}/institutions/${id}. Falling back to mocks:`, err);
      return mockAdapter.getInstitutionById(id);
    }
  }

  async createInstitution(data: CreateInstitutionInput): Promise<Institution> {
    if (this.useMocks) {
      return mockAdapter.createInstitution(data);
    }
    try {
      const res = await fetch(`${this.baseUrl}/institutions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || 'Error creating institution');
      }
      return res.json();
    } catch (err) {
      console.warn(`[ApiClient] Backend unreachable at ${this.baseUrl}/institutions. Falling back to mocks:`, err);
      return mockAdapter.createInstitution(data);
    }
  }

  async updateInstitutionStatus(
    id: string,
    status: InstitutionStatus
  ): Promise<Institution> {
    if (this.useMocks) {
      return mockAdapter.updateInstitutionStatus(id, status);
    }
    try {
      const res = await fetch(`${this.baseUrl}/institutions/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error('Error updating institution status');
      return res.json();
    } catch (err) {
      console.warn(`[ApiClient] Backend unreachable. Falling back to mocks:`, err);
      return mockAdapter.updateInstitutionStatus(id, status);
    }
  }

  // Invitations (School Admin)
  async getInvitations(institutionId?: string): Promise<InvitationCode[]> {
    if (this.useMocks) {
      return mockAdapter.getInvitations(institutionId);
    }
    try {
      const query = institutionId ? `?institutionId=${institutionId}` : '';
      const res = await fetch(`${this.baseUrl}/invitations${query}`);
      if (!res.ok) throw new Error('Failed to fetch invitations');
      return res.json();
    } catch (err) {
      console.warn(`[ApiClient] Backend unreachable at ${this.baseUrl}/invitations. Falling back to mocks:`, err);
      return mockAdapter.getInvitations(institutionId);
    }
  }

  async createInvitation(data: CreateInvitationInput): Promise<InvitationCode> {
    if (this.useMocks) {
      return mockAdapter.createInvitation(data);
    }
    try {
      const res = await fetch(`${this.baseUrl}/invitations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || 'Error creating invitation');
      }
      return res.json();
    } catch (err) {
      console.warn(`[ApiClient] Backend unreachable at ${this.baseUrl}/invitations. Falling back to mocks:`, err);
      return mockAdapter.createInvitation(data);
    }
  }

  // Student and Family Roster (School Admin)
  async getStudentsRoster(institutionId?: string): Promise<StudentRosterItem[]> {
    if (this.useMocks) {
      return mockAdapter.getStudentsRoster(institutionId);
    }
    const query = institutionId ? `?institutionId=${institutionId}` : '';
    const res = await fetch(`${this.baseUrl}/identity/students-roster${query}`);
    if (!res.ok) throw new Error('Failed to fetch student roster');
    return res.json();
  }

  async updateStudentConsent(
    studentId: string,
    status: ConsentStatus,
    reason?: string
  ): Promise<StudentRosterItem> {
    if (this.useMocks) {
      return mockAdapter.updateStudentConsent(studentId, status, reason);
    }
    const res = await fetch(
      `${this.baseUrl}/identity/students/${studentId}/consent`,
      {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, reason }),
      }
    );
    if (!res.ok) throw new Error('Failed to update parental consent');
    return res.json();
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
    const res = await fetch(`${this.baseUrl}/kiosk/products${query}`);
    if (!res.ok) throw new Error('Failed to fetch catalog products');
    return res.json();
  }

  async getCatalogProductById(id: string): Promise<CatalogProduct | null> {
    if (this.useMocks) {
      return mockAdapter.getCatalogProductById(id);
    }
    const res = await fetch(`${this.baseUrl}/kiosk/products/${id}`);
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
      headers: { 'Content-Type': 'application/json' },
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
      headers: { 'Content-Type': 'application/json' },
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
    const res = await fetch(`${this.baseUrl}/kiosk/sales${query}`);
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
      headers: { 'Content-Type': 'application/json' },
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
    const res = await fetch(`${this.baseUrl}/kiosk/ledger-balance${query}`);
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
    const res = await fetch(`${this.baseUrl}/kiosk/withdrawals${query}`);
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
      headers: { 'Content-Type': 'application/json' },
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
    const params = new URLSearchParams();
    if (institutionId) params.append('institutionId', institutionId);
    if (status) params.append('status', status);
    if (mode) params.append('mode', mode);
    const query = params.toString() ? `?${params.toString()}` : '';
    const res = await fetch(`${this.baseUrl}/community/items${query}`);
    if (!res.ok) throw new Error('Failed to fetch exchange items');
    return res.json();
  }

  async getExchangeItemById(id: string): Promise<ExchangeItem | null> {
    if (this.useMocks) {
      return mockAdapter.getExchangeItemById(id);
    }
    const res = await fetch(`${this.baseUrl}/community/items/${id}`);
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
        headers: { 'Content-Type': 'application/json' },
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
    const res = await fetch(`${this.baseUrl}/gamification/rewards${query}`);
    if (!res.ok) throw new Error('Failed to fetch school rewards');
    return res.json();
  }

  async createSchoolReward(reward: SchoolReward): Promise<SchoolReward> {
    if (this.useMocks) {
      return mockAdapter.createSchoolReward(reward);
    }
    const res = await fetch(`${this.baseUrl}/gamification/rewards`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
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
    const res = await fetch(`${this.baseUrl}/gamification/rewards/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(partial),
    });
    if (!res.ok) throw new Error('Failed to update school reward');
    return res.json();
  }

  async deleteSchoolReward(id: string): Promise<boolean> {
    if (this.useMocks) {
      return mockAdapter.deleteSchoolReward(id);
    }
    const res = await fetch(`${this.baseUrl}/gamification/rewards/${id}`, {
      method: 'DELETE',
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
    const res = await fetch(`${this.baseUrl}/gamification/leaderboard${query}`);
    if (!res.ok) throw new Error('Failed to fetch leaderboard');
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
    const res = await fetch(
      `${this.baseUrl}/gamification/redemptions${query}`
    );
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
      `${this.baseUrl}/gamification/redemptions/${redemptionId}/fulfill`,
      {
        method: 'PATCH',
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
    const query = institutionId ? `?institutionId=${institutionId}` : '';
    const res = await fetch(`${this.baseUrl}/school/reports/metrics${query}`);
    if (!res.ok) throw new Error('Failed to fetch report metrics');
    return res.json();
  }

  // Super Admin Global Metrics & Billing Calculation
  async getSuperAdminMetrics(): Promise<SuperAdminGlobalMetrics> {
    if (this.useMocks) {
      return mockAdapter.getSuperAdminMetrics();
    }
    const res = await fetch(`${this.baseUrl}/tenants/metrics/global`);
    if (!res.ok) throw new Error('Failed to fetch super admin metrics');
    return res.json();
  }
}

export const apiClient = new ApiClient();

