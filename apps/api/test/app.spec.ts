import { describe, it, expect, beforeEach } from 'vitest';
import { AppService } from '../src/app.service.js';
import { AppController } from '../src/app.controller.js';
import { CURRENCY } from '@cambiazo/shared';

describe('AppController & Service', () => {
  let appService: AppService;
  let appController: AppController;

  beforeEach(() => {
    appService = new AppService();
    appController = new AppController(appService);
  });

  it('returns health check status with currency from @cambiazo/shared', () => {
    const health = appController.getHealth();
    expect(health).toEqual({
      status: 'ok',
      service: 'cambiazo-api',
      currency: CURRENCY,
    });
    expect(health.currency).toBe('ARS');
  });
});
