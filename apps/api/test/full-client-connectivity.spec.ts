import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { NestFactory } from '@nestjs/core';
import type { INestApplicationContext } from '@nestjs/common';
import { IncomingMessage, ServerResponse } from 'node:http';
import { Socket } from 'node:net';
import { AppModule } from '../src/app.module.js';
import { InMemoryInstitutionRepository } from '../src/modules/tenants/infrastructure/persistence/in-memory-institution.repository.js';
import { InMemoryInvitationRepository } from '../src/modules/tenants/infrastructure/persistence/in-memory-invitation.repository.js';
import { InMemoryUserRepository } from '../src/modules/identity-parental/infrastructure/persistence/in-memory-user.repository.js';
import { InMemoryParentStudentLinkRepository } from '../src/modules/identity-parental/infrastructure/persistence/in-memory-parent-student-link.repository.js';
import { InMemoryParentalConsentRepository } from '../src/modules/identity-parental/infrastructure/persistence/in-memory-parental-consent.repository.js';
import { InMemorySpendingLimitsRepository } from '../src/modules/identity-parental/infrastructure/persistence/in-memory-spending-limits.repository.js';
import { InMemoryCatalogProductRepository } from '../src/modules/kiosk-catalog/infrastructure/persistence/in-memory-catalog-product.repository.js';
import { InMemoryLedgerRepository } from '../src/modules/wallet-ledger/infrastructure/persistence/in-memory-ledger.repository.js';
import { InMemorySavingsGoalRepository } from '../src/modules/wallet-ledger/infrastructure/persistence/in-memory-savings-goal.repository.js';
import { InMemoryCommunityPointsRepository } from '../src/modules/community-exchange/infrastructure/persistence/in-memory-community-points.repository.js';
import { InMemorySchoolRewardRepository } from '../src/modules/community-exchange/infrastructure/persistence/in-memory-school-reward.repository.js';
import { InvitationsController } from '../src/modules/tenants/infrastructure/http/invitations.controller.js';
import { InstitutionsController } from '../src/modules/tenants/infrastructure/http/institutions.controller.js';
import { ConsentsController } from '../src/modules/identity-parental/infrastructure/http/consents.controller.js';
import { ParentalControlsController } from '../src/modules/identity-parental/infrastructure/http/parental-controls.controller.js';
import { WalletController } from '../src/modules/wallet-ledger/infrastructure/http/wallet.controller.js';
import { SavingsGoalsController } from '../src/modules/wallet-ledger/infrastructure/http/savings-goals.controller.js';
import { KioskPayoutsController } from '../src/modules/wallet-ledger/infrastructure/http/kiosk-payouts.controller.js';
import { StudentPaymentController } from '../src/modules/kiosk-catalog/infrastructure/http/student-payment.controller.js';
import { KioskPosController } from '../src/modules/kiosk-catalog/infrastructure/http/kiosk-pos.controller.js';
import { KioskCatalogController } from '../src/modules/kiosk-catalog/infrastructure/http/kiosk-catalog.controller.js';
import { CommunityController } from '../src/modules/community-exchange/infrastructure/http/community.controller.js';
import { ParentWeeklySummaryController } from '../src/modules/analytics-notifications/infrastructure/http/parent-weekly-summary.controller.js';
import type { AuthUser } from '../src/common/auth/auth-user.interface.js';

