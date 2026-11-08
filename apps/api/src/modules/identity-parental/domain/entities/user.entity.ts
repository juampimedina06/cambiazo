import type { UserRole } from '@cambiazo/shared';

export interface User {
  id: string;
  institutionId: string | null; // null strictly only for SUPER_ADMIN
  role: UserRole;
  email: string;
  passwordHash: string;
  fullName: string;
  dni?: string;
  phone?: string;
  grade?: string;
  dateOfBirth?: string;
  isActive: boolean;
  createdAt: Date;
}
