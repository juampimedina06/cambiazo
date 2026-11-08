export interface StudentSavingsGoal {
  id: string;
  institutionId: string;
  studentUserId: string;
  title: string;
  targetAmountCents: number;
  reservedAmountCents: number;
  isAchieved: boolean;
  createdAt: Date;
  updatedAt: Date;
}