describe('Full-Stack Live Endpoints & DI Graph (Mobile & Web-Admin Contracts)', () => {
  let app: INestApplicationContext;

  beforeAll(async () => {
    app = await NestFactory.createApplicationContext(AppModule, { logger: false });

    // Seed all default repositories just like development mode
    app.get(InMemoryInstitutionRepository).seedDefault();
    app.get(InMemoryInvitationRepository).seedDefault();
    app.get(InMemoryUserRepository).seedDefault();
    app.get(InMemoryParentStudentLinkRepository).seedDefault();
    app.get(InMemoryParentalConsentRepository).seedDefault();
    app.get(InMemorySpendingLimitsRepository).seedDefault();
    app.get(InMemoryCatalogProductRepository).seedDefault();
    app.get(InMemoryLedgerRepository).seedDefault();
    app.get(InMemorySavingsGoalRepository).seedDefault();
    app.get(InMemoryCommunityPointsRepository).seedDefault();
    app.get(InMemorySchoolRewardRepository).seedDefault();
  });

  afterAll(async () => {
    await app.close();
  });

  it('validates all 4 school invitation codes (BELGRANO2026, SANMARTIN2026, NORMAL12026, SAP2026)', async () => {
    const invitationsController = app.get(InvitationsController);
    for (const code of ['BELGRANO2026', 'SANMARTIN2026', 'NORMAL12026', 'SAP2026']) {
      const body = await invitationsController.validateInvitation(code);
      expect(body.valid).toBe(true);
      expect(body.institution.id).toBeDefined();
      expect(body.institution.name).toBeDefined();
      expect(body.invitation.code).toBe(code);
    }
  });

  it('executes full mobile student & parent flow: limits, top-up preference, QR token, kiosk charge, savings goals, and rewards', async () => {
    const instId = 'e28bb18a-66fe-4f8e-9092-2df283f55001';
    const parentId = '11111111-1111-4111-8111-111111111111';
    const studentId = '22222222-2222-4222-8222-222222222222';

    const parentUser: AuthUser = {
      id: parentId,
      role: 'PARENT',
      institutionId: instId,
      email: 'carolina@cambiazo.local',
      fullName: 'Carolina Gómez',
    };
    const studentUser: AuthUser = {
      id: studentId,
      role: 'STUDENT',
      institutionId: instId,
      email: 'mateo@cambiazo.local',
      fullName: 'Mateo Gómez',
    };
    const kioskUser: AuthUser = {
      id: 'kiosk-user-1',
      role: 'KIOSK',
      institutionId: instId,
      email: 'kiosco@cambiazo.local',
      fullName: 'Kiosco Escolar',
    };

    // 1. Update Spending Limits (Parent)
    const parentalControls = app.get(ParentalControlsController);
    const limits = await parentalControls.updateLimits(
      studentId,
      {
        studentId,
        dailyLimitCents: 250000,
        weeklyLimitCents: 1000000,
        blockedCategories: [],
        isPaused: false,
      },
      parentUser,
      instId,
    );
    expect(limits.dailyLimitCents).toBe(250000);

    // 2. Create Top-Up Preference (Parent)
    const walletController = app.get(WalletController);
    const topupJson = await walletController.createTopUpPreference(
      { studentId, amountCents: 200000 },
      parentUser,
      instId,
    );
    expect(topupJson.preferenceId).toBeDefined();

    // 3. Generate Student QR Payment Token (Student)
    const studentPaymentController = app.get(StudentPaymentController);
    const qrJson = await studentPaymentController.generatePaymentToken(studentUser, instId);
    expect(qrJson.token).toBeDefined();
    expect(qrJson.code).toMatch(/^\d{6}$/);

    // 4. Process Kiosk Charge with 6-digit backup code (Kiosk)
    const kioskPosController = app.get(KioskPosController);
    const chargeJson = await kioskPosController.charge(
      {
        paymentTokenOrCode: qrJson.code,
        items: [{ productId: '10000000-0000-4000-8000-000000000004', quantity: 1 }],
        idempotencyKey: 'e2e-kiosk-charge-001',
      },
      kioskUser,
      instId,
    );
    expect(chargeJson.totalCents).toBe(60000);
    expect(chargeJson.status).toBe('APPROVED');

    // 5. Deposit into Savings Goal (Student)
    const savingsGoalsController = app.get(SavingsGoalsController);
    const updatedGoal = await savingsGoalsController.deposit(studentUser, 'goal-1', {
      amountCents: 20000,
    });
    expect(updatedGoal.reservedAmountCents).toBeGreaterThanOrEqual(200000);

    // 6. Redeem Community Reward (Student)
    const communityController = app.get(CommunityController);
    const redemption = await communityController.redeemReward(studentUser, {
      studentId,
      rewardId: '66666666-6666-4666-8666-111111111111',
    });
    expect(redemption.rewardId).toBe('66666666-6666-4666-8666-111111111111');

    // 7. Weekly Parent Summary (Parent)
    const weeklySummaryController = app.get(ParentWeeklySummaryController);
    const summaryJson = await weeklySummaryController.getWeeklySummary(parentUser, studentId);
    expect(summaryJson.totalSpentCents).toBeGreaterThanOrEqual(60000);
  });

  it('serves all web-admin endpoints: institutions, invitations, roster, kiosk catalog/sales/ledger-balance/withdrawals, and community', async () => {
    const instId = 'e28bb18a-66fe-4f8e-9092-2df283f55001';
    const schoolAdminUser: AuthUser = {
      id: 'admin-web-user',
      role: 'SCHOOL_ADMIN',
      institutionId: instId,
      email: 'admin@cambiazo.local',
      fullName: 'Directora Belgrano',
    };
    const kioskUser: AuthUser = {
      id: 'kiosk-user-1',
      role: 'KIOSK',
      institutionId: instId,
      email: 'kiosco@cambiazo.local',
      fullName: 'Kiosco Escolar',
    };

    const institutionsController = app.get(InstitutionsController);
    const instList = await institutionsController.listInstitutions();
    expect(instList.length).toBeGreaterThanOrEqual(3);

    const invitationsController = app.get(InvitationsController);
    const invList = await invitationsController.listInvitations(schoolAdminUser, instId);
    expect(invList.length).toBeGreaterThanOrEqual(1);

    const consentsController = app.get(ConsentsController);
    const roster = await consentsController.getAllRoster(schoolAdminUser);
    expect(roster.length).toBeGreaterThanOrEqual(1);

    const kioskCatalogController = app.get(KioskCatalogController);
    const products = await kioskCatalogController.listProducts(instId);
    expect(products.length).toBeGreaterThanOrEqual(6);

    const kioskPosController = app.get(KioskPosController);
    const sales = await kioskPosController.listSales(instId);
    expect(sales.length).toBeGreaterThanOrEqual(1);

    const kioskPayoutsController = app.get(KioskPayoutsController);
    const ledgerBal = await kioskPayoutsController.getKioskLedgerBalance(kioskUser, instId);
    expect(ledgerBal.availableBalanceCents).toBeGreaterThan(0);

    const withdrawals = await kioskPayoutsController.listWithdrawals(instId);
    expect(Array.isArray(withdrawals)).toBe(true);
  });

  it('creates and deposits into savings goals through the full NestJS HTTP pipeline', async () => {
    const httpApp = await NestFactory.create(AppModule, { logger: false });
    httpApp.get(InMemoryInstitutionRepository).seedDefault();
    httpApp.get(InMemoryUserRepository).seedDefault();
    httpApp.get(InMemoryLedgerRepository).seedDefault();
    httpApp.get(InMemorySavingsGoalRepository).seedDefault();
    await httpApp.init();

    const expressApp = httpApp.getHttpAdapter().getInstance() as (
      req: unknown,
      res: unknown,
    ) => void;

    const invokeHttp = (
      method: string,
      path: string,
      headers: Record<string, string>,
      payload: unknown,
    ): Promise<{ status: number; body: Record<string, unknown> }> =>
      new Promise((resolve, reject) => {
        const rawBody = JSON.stringify(payload);
        const socket = new Socket();
        const req = new IncomingMessage(socket);
        req.method = method;
        req.url = path;
        req.headers = {
          ...headers,
          'content-type': 'application/json',
          'content-length': String(Buffer.byteLength(rawBody)),
        };
        req.push(rawBody);
        req.push(null);

        const chunks: Buffer[] = [];
        const res = new ServerResponse(req);
        res.write = ((chunk: string | Buffer) => {
          chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
          return true;
        }) as ServerResponse['write'];
        res.end = ((chunk?: string | Buffer) => {
          if (chunk && typeof chunk !== 'function') {
            chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
          }
          const text = Buffer.concat(chunks).toString('utf8');
          resolve({
            status: res.statusCode,
            body: text ? (JSON.parse(text) as Record<string, unknown>) : {},
          });
          return res;
        }) as ServerResponse['end'];

        try {
          expressApp(req, res);
        } catch (err) {
          reject(err);
        }
      });

    try {
      const headers = {
        'x-user-id': '22222222-2222-4222-8222-222222222222',
        'x-user-role': 'STUDENT',
        'x-institution-id': 'e28bb18a-66fe-4f8e-9092-2df283f55001',
      };

      const createRes = await invokeHttp(
        'POST',
        '/api/v1/wallet/savings-goals',
        headers,
        {
          title: 'Zapatillas nuevas',
          targetAmountCents: 150000,
        },
      );
      expect(createRes, JSON.stringify(createRes.body)).toMatchObject({ status: 201 });
      expect(createRes.body['title']).toBe('Zapatillas nuevas');
      expect(createRes.body['targetAmountCents']).toBe(150000);
      expect(createRes.body['reservedAmountCents']).toBe(0);

      const goalId = String(createRes.body['id']);
      const depositRes = await invokeHttp(
        'POST',
        `/api/v1/wallet/savings-goals/${goalId}/deposit`,
        headers,
        { amountCents: 50000 },
      );
      expect(depositRes.status).toBe(201);
      expect(depositRes.body['reservedAmountCents']).toBe(50000);
    } finally {
      await httpApp.close();
    }
  });
});
