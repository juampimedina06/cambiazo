import {
  ChangeStudentPasswordSchema,
  LoginFamilySchema,
  RegisterParentAndStudentSchema,
  ValidateInviteCodeSchema,
  type LoginFamilyDto,
  type RegisterParentAndStudentDto,
} from '@cambiazo/shared';
import {
  cambiazoApi,
  extractApiErrorMessage,
  normalizeConsentStatus,
  type ApiAuthContext,
} from '../../api/cambiazoApi';
import { hydrateStudentAccountAction } from '../../wallet/actions/wallet.actions';
import type {
  LoginFamilyApiResponse,
  LoginWithSchoolCodeResult,
  ParentProfile,
  RegisterFamilyApiResponse,
  RegisterFamilyMultipleStudentsInput,
  RegisterFamilyResult,
  SchoolInstitution,
  StudentProfile,
  ValidateInvitationApiResponse,
  ValidateInviteCodeResult,
} from '../interface/auth.interface';

function mapStudentProfile(
  raw: {
    id?: string;
    institutionId?: string;
    parentId?: string;
    fullName?: string;
    dni?: string;
    grade?: string;
    dateOfBirth?: string;
    consentStatus?: string;
  },
  defaults: {
    institutionId: string;
    parentId: string;
    fullName?: string;
    dni?: string;
    grade?: string;
    dateOfBirth?: string;
  }
): StudentProfile {
  return {
    id: raw.id || '',
    institutionId: raw.institutionId || defaults.institutionId,
    parentId: raw.parentId || defaults.parentId,
    fullName: raw.fullName || defaults.fullName || 'Alumno',
    dni: raw.dni || defaults.dni || '',
    grade: raw.grade || defaults.grade || '',
    dateOfBirth: raw.dateOfBirth || defaults.dateOfBirth || '',
    consentStatus: normalizeConsentStatus(raw.consentStatus),
    balanceArsCents: 0,
    dailyLimitCents: 0,
    dailySpentCents: 0,
    communityPoints: 0,
  };
}

export async function validateInviteCodeAction(
  code: string
): Promise<ValidateInviteCodeResult> {
  const normalized = code.trim().toUpperCase();
  const validation = ValidateInviteCodeSchema.safeParse({ code: normalized });

  if (!validation.success) {
    return {
      success: false,
      error:
        validation.error.errors[0]?.message ||
        'El código escolar es inválido.',
    };
  }

  try {
    const response = await cambiazoApi.get<ValidateInvitationApiResponse>(
      `/invitations/validate/${encodeURIComponent(validation.data.code)}`,
      { skipAuth: true },
      'El código no corresponde a ninguna institución activa.'
    );

    const institution: SchoolInstitution = {
      id: response.institution?.id || response.institutionId || '',
      name:
        response.institution?.name ||
        response.institutionName ||
        'Institución Escolar',
      code: response.invitation?.code || validation.data.code,
    };

    return {
      success: true,
      institution,
    };
  } catch (error) {
    return {
      success: false,
      error: extractApiErrorMessage(
        error,
        'El código no corresponde a ninguna institución activa.'
      ),
    };
  }
}

export async function registerFamilyAction(
  input: RegisterParentAndStudentDto | RegisterFamilyMultipleStudentsInput
): Promise<RegisterFamilyResult> {
  const normalizedStudents =
    'students' in input
      ? input.students
      : [
          input.student,
          ...(input.additionalStudents ? input.additionalStudents : []),
        ];

  if (normalizedStudents.length === 0) {
    return {
      success: false,
      error: 'Debés registrar al menos un alumno.',
    };
  }

  const payload: RegisterParentAndStudentDto = {
    inviteCode: input.inviteCode.trim().toUpperCase(),
    parent: input.parent,
    student: normalizedStudents[0]!,
    ...(normalizedStudents.length > 1
      ? { additionalStudents: normalizedStudents.slice(1) }
      : {}),
  };

  const validation = RegisterParentAndStudentSchema.safeParse(payload);
  if (!validation.success) {
    const firstIssue = validation.error.errors[0];
    return {
      success: false,
      error: firstIssue?.message || 'Datos de registro inválidos',
    };
  }

  try {
    const response = await cambiazoApi.post<RegisterFamilyApiResponse>(
      '/onboarding/register-family',
      validation.data,
      { skipAuth: true },
      'Error registrando familia'
    );

    const institutionId =
      response.institutionId || response.parent?.institutionId || '';

    const parent: ParentProfile = {
      id: response.parentId || response.parent?.id || '',
      institutionId,
      fullName: response.parent?.fullName || validation.data.parent.fullName,
      email: response.parent?.email || validation.data.parent.email,
      dni: response.parent?.dni || validation.data.parent.dni,
      phone: response.parent?.phone || validation.data.parent.phone,
    };

    const rawStudents =
      Array.isArray(response.students) && response.students.length > 0
        ? response.students
        : [
            {
              id: response.studentId || response.student?.id,
              institutionId: response.student?.institutionId || institutionId,
              fullName: response.student?.fullName,
              dni: response.student?.dni,
              grade: response.student?.grade,
              dateOfBirth: response.student?.dateOfBirth,
              consentStatus: response.student?.consentStatus,
            },
          ];

    const students = rawStudents.map((raw, index) => {
      const submitted = normalizedStudents[index] ?? validation.data.student;
      return mapStudentProfile(raw, {
        institutionId,
        parentId: parent.id,
        fullName: submitted.fullName,
        dni: submitted.dni,
        grade: submitted.grade,
        dateOfBirth: submitted.dateOfBirth,
      });
    });

    const institution: SchoolInstitution | undefined = institutionId
      ? {
          id: institutionId,
          name: response.institutionName || 'Institución Escolar',
          code: validation.data.inviteCode,
        }
      : undefined;

    return {
      success: true,
      parent,
      student: students[0],
      students,
      institution,
    };
  } catch (error) {
    return {
      success: false,
      error: extractApiErrorMessage(error, 'Error registrando familia'),
    };
  }
}

