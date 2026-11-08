import { describe, it, expect, beforeEach } from 'vitest';
import { mockApiClient } from '../src/shared/api/mock-client.js';
import { authStore } from '../src/shared/store/auth-store.js';

describe('Student Consent Gate & Access Enforcement', () => {
  const studentId = '22222222-2222-4222-8222-222222222222';

  beforeEach(() => {
    mockApiClient.resetToDefault();
    authStore.logout();
  });

  it('strictly blocks student access when consent status is PENDING', () => {
    const access = mockApiClient.checkStudentAccess(studentId);
    expect(access.allowed).toBe(false);
    expect(access.status).toBe('PENDING');
    expect(access.reason).toContain('aún no ha sido firmado');
  });

  it('strictly blocks student access when consent status is REVOKED', async () => {
    // Revoke
    await mockApiClient.revokeParentalConsent({
      studentId,
      reason: 'Pausa familiar',
    });

    const access = mockApiClient.checkStudentAccess(studentId);
    expect(access.allowed).toBe(false);
    expect(access.status).toBe('REVOKED');
    expect(access.reason).toContain('fue revocado por tu tutor');
  });

  it('permits student access ONLY when consent status is GRANTED', async () => {
    await mockApiClient.grantParentalConsent({
      studentId,
      acceptedTermsVersion: 'v1.0-ley25326',
      acceptedAt: new Date().toISOString(),
      signatureIp: '181.164.20.15',
    });

    const access = mockApiClient.checkStudentAccess(studentId);
    expect(access.allowed).toBe(true);
    expect(access.status).toBe('GRANTED');
    expect(access.student?.fullName).toBe('Mateo Gómez');
  });

  it('notifies reactive authStore subscribers when student consent changes', async () => {
    const student = mockApiClient.getStudent(studentId)!;
    authStore.setStudentSession(student);

    let observedStatus = authStore.getState().student?.consentStatus;
    expect(observedStatus).toBe('PENDING');

    const unsubscribe = authStore.subscribe((state) => {
      observedStatus = state.student?.consentStatus;
    });

    // Grant
    authStore.updateStudentConsent('GRANTED');
    expect(observedStatus).toBe('GRANTED');

    // Revoke
    authStore.updateStudentConsent('REVOKED');
    expect(observedStatus).toBe('REVOKED');

    unsubscribe();
  });
});
