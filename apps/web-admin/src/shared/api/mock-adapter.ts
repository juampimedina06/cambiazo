import {
  CreateInstitutionSchema,
  CreateInvitationSchema,
  InstitutionDtoSchema,
} from '@cambiazo/shared';
import {
  Institution,
  CreateInstitutionInput,
  InvitationCode,
  CreateInvitationInput,
  StudentRosterItem,
  InstitutionStatus,
  ConsentStatus,
} from './types';

// Seeded Institutions (Super Admin view)
let mockInstitutions: Institution[] = [
  {
    id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
    name: 'Colegio Belgrano Day School',
    cuit: '30-11223344-5',
    address: 'Av. Cramer 1850, CABA',
    billingPlanType: 'FIXED_MONTHLY',
    monthlyFeeCents: 4500000, // $45.000 ARS
    status: 'ACTIVE',
    activeStudentsCount: 420,
    createdAt: '2026-01-10T08:00:00.000Z',
  },
  {
    id: 'a81bc81b-dead-4e5d-abff-90865d1e13b1',
    name: 'Instituto San Martín de Tours',
    cuit: '30-22334455-6',
    address: 'San Martín 450, San Isidro, Buenos Aires',
    billingPlanType: 'PER_ACTIVE_STUDENT',
    monthlyFeeCents: 25000, // $250 ARS por alumno activo
    status: 'ACTIVE',
    activeStudentsCount: 310,
    createdAt: '2026-01-15T09:30:00.000Z',
  },
  {
    id: 'c9a646d3-9c61-4cd9-bc15-35871b7691af',
    name: 'Escuela Técnica N° 1 Ing. Otto Krause',
    cuit: '30-33445566-7',
    address: 'Av. Paseo Colón 650, CABA',
    billingPlanType: 'FIXED_MONTHLY',
    monthlyFeeCents: 3500000, // $35.000 ARS
    status: 'SUSPENDED',
    activeStudentsCount: 180,
    createdAt: '2026-02-01T11:00:00.000Z',
  },
];

// Seeded Invitation Codes (School Admin view)
let mockInvitations: InvitationCode[] = [
  {
    id: 'inv-001',
    institutionId: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
    code: 'BELGRANO-2026',
    maxUses: 500,
    currentUses: 342,
    expiresAt: '2026-12-31T23:59:59.000Z',
    createdAt: '2026-02-01T10:00:00.000Z',
    isActive: true,
  },
  {
    id: 'inv-002',
    institutionId: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
    code: 'BELGRANO-SECUNDARIA',
    maxUses: 200,
    currentUses: 78,
    expiresAt: '2026-07-31T23:59:59.000Z',
    createdAt: '2026-02-15T14:30:00.000Z',
    isActive: true,
  },
  {
    id: 'inv-003',
    institutionId: 'a81bc81b-dead-4e5d-abff-90865d1e13b1',
    code: 'SAN-MARTIN-INICIAL',
    maxUses: 150,
    currentUses: 150,
    expiresAt: '2026-03-31T23:59:59.000Z',
    createdAt: '2026-02-10T09:00:00.000Z',
    isActive: false,
  },
];

// Seeded Student and Family Roster with Parental Consent Audit Status
let mockStudentsRoster: StudentRosterItem[] = [
  {
    id: 'rost-001',
    studentId: 'e2b3c4d5-1111-4000-8000-000000000001',
    institutionId: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
    studentName: 'Mateo Rossi',
    studentDni: '54.123.456',
    grade: '5to Grado B',
    parentName: 'Carlos Rossi',
    parentEmail: 'carlos.rossi@example.com',
    parentPhone: '+54 11 4567-8901',
    consentStatus: 'GRANTED',
    consentAudit: {
      acceptedTermsVersion: 'v1.2-2026',
      signedAt: '2026-02-20T14:22:10.000Z',
      signatureIp: '181.44.12.98',
    },
    walletBalanceCents: 450000, // $4.500 ARS
    communityPoints: 120,
    createdAt: '2026-02-20T14:22:10.000Z',
  },
  {
    id: 'rost-002',
    studentId: 'e2b3c4d5-2222-4000-8000-000000000002',
    institutionId: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
    studentName: 'Lucía Fernández',
    studentDni: '56.789.012',
    grade: '3er Grado A',
    parentName: 'Valeria Gómez',
    parentEmail: 'valeria.gomez@example.com',
    parentPhone: '+54 11 6789-0123',
    consentStatus: 'PENDING',
    consentAudit: {},
    walletBalanceCents: 0,
    communityPoints: 0,
    createdAt: '2026-03-01T10:15:00.000Z',
  },
  {
    id: 'rost-003',
    studentId: 'e2b3c4d5-3333-4000-8000-000000000003',
    institutionId: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
    studentName: 'Joaquín Díaz',
    studentDni: '52.345.678',
    grade: '7mo Grado C',
    parentName: 'Martín Díaz',
    parentEmail: 'martin.diaz@example.com',
    parentPhone: '+54 11 3456-7890',
    consentStatus: 'REVOKED',
    consentAudit: {
      acceptedTermsVersion: 'v1.1-2026',
      signedAt: '2026-02-15T09:12:00.000Z',
      signatureIp: '190.18.23.45',
      revocationReason: 'Solicitud expresa del tutor legal por cambio de escuela.',
      revokedAt: '2026-03-05T16:45:00.000Z',
    },
    walletBalanceCents: 120000, // $1.200 ARS
    communityPoints: 45,
    createdAt: '2026-02-15T09:12:00.000Z',
  },
  {
    id: 'rost-004',
    studentId: 'e2b3c4d5-4444-4000-8000-000000000004',
    institutionId: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
    studentName: 'Valentina Benítez',
    studentDni: '53.987.654',
    grade: '4to Grado B',
    parentName: 'Andrea Soler',
    parentEmail: 'andrea.soler@example.com',
    parentPhone: '+54 11 9876-5432',
    consentStatus: 'GRANTED',
    consentAudit: {
      acceptedTermsVersion: 'v1.2-2026',
      signedAt: '2026-02-22T18:05:32.000Z',
      signatureIp: '190.220.34.12',
    },
    walletBalanceCents: 680000, // $6.800 ARS
    communityPoints: 85,
    createdAt: '2026-02-22T18:05:32.000Z',
  },
];