export async function loginWithSchoolCodeAction(
  input: LoginFamilyDto
): Promise<LoginWithSchoolCodeResult> {
  const normalizedInput: LoginFamilyDto = {
    inviteCode: input.inviteCode.trim().toUpperCase(),
    identifier: input.identifier.trim(),
    password: input.password,
  };

  const validation = LoginFamilySchema.safeParse(normalizedInput);
  if (!validation.success) {
    return {
      success: false,
      error:
        validation.error.errors[0]?.message ||
        'Completa código escolar, DNI/email y contraseña válidos.',
    };
  }

  try {
    const response = await cambiazoApi.post<LoginFamilyApiResponse>(
      '/onboarding/login',
      validation.data,
      { skipAuth: true },
      'Credenciales o código escolar inválidos.'
    );

    const institutionId =
      response.institutionId ||
      response.institution?.id ||
      response.user?.institutionId ||
      '';

    const institution: SchoolInstitution | undefined = institutionId
      ? {
          id: institutionId,
          name:
            response.institution?.name ||
            response.institutionName ||
            'Institución Escolar',
          code: validation.data.inviteCode,
        }
      : undefined;

    if (response.role === 'PARENT') {
      const parentId = response.user?.id || '';
      const parent: ParentProfile = {
        id: parentId,
        institutionId,
        fullName: response.user?.fullName || 'Padre / Tutor',
        email: response.user?.email || validation.data.identifier,
        dni: response.user?.dni || '',
        phone: response.user?.phone,
      };

      const rawStudents = Array.isArray(response.students) ? response.students : [];
      const students = await Promise.all(
        rawStudents.map(async (raw) => {
          const baseProfile = mapStudentProfile(raw, {
            institutionId,
            parentId,
          });
          return hydrateStudentAccountAction(baseProfile, {
            role: 'PARENT',
            userId: parentId,
            institutionId: baseProfile.institutionId,
          });
        })
      );

      return {
        success: true,
        role: 'PARENT',
        institution,
        parent,
        student: students[0],
        students,
      };
    }

    const studentId = response.user?.id || '';
    const baseStudent = mapStudentProfile(
      {
        id: studentId,
        institutionId,
        fullName: response.user?.fullName,
        dni: response.user?.dni,
        grade: response.user?.grade,
        dateOfBirth: response.user?.dateOfBirth,
        consentStatus: response.user?.consentStatus,
      },
      {
        institutionId,
        parentId: '',
      }
    );

    const hydratedStudent = await hydrateStudentAccountAction(baseStudent, {
      role: 'STUDENT',
      userId: studentId,
      institutionId,
    });

    return {
      success: true,
      role: 'STUDENT',
      institution,
      student: hydratedStudent,
      students: [hydratedStudent],
    };
  } catch (error) {
    return {
      success: false,
      error: extractApiErrorMessage(
        error,
        'Credenciales o código escolar inválidos.'
      ),
    };
  }
}

export async function changeStudentPasswordAction(
  input: { studentId?: string; newPassword: string },
  auth?: ApiAuthContext
): Promise<{ success: boolean; error?: string }> {
  const validation = ChangeStudentPasswordSchema.safeParse(input);
  if (!validation.success) {
    return {
      success: false,
      error:
        validation.error.errors[0]?.message ||
        'La nueva contraseña debe tener al menos 4 caracteres.',
    };
  }

  try {
    await cambiazoApi.post<{ success: boolean; studentId: string }>(
      '/onboarding/student-password',
      validation.data,
      auth ? { auth } : undefined,
      'No se pudo actualizar la contraseña.'
    );
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: extractApiErrorMessage(
        error,
        'No se pudo actualizar la contraseña.'
      ),
    };
  }
}

