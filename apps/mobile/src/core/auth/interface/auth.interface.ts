import {
  type ConsentStatus,
  type RegisterParentAndStudentDto,
  type UserRole,
} from '@cambiazo/shared';

export type StudentRegistrationDto = RegisterParentAndStudentDto['student'];

export interface SchoolInstitution {
  id: string;
  name: string;
  code: string;
}

export interface ParentProfile {
  id: string;
  institutionId: string;
  fullName: string;
  email: string;
  dni: string;
  phone?: string;
}

export interface StudentProfile {
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

export interface ValidateInviteCodeResult {
  success: boolean;
  institution?: SchoolInstitution;
  error?: string;
}

export interface RegisterFamilyMultipleStudentsInput {
  inviteCode: string;
  parent: RegisterParentAndStudentDto['parent'];
  students: StudentRegistrationDto[];
}

export interface RegisterFamilyResult {
  success: boolean;
  parent?: ParentProfile;
  student?: StudentProfile;
  students?: StudentProfile[];
  institution?: SchoolInstitution;
  error?: string;
}

export interface LoginWithSchoolCodeResult {
  success: boolean;
  role?: UserRole;
  institution?: SchoolInstitution;
  parent?: ParentProfile;
  student?: StudentProfile;
  students?: StudentProfile[];
  error?: string;
}

export interface ValidateInvitationApiResponse {
  valid?: boolean;
  institutionId?: string;
  institutionName?: string;
  institution?: {
    id?: string;
    name?: string;
  };
  invitation?: {
    code?: string;
  };
}

export interface RegisterFamilyApiResponse {
  parentId?: string;
  studentId?: string;
  institutionId?: string;
  institutionName?: string;
  parent?: Partial<ParentProfile>;
  student?: Partial<StudentProfile> & { consentStatus?: string };
  students?: Array<Partial<StudentProfile> & { consentStatus?: string }>;
}

export interface LoginFamilyApiResponse {
  role?: UserRole;
  institutionId?: string;
  institutionName?: string;
  institution?: {
    id?: string;
    name?: string;
  };
  user?: {
    id?: string;
    institutionId?: string;
    fullName?: string;
    email?: string;
    dni?: string;
    phone?: string;
    grade?: string;
    dateOfBirth?: string;
    consentStatus?: string;
  };
  students?: Array<{
    id?: string;
    institutionId?: string;
    fullName?: string;
    dni?: string;
    grade?: string;
    dateOfBirth?: string;
    consentStatus?: string;
  }>;
}
