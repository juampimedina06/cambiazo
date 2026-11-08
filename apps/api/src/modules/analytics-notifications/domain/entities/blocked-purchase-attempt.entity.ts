export interface BlockedPurchaseAttempt {
  id: string;
  institutionId: string;
  studentId: string;
  reason: string;
  attemptedAmountCents: number;
  categories: string[];
  createdAt: Date;
}
