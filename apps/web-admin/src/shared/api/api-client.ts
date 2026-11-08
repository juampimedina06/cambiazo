import { mockAdapter } from './mock-adapter';
import {
  Institution,
  CreateInstitutionInput,
  InvitationCode,
  CreateInvitationInput,
  StudentRosterItem,
  InstitutionStatus,
  ConsentStatus,
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
}

export const apiClient = new ApiClient();
