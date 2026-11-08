import type { UserRole } from '@cambiazo/shared';

export interface AuthUser {
  id: string;
  email: string;
  role: UserRole;
  institutionId?: string | null;
  fullName: string;
}
