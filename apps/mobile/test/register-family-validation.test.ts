import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { RegisterParentAndStudentSchema } from '@cambiazo/shared';
import { registerFamilyAction } from '../src/core';
import { authStore } from '../src/shared/store/auth-store';
import { installTestBackend } from './helpers/test-backend';

describe('Family Registration (RegisterParentAndStudentSchema)', () => {
  let restoreFetch: (() => void) | null = null;

  beforeEach(() => {
    restoreFetch = installTestBackend().restore;
    authStore.logout();
  });

  afterEach(() => {
    restoreFetch?.();
  });

  const validRegistrationPayload = {
    inviteCode: 'BELGRANO2026',
    parent: {
      fullName: 'Carolina Gómez',
      email: 'carolina.gomez@ejemplo.com',
      password: 'SecurePassword123!',
      phone: '+5491122334455',
      dni: '32109876',
    },
    student: {
      fullName: 'Mateo Gómez',
      dni: '52345678',
      grade: '6° Primaria',
      dateOfBirth: '2014-05-12',
    },
  };

  it('validates a correct parent and student registration payload', () => {
    const res = RegisterParentAndStudentSchema.safeParse(validRegistrationPayload);
    expect(res.success).toBe(true);
  });

  it('rejects invalid email formats for parent', () => {
    const invalid = {
      ...validRegistrationPayload,
      parent: {
        ...validRegistrationPayload.parent,
        email: 'invalid-email-no-at',
      },
    };
    const res = RegisterParentAndStudentSchema.safeParse(invalid);
    expect(res.success).toBe(false);
  });

  it('rejects passwords shorter than 8 characters', () => {
    const invalid = {
      ...validRegistrationPayload,
      parent: {
        ...validRegistrationPayload.parent,
        password: 'short',
      },
    };
    const res = RegisterParentAndStudentSchema.safeParse(invalid);
    expect(res.success).toBe(false);
  });

  it('rejects student date of birth not conforming to YYYY-MM-DD', () => {
    const invalidFormats = ['12/05/2014', '2014/05/12', '12-05-2014', '2014-5-12'];
    for (const dob of invalidFormats) {
      const invalid = {
        ...validRegistrationPayload,
        student: {
          ...validRegistrationPayload.student,
          dateOfBirth: dob,
        },
      };
      const res = RegisterParentAndStudentSchema.safeParse(invalid);
      expect(res.success).toBe(false);
    }
  });

  it('creates parent and student with initial consentStatus PENDING', async () => {
    const result = await registerFamilyAction(validRegistrationPayload);
    expect(result.success).toBe(true);
    expect(result.parent?.fullName).toBe('Carolina Gómez');
    expect(result.student?.fullName).toBe('Mateo Gómez');
    expect(result.student?.consentStatus).toBe('PENDING');
  });

  it('registers a family with multiple students and allows switching active sibling in authStore', async () => {
    const result = await registerFamilyAction({
      inviteCode: 'BELGRANO2026',
      parent: validRegistrationPayload.parent,
      students: [
        {
          fullName: 'Mateo Gómez',
          dni: '52345678',
          grade: '6° Primaria A',
          dateOfBirth: '2014-05-12',
        },
        {
          fullName: 'Sofía Gómez',
          dni: '55112233',
          grade: '3° Primaria A',
          dateOfBirth: '2017-08-24',
        },
      ],
    });

    expect(result.success).toBe(true);
    expect(result.students?.length).toBe(2);
    expect(result.students?.[1]?.fullName).toBe('Sofía Gómez');

    authStore.setParentSession(result.parent!, result.student, result.students);
    expect(authStore.getState().student?.fullName).toBe('Mateo Gómez');
    authStore.selectStudent(result.students![1]!.id);
    expect(authStore.getState().student?.fullName).toBe('Sofía Gómez');
  });
});
