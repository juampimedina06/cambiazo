import type { AccountType } from '@cambiazo/shared';

export interface Account {
  id: string;
  institutionId: string;
  userId: string | null; // student id, parent id, kiosk owner id, or null for platform clearing
  type: AccountType;
  currency: 'ARS';
  balanceCents: number;
  createdAt: Date;
  updatedAt: Date;
}
