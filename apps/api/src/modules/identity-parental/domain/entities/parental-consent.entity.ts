export interface ParentalConsent {
  id: string;
  institutionId: string;
  parentUserId: string;
  studentUserId: string;
  action: 'GRANTED' | 'REVOKED';
  termsVersion: string;
  ipAddress: string;
  userAgent: string;
  reason?: string | null;
  createdAt: Date;
}
