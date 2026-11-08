import {
  ValidateInviteCodeSchema,
  RegisterParentAndStudentSchema,
  GrantParentalConsentSchema,
  RevokeParentalConsentSchema,
  type ValidateInviteCodeDto,
  type RegisterParentAndStudentDto,
  type GrantParentalConsentDto,
  type RevokeParentalConsentDto,
  type ConsentStatus,
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
  }

  public resetToDefault() {
    this.parents.clear();
    this.students.clear();
    this.consents.clear();
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
}

export const mockApiClient = new MockMobileApiClient();
