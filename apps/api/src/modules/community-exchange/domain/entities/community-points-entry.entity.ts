export interface CommunityPointsEntry {
  id: string;
  institutionId: string;
  studentUserId: string;
  pointsDelta: number;
  reason: string;
  referenceId?: string;
  createdAt: Date;
}