export const mockAdapter = {
  // Institutions
  async getInstitutions(): Promise<Institution[]> {
    return [...mockInstitutions];
  },

  async getInstitutionById(id: string): Promise<Institution | null> {
    const institution = mockInstitutions.find((i) => i.id === id);
    return institution ? { ...institution } : null;
  },

  async createInstitution(input: CreateInstitutionInput): Promise<Institution> {
    // Validate with Zod schema from @cambiazo/shared
    const validated = CreateInstitutionSchema.parse(input);

    const newInstitution: Institution = {
      id: crypto.randomUUID ? crypto.randomUUID() : `inst-${Date.now()}`,
      name: validated.name,
      cuit: validated.cuit,
      address: validated.address,
      billingPlanType: validated.billingPlanType,
      monthlyFeeCents: validated.monthlyFeeCents,
      status: 'ACTIVE',
      activeStudentsCount: 0,
      createdAt: new Date().toISOString(),
    };

    // Validate output DTO schema
    InstitutionDtoSchema.parse(newInstitution);

    mockInstitutions = [newInstitution, ...mockInstitutions];
    return newInstitution;
  },

  async updateInstitutionStatus(
    id: string,
    status: InstitutionStatus
  ): Promise<Institution> {
    const inst = mockInstitutions.find((i) => i.id === id);
    if (!inst) throw new Error(`Institution with ID ${id} not found.`);
    inst.status = status;
    return { ...inst };
  },

  // Invitations
  async getInvitations(institutionId?: string): Promise<InvitationCode[]> {
    if (institutionId) {
      return mockInvitations.filter((inv) => inv.institutionId === institutionId);
    }
    return [...mockInvitations];
  },

  async createInvitation(input: CreateInvitationInput): Promise<InvitationCode> {
    // Validate with Zod schema from @cambiazo/shared
    const validated = CreateInvitationSchema.parse(input);

    const generatedCode =
      validated.code || `CAMBIAZO-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;

    const newInvitation: InvitationCode = {
      id: `inv-${Date.now()}`,
      institutionId: validated.institutionId,
      code: generatedCode,
      maxUses: validated.maxUses ?? 100,
      currentUses: 0,
      expiresAt:
        validated.expiresAt instanceof Date
          ? validated.expiresAt.toISOString()
          : validated.expiresAt ?? new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
      createdAt: new Date().toISOString(),
      isActive: true,
    };

    mockInvitations = [newInvitation, ...mockInvitations];
    return newInvitation;
  },

  // Students & Families Roster
  async getStudentsRoster(institutionId?: string): Promise<StudentRosterItem[]> {
    if (institutionId) {
      return mockStudentsRoster.filter((s) => s.institutionId === institutionId);
    }
    return [...mockStudentsRoster];
  },

  async updateStudentConsent(
    studentId: string,
    status: ConsentStatus,
    reason?: string
  ): Promise<StudentRosterItem> {
    const student = mockStudentsRoster.find((s) => s.studentId === studentId);
    if (!student) throw new Error(`Student ${studentId} not found in roster.`);

    student.consentStatus = status;
    if (status === 'GRANTED') {
      student.consentAudit = {
        acceptedTermsVersion: 'v1.2-2026',
        signedAt: new Date().toISOString(),
        signatureIp: '181.44.12.98',
      };
    } else if (status === 'REVOKED') {
      student.consentAudit = {
        ...student.consentAudit,
        revocationReason: reason || 'Revocado por el administrador escolar / tutor',
        revokedAt: new Date().toISOString(),
      };
    } else {
      student.consentAudit = {};
    }

    return { ...student };
  },

  // Reset to initial seed (useful for unit tests)
  reset(): void {
    mockInstitutions = [
      {
        id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
        name: 'Colegio Belgrano Day School',
        cuit: '30-11223344-5',
        address: 'Av. Cramer 1850, CABA',
        billingPlanType: 'FIXED_MONTHLY',
        monthlyFeeCents: 4500000,
        status: 'ACTIVE',
        activeStudentsCount: 420,
        createdAt: '2026-01-10T08:00:00.000Z',
      },
      {
        id: 'a81bc81b-dead-4e5d-abff-90865d1e13b1',
        name: 'Instituto San Martín de Tours',
        cuit: '30-22334455-6',
        address: 'San Martín 450, San Isidro, Buenos Aires',
        billingPlanType: 'PER_ACTIVE_STUDENT',
        monthlyFeeCents: 25000,
        status: 'ACTIVE',
        activeStudentsCount: 310,
        createdAt: '2026-01-15T09:30:00.000Z',
      },
      {
        id: 'c9a646d3-9c61-4cd9-bc15-35871b7691af',
        name: 'Escuela Técnica N° 1 Ing. Otto Krause',
        cuit: '30-33445566-7',
        address: 'Av. Paseo Colón 650, CABA',
        billingPlanType: 'FIXED_MONTHLY',
        monthlyFeeCents: 3500000,
        status: 'SUSPENDED',
        activeStudentsCount: 180,
        createdAt: '2026-02-01T11:00:00.000Z',
      },
    ];
  },
};
