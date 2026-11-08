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
    const res = await fetch(`${this.baseUrl}/tenants/institutions`);
    if (!res.ok) throw new Error(`Failed to fetch institutions: ${res.statusText}`);
    return res.json();
  }

  async getInstitutionById(id: string): Promise<Institution | null> {
    if (this.useMocks) {
      return mockAdapter.getInstitutionById(id);
    }
    const res = await fetch(`${this.baseUrl}/tenants/institutions/${id}`);
    if (res.status === 404) return null;
    if (!res.ok) throw new Error(`Failed to fetch institution: ${res.statusText}`);
    return res.json();
  }

  async createInstitution(data: CreateInstitutionInput): Promise<Institution> {
    if (this.useMocks) {
      return mockAdapter.createInstitution(data);
    }
    const res = await fetch(`${this.baseUrl}/tenants/institutions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Error creating institution');
    }
    return res.json();
  }

  async updateInstitutionStatus(
    id: string,
    status: InstitutionStatus
  ): Promise<Institution> {
    if (this.useMocks) {
      return mockAdapter.updateInstitutionStatus(id, status);
    }
    const res = await fetch(`${this.baseUrl}/tenants/institutions/${id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
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
    const query = institutionId ? `?institutionId=${institutionId}` : '';
    const res = await fetch(`${this.baseUrl}/tenants/invitations${query}`);
    if (!res.ok) throw new Error('Failed to fetch invitations');
    return res.json();
  }

  async createInvitation(data: CreateInvitationInput): Promise<InvitationCode> {
    if (this.useMocks) {
      return mockAdapter.createInvitation(data);
    }
    const res = await fetch(`${this.baseUrl}/tenants/invitations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
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
}

export const apiClient = new ApiClient();
