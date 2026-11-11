import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  evaluateStudentConsentAccess,
  grantParentalConsentAction,
  revokeParentalConsentAction,
} from '../src/core';
import { authStore } from '../src/shared/store/auth-store';
import {
  installTestBackend,
  TEST_STUDENT_ID,
  type TestBackendState,
} from './helpers/test-backend';

describe('Student Consent Gate & Access Enforcement', () => {
  const studentId = TEST_STUDENT_ID;
  let backendState: TestBackendState;
  let restoreFetch: (() => void) | null = null;

  beforeEach(() => {
    const setup = installTestBackend();
    backendState = setup.state;
    restoreFetch = setup.restore;
    authStore.logout();
  });

  afterEach(() => {
    restoreFetch?.();
  });

  it('strictly blocks student access when consent status is PENDING', () => {
    const student = backendState.students.get(studentId);
    const access = evaluateStudentConsentAccess(student);
    expect(access.allowed).toBe(false);
    expect(access.status).toBe('PENDING');
    expect(access.reason).toContain('consentimiento digital');
  });

  it('strictly blocks student access when consent status is REVOKED', async () => {
    await revokeParentalConsentAction({
      studentId,
      reason: 'Pausa familiar',
    });

    const student = backendState.students.get(studentId);
    const access = evaluateStudentConsentAccess(student);
    expect(access.allowed).toBe(false);
    expect(access.status).toBe('REVOKED');
    expect(access.reason).toContain('fue revocado por tu tutor');
  });

  it('permits student access ONLY when consent status is GRANTED', async () => {
    await grantParentalConsentAction({
      studentId,
      acceptedTermsVersion: 'v1.0-ley25326',
      acceptedAt: new Date().toISOString(),
      signatureIp: '181.164.20.15',
    });

    const student = backendState.students.get(studentId);
    const access = evaluateStudentConsentAccess(student);
    expect(access.allowed).toBe(true);
    expect(access.status).toBe('GRANTED');
    expect(student?.fullName).toBe('Mateo Gómez');
  });

  it('notifies reactive authStore subscribers when student consent changes', async () => {
    const student = backendState.students.get(studentId)!;
    authStore.setStudentSession(student);

    let observedStatus = authStore.getState().student?.consentStatus;
    expect(observedStatus).toBe('PENDING');

    const unsubscribe = authStore.subscribe((state) => {
      observedStatus = state.student?.consentStatus;
    });

    authStore.updateStudentConsent('GRANTED');
    expect(observedStatus).toBe('GRANTED');

    authStore.updateStudentConsent('REVOKED');
    expect(observedStatus).toBe('REVOKED');

    unsubscribe();
  });
});
