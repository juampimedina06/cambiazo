import { Injectable } from '@nestjs/common';
import { CURRENCY } from '@cambiazo/shared';

@Injectable()
export class AppService {
  getHealth(): { status: string; service: string; currency: string } {
    return {
      status: 'ok',
      service: 'cambiazo-api',
      currency: CURRENCY,
    };
  }
}
