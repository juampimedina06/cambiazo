export interface SchoolReward {
  id: string;
  institutionId: string;
  title: string;
  description: string;
  pointsCost: number;
  stock?: number;
  badgeImageUrl?: string;
  isActive: boolean;
  createdAt: Date;
}
