import { useState, useCallback } from 'react';
import { ValidateInviteCodeSchema } from '@cambiazo/shared';
import { mockApiClient, type MockInstitution } from '../../../shared/api/mock-client';
import { authStore } from '../../../shared/store/auth-store';

export interface UseSchoolCodeState {
  code: string;
  isLoading: boolean;
  error: string | null;
  institution: MockInstitution | null;
  isValid: boolean;
}

export function useSchoolCode() {
  const [code, setCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [institution, setInstitution] = useState<MockInstitution | null>(null);

  const handleCodeChange = useCallback((text: string) => {
    // Keep uppercase and clean characters
    const cleaned = text.trim().toUpperCase();
    setCode(cleaned);
    setError(null);
    setInstitution(null);
  }, []);

  const validateCode = useCallback(async (): Promise<boolean> => {
    const trimmed = code.trim().toUpperCase();
    const parseResult = ValidateInviteCodeSchema.safeParse({ code: trimmed });

    if (!parseResult.success) {
      const msg = parseResult.error.errors[0]?.message || 'El código debe tener entre 4 y 32 caracteres';
      setError(msg);
      return false;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await mockApiClient.validateInviteCode(parseResult.data.code);
      if (!result.success || !result.institution) {
        setError(result.error || 'Código escolar no encontrado');
        setInstitution(null);
        return false;
      }

      setInstitution(result.institution);
      authStore.setInstitution(result.institution);
      return true;
    } catch {
      setError('Error al conectar con la institución. Intenta nuevamente.');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [code]);

  return {
    code,
    isLoading,
    error,
    institution,
    isValid: Boolean(institution),
    handleCodeChange,
    validateCode,
  };
}
