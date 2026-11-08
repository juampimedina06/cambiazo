import { Injectable } from '@nestjs/common';
import type { EphemeralPaymentToken } from '../../domain/entities/payment-token.entity.js';
import type { PaymentTokenRepositoryPort } from '../../domain/ports/payment-token.repository.port.js';

@Injectable()
export class InMemoryPaymentTokenRepository implements PaymentTokenRepositoryPort {
  private readonly tokens = new Map<string, EphemeralPaymentToken>();
  private readonly byCode = new Map<string, string>(); // code -> token

  async save(token: EphemeralPaymentToken): Promise<void> {
    this.tokens.set(token.token, { ...token });
    if (token.code) {
      this.byCode.set(token.code, token.token);
    }
  }

  async findByTokenOrCode(tokenOrCode: string): Promise<EphemeralPaymentToken | null> {
    let t = this.tokens.get(tokenOrCode);
    if (!t) {
      const mappedToken = this.byCode.get(tokenOrCode);
      if (mappedToken) {
        t = this.tokens.get(mappedToken);
      }
    }

    if (!t) return null;
    return { ...t };
  }

  async markAsUsed(token: string): Promise<void> {
    const existing = this.tokens.get(token);
    if (existing) {
      existing.isUsed = true;
      this.tokens.set(token, existing);
    }
  }

  clear(): void {
    this.tokens.clear();
    this.byCode.clear();
  }
}
