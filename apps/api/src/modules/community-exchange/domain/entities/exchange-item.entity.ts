import type { ExchangeMode, ModerationStatus } from '@cambiazo/shared';

export interface ExchangeItem {
  id: string;
  institutionId: string;
  studentUserId: string;
  title: string;
  description: string;
  category: string;
  mode: ExchangeMode;
  photoUrls: string[];
  moderationStatus: ModerationStatus;
  moderatorNotes?: string;
  pickupPointNotes?: string;
  awardedPoints?: number;
  createdAt: Date;
  updatedAt: Date;
}
