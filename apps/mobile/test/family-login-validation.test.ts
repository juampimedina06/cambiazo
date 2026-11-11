import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { LoginFamilySchema } from '@cambiazo/shared';
import {
  changeStudentPasswordAction,
  loginWithSchoolCodeAction,
  registerFamilyAction,
} from '../src/core';
import { authStore, resolveSessionContext } from '../src/shared/store/auth-store';
import { installTestBackend } from './helpers/test-backend';

describe('School-Scoped Family Login (LoginFamilySchema & Actions)', () => {
  let restoreFetch: (() => void) | null = null;

  beforeEach(() => {
    restoreFetch = installTestBackend().restore;
    authStore.logout();
  });

  afterEach(() => {
    restoreFetch?.();
  });

  it('validates login payloads with email or DNI', () => {
    expect(
      LoginFamilySchema.safeParse({
        inviteCode: 'BELGRANO2026',
        identifier: 'carolina.gomez@ejemplo.com',
        password: 'default',
      }).success
    ).toBe(true);

    expect(
      LoginFamilySchema.safeParse({
        inviteCode: 'BELGRANO2026',
        identifier: '52345678',
        password: '1234',
      }).success
    ).toBe(true);

    expect(
      LoginFamilySchema.safeParse({
        inviteCode: 'BELGRANO2026',
        identifier: 'ab',
        password: '123',
      }).success
    ).toBe(false);
  });

  it('logs in seeded parent and returns linked student', async () => {
    const res = await loginWithSchoolCodeAction({
      inviteCode: 'BELGRANO2026',
      identifier: 'carolina.gomez@ejemplo.com',
      password: 'default',
    });

    expect(res.success).toBe(true);
    expect(res.role).toBe('PARENT');
    expect(res.parent?.email).toBe('carolina.gomez@ejemplo.com');
    expect(res.students?.length).toBe(1);
    expect(res.students?.[0]?.dni).toBe('52345678');
  });

  it('logs in seeded student by DNI', async () => {
    const res = await loginWithSchoolCodeAction({
      inviteCode: 'BELGRANO2026',
      identifier: '52345678',
      password: 'default',
    });

    expect(res.success).toBe(true);
    expect(res.role).toBe('STUDENT');
    expect(res.student?.fullName).toBe('Mateo Gómez');
  });

  it('logs in newly registered multi-student family and sibling', async () => {
    const reg = await registerFamilyAction({
      inviteCode: 'SANMARTIN2026',
      parent: {
        fullName: 'Lucia Pereyra',
        email: 'lucia.pereyra@ejemplo.com',
        password: 'MiClaveSegura123',
        dni: '29111222',
      },
      students: [
        {
          fullName: 'Juan Pereyra',
          dni: '55111222',
          grade: '3ro B',
          dateOfBirth: '2016-04-10',
        },
        {
          fullName: 'Clara Pereyra',
          dni: '56111222',
          grade: '1ro A',
          dateOfBirth: '2018-09-22',
        },
      ],
    });
    expect(reg.success).toBe(true);

    const parentLogin = await loginWithSchoolCodeAction({
      inviteCode: 'SANMARTIN2026',
      identifier: 'lucia.pereyra@ejemplo.com',
      password: 'MiClaveSegura123',
    });
    expect(parentLogin.success).toBe(true);
    expect(parentLogin.role).toBe('PARENT');
    expect(parentLogin.students?.length).toBe(2);

    const siblingLogin = await loginWithSchoolCodeAction({
      inviteCode: 'SANMARTIN2026',
      identifier: '56111222',
      password: 'MiClaveSegura123',
    });
    expect(siblingLogin.success).toBe(true);
    expect(siblingLogin.role).toBe('STUDENT');
    expect(siblingLogin.student?.fullName).toBe('Clara Pereyra');
  });

  it('updates authStore session properly across login flows', async () => {
    const res = await loginWithSchoolCodeAction({
      inviteCode: 'BELGRANO2026',
      identifier: 'carolina.gomez@ejemplo.com',
      password: 'default',
    });
    expect(res.success).toBe(true);

    authStore.setParentSession(res.parent!, res.student, res.students, res.institution);
    const ctx = resolveSessionContext(authStore.getState());
    expect(ctx.parent?.fullName).toBe('Carolina Gómez');
    expect(ctx.student?.fullName).toBe('Mateo Gómez');
    expect(ctx.institutionName).toBe('Colegio Manuel Belgrano');
  });

  it('allows parent or student to change student password without affecting parent password', async () => {
    const reg = await registerFamilyAction({
      inviteCode: 'BELGRANO2026',
      parent: {
        fullName: 'Valeria Sosa',
        email: 'valeria.sosa@ejemplo.com',
        password: 'FamiliaPassword1!',
        dni: '30555666',
      },
      students: [
        {
          fullName: 'Julián Sosa',
          dni: '54555666',
          grade: '5to A',
          dateOfBirth: '2014-03-15',
        },
      ],
    });
    expect(reg.success).toBe(true);
    const parentId = reg.parent!.id;
    const studentId = reg.student!.id;
    const institutionId = reg.institution!.id;

    // Initial student login with family password succeeds
    const initialStudentLogin = await loginWithSchoolCodeAction({
      inviteCode: 'BELGRANO2026',
      identifier: '54555666',
      password: 'FamiliaPassword1!',
    });
    expect(initialStudentLogin.success).toBe(true);

    // Parent changes student password
    const updateRes = await changeStudentPasswordAction(
      { studentId, newPassword: 'ClaveJulian2026' },
      { role: 'PARENT', userId: parentId, institutionId }
    );
    expect(updateRes.success).toBe(true);

    // Old family password no longer works for student, new one does
    const oldPassAttempt = await loginWithSchoolCodeAction({
      inviteCode: 'BELGRANO2026',
      identifier: '54555666',
      password: 'FamiliaPassword1!',
    });
    expect(oldPassAttempt.success).toBe(false);

    const newPassAttempt = await loginWithSchoolCodeAction({
      inviteCode: 'BELGRANO2026',
      identifier: '54555666',
      password: 'ClaveJulian2026',
    });
    expect(newPassAttempt.success).toBe(true);

    // Parent can still log in with family password
    const parentLogin = await loginWithSchoolCodeAction({
      inviteCode: 'BELGRANO2026',
      identifier: 'valeria.sosa@ejemplo.com',
      password: 'FamiliaPassword1!',
    });
    expect(parentLogin.success).toBe(true);
  });
});
