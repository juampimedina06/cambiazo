export interface RewardRedemption {
  id: string;
  institutionId: string;
  studentUserId: string;
  rewardId: string;
  pointsCost: number;
  status: 'PENDING_PICKUP' | 'COLLECTED';
  createdAt: Date;
}
