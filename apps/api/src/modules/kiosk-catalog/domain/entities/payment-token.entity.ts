export interface EphemeralPaymentToken {
  token: string;
  code: string; // 6-digit backup code for manual POS keypad entry
  studentId: string;
  institutionId: string;
  expiresAt: Date;
  isUsed: boolean;
  createdAt: Date;
}
