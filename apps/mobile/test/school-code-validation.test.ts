import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { ValidateInviteCodeSchema } from '@cambiazo/shared';
import { validateInviteCodeAction } from '../src/core';
import { installTestBackend } from './helpers/test-backend';

describe('School Code Onboarding (ValidateInviteCodeSchema)', () => {
  let restoreFetch: (() => void) | null = null;

  beforeEach(() => {
    restoreFetch = installTestBackend().restore;
  });

  afterEach(() => {
    restoreFetch?.();
  });

  it('accepts valid alphanumeric school codes between 4 and 32 characters', () => {
    const validCodes = ['BELGRANO2026', 'SANMARTIN2026', 'NORM1', 'ESC-123'];
    for (const code of validCodes) {
      const res = ValidateInviteCodeSchema.safeParse({ code });
      expect(res.success).toBe(true);
    }
  });

  it('rejects codes shorter than 4 characters', () => {
    const res = ValidateInviteCodeSchema.safeParse({ code: 'ABC' });
    expect(res.success).toBe(false);
  });

  it('rejects codes longer than 32 characters', () => {
    const res = ValidateInviteCodeSchema.safeParse({ code: 'A'.repeat(33) });
    expect(res.success).toBe(false);
  });

  it('correctly finds active institution for BELGRANO2026', async () => {
    const result = await validateInviteCodeAction('BELGRANO2026');
    expect(result.success).toBe(true);
    expect(result.institution?.name).toBe('Colegio Manuel Belgrano');
  });

  it('correctly finds active institution for SANMARTIN2026 case-insensitively', async () => {
    const result = await validateInviteCodeAction('sanmartin2026');
    expect(result.success).toBe(true);
    expect(result.institution?.name).toBe('Instituto San Martín');
  });

  it('returns an error when code is not associated with any active institution', async () => {
    const result = await validateInviteCodeAction('INVENTADO999');
    expect(result.success).toBe(false);
    expect(result.error).toContain('no corresponde');
  });
});
