import type { BillingPlanType, InstitutionStatus } from '@cambiazo/shared';

export interface Institution {
  id: string;
  name: string;
  cuit: string; // Argentine tax_id
  address: string;
  billingPlanType: BillingPlanType;
  monthlyFeeCents: number;
  status: InstitutionStatus;
  createdAt: Date;
}
