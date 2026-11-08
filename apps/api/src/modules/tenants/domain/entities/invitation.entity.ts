export interface InstitutionInvitation {
  id: string;
  institutionId: string;
  code: string;
  expiresAt: Date | null;
  maxUses: number | null;
  usedCount: number;
  createdByUserId: string;
  createdAt: Date;
}
