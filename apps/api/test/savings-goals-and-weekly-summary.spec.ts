import { describe, it, expect, beforeEach } from 'vitest';
import { SavingsGoalService } from '../src/modules/wallet-ledger/application/services/savings-goal.service.js';
import { InMemorySavingsGoalRepository } from '../src/modules/wallet-ledger/infrastructure/persistence/in-memory-savings-goal.repository.js';
import { LedgerService } from '../src/modules/wallet-ledger/application/services/ledger.service.js';
import { InMemoryLedgerRepository } from '../src/modules/wallet-ledger/infrastructure/persistence/in-memory-ledger.repository.js';
import { WeeklySummaryService } from '../src/modules/analytics-notifications/application/services/weekly-summary.service.js';
import { WeeklySummaryWorker } from '../src/modules/analytics-notifications/application/workers/weekly-summary.worker.js';
import { InMemoryBlockedPurchaseRepository } from '../src/modules/analytics-notifications/infrastructure/persistence/in-memory-blocked-purchase.repository.js';
import { InMemoryCommunityPointsRepository } from '../src/modules/community-exchange/infrastructure/persistence/in-memory-community-points.repository.js';
import { InMemoryParentStudentLinkRepository } from '../src/modules/identity-parental/infrastructure/persistence/in-memory-parent-student-link.repository.js';
import { InMemoryCatalogProductRepository } from '../src/modules/kiosk-catalog/infrastructure/persistence/in-memory-catalog-product.repository.js';
import { InMemoryPaymentTokenRepository } from '../src/modules/kiosk-catalog/infrastructure/persistence/in-memory-payment-token.repository.js';
import { InMemorySpendingLimitsRepository } from '../src/modules/identity-parental/infrastructure/persistence/in-memory-spending-limits.repository.js';
import { InMemoryParentalConsentRepository } from '../src/modules/identity-parental/infrastructure/persistence/in-memory-parental-consent.repository.js';
import { InMemoryUserRepository } from '../src/modules/identity-parental/infrastructure/persistence/in-memory-user.repository.js';
import { GenerateStudentPaymentTokenUseCase } from '../src/modules/kiosk-catalog/application/use-cases/generate-student-payment-token.use-case.js';
import { CheckStudentConsentUseCase } from '../src/modules/identity-parental/application/use-cases/check-student-consent.use-case.js';
import { ParentalControlsService } from '../src/modules/identity-parental/application/services/parental-controls.service.js';
import { ProcessKioskQrPaymentUseCase } from '../src/modules/kiosk-catalog/application/use-cases/process-kiosk-qr-payment.use-case.js';

import {
  InsufficientFundsException,
  CategoryBlockedException,
  DailyLimitExceededException,
  AccountPausedException,
  TenantMismatchException,
  UnauthorizedRoleException,
  ProhibitedCommunityConversionException,
  ProhibitedTransferException,
} from '../src/common/errors/domain.exception.js';

describe('Savings Goals & Weekly Parent Financial Summary (WAVE-3-BACKEND-03)', () => {
  const institutionA = '11111111-1111-1111-1111-111111111111';
  const institutionB = '22222222-2222-2222-2222-222222222222';

  const parentId = 'c3333333-3333-4333-8333-333333333333';
  const studentId = 'a1111111-1111-4111-8111-111111111111';
  const otherStudentId = 'b2222222-2222-4222-8222-222222222222';
  const kioskUserId = 'd4444444-4444-4444-8444-444444444444';

  const prodLunchId = 'e5555555-5555-4555-8555-555555555555';
  const prodYogurId = 'e6666666-6666-4666-8666-666666666666';
  const prodAppleId = 'e1111111-1111-4111-8111-111111111111';
  const prodWaterId = 'e2222222-2222-4222-8222-222222222222';
  const prodNotebookId = 'e3333333-3333-4333-8333-333333333333';
  const prodCandyId = 'e4444444-4444-4444-8444-444444444444';


  let ledgerRepo: InMemoryLedgerRepository;
  let ledgerService: LedgerService;
  let savingsGoalRepo: InMemorySavingsGoalRepository;
  let savingsGoalService: SavingsGoalService;
  let blockedRepo: InMemoryBlockedPurchaseRepository;
  let pointsRepo: InMemoryCommunityPointsRepository;
  let linkRepo: InMemoryParentStudentLinkRepository;
  let weeklySummaryService: WeeklySummaryService;
  let weeklySummaryWorker: WeeklySummaryWorker;

  let userRepo: InMemoryUserRepository;
  let generateTokenUseCase: GenerateStudentPaymentTokenUseCase;
  let catalogRepo: InMemoryCatalogProductRepository;
  let tokenRepo: InMemoryPaymentTokenRepository;
  let limitsRepo: InMemorySpendingLimitsRepository;
  let consentRepo: InMemoryParentalConsentRepository;
  let parentalControlsService: ParentalControlsService;
  let processKioskPaymentUseCase: ProcessKioskQrPaymentUseCase;

  beforeEach(async () => {
    userRepo = new InMemoryUserRepository();
    await userRepo.create({
      id: studentId,
      institutionId: institutionA,
      role: 'STUDENT',
      email: 'alumno@school.edu.ar',
      passwordHash: 'hash',
      fullName: 'Nicolas Ramos',
      dni: '45000010',
      isActive: true,
      createdAt: new Date(),
    });


    ledgerRepo = new InMemoryLedgerRepository();
    ledgerService = new LedgerService(ledgerRepo);

    savingsGoalRepo = new InMemorySavingsGoalRepository();
    savingsGoalService = new SavingsGoalService(savingsGoalRepo, ledgerService);

    blockedRepo = new InMemoryBlockedPurchaseRepository();
    pointsRepo = new InMemoryCommunityPointsRepository();
    linkRepo = new InMemoryParentStudentLinkRepository();

    weeklySummaryService = new WeeklySummaryService(
      blockedRepo,
      ledgerRepo,
      pointsRepo,
      linkRepo,
    );
    weeklySummaryWorker = new WeeklySummaryWorker(weeklySummaryService);

    catalogRepo = new InMemoryCatalogProductRepository();
    tokenRepo = new InMemoryPaymentTokenRepository();
    limitsRepo = new InMemorySpendingLimitsRepository();
    consentRepo = new InMemoryParentalConsentRepository();

    const checkConsent = new CheckStudentConsentUseCase(userRepo, consentRepo);
    parentalControlsService = new ParentalControlsService(limitsRepo, checkConsent);
    generateTokenUseCase = new GenerateStudentPaymentTokenUseCase(parentalControlsService, tokenRepo);

    processKioskPaymentUseCase = new ProcessKioskQrPaymentUseCase(
      catalogRepo,
      tokenRepo,
      parentalControlsService,
      ledgerService,
      savingsGoalService,
      blockedRepo,
    );

    // Set up active parent-student link
    await linkRepo.create({
      id: 'link-1',
      institutionId: institutionA,
      parentUserId: parentId,
      studentUserId: studentId,
      createdAt: new Date(),
    });

    // Set up active parental consent (Ley 25.326 compliant)
    await consentRepo.append({
      id: 'consent-1',
      institutionId: institutionA,
      parentUserId: parentId,
      studentUserId: studentId,
      action: 'GRANTED',
      termsVersion: 'v1.0.0',
      ipAddress: '127.0.0.1',
      userAgent: 'Test Agent',
      createdAt: new Date(),
    });



    // Top up student wallet with $50.00 (5,000 cents) from platform clearing
    const studentAccount = await ledgerService.getStudentAccount(studentId, institutionA);
    const clearingAccount = await ledgerService.getPlatformClearingAccount(institutionA);

    await ledgerService.recordTransaction({
      institutionId: institutionA,
      referenceType: 'MP_TOPUP',
      referenceId: 'mp-init-5000',
      description: 'Initial wallet balance topup',
      entries: [
        {
          accountId: clearingAccount.id,
          direction: 'DEBIT',
          amountCents: 5000,
        },
        {
          accountId: studentAccount.id,
          direction: 'CREDIT',
          amountCents: 5000,
        },
      ],
    });
  });

  describe('1. Educational Student Savings Goals & Balance Reservation', () => {
    it('creates savings goal and reserves funds from student wallet', async () => {
      const goal = await savingsGoalService.createGoal(studentId, institutionA, {
        title: 'Mochila nueva',
        targetAmountCents: 10000,
        initialReservedCents: 2000, // 2,000 cents reserved
      });

      expect(goal.title).toBe('Mochila nueva');
      expect(goal.reservedAmountCents).toBe(2000);
      expect(goal.targetAmountCents).toBe(10000);
      expect(goal.isAchieved).toBe(false);

      // Student total account balance is still 5000 cents, but spendable balance is 3000 cents
      const studentAccount = await ledgerService.getStudentAccount(studentId, institutionA);
      expect(studentAccount.balanceCents).toBe(5000);

      const spendable = await savingsGoalService.getSpendableBalance(studentId, institutionA);
      expect(spendable).toBe(3000);
    });

    it('rejects creating a goal with initial reserve exceeding spendable balance', async () => {
      await expect(
        savingsGoalService.createGoal(studentId, institutionA, {
          title: 'Bicicleta',
          targetAmountCents: 50000,
          initialReservedCents: 6000, // exceeds 5,000 cents available
        }),
      ).rejects.toThrow(InsufficientFundsException);
    });

    it('deposits additional funds into goal and marks isAchieved when target is reached', async () => {
      const goal = await savingsGoalService.createGoal(studentId, institutionA, {
        title: 'Set de Dibujo Técnico',
        targetAmountCents: 3000,
        initialReservedCents: 1500,
      });

      expect(goal.isAchieved).toBe(false);

      const updated = await savingsGoalService.depositToGoal(studentId, institutionA, goal.id, {
        amountCents: 1500,
      });

      expect(updated.reservedAmountCents).toBe(3000);
      expect(updated.isAchieved).toBe(true);

      const spendable = await savingsGoalService.getSpendableBalance(studentId, institutionA);
      // 5000 balance - 3000 reserved = 2000 spendable
      expect(spendable).toBe(2000);
    });

    it('rejects deposit exceeding available spendable balance', async () => {
      const goal = await savingsGoalService.createGoal(studentId, institutionA, {
        title: 'Auriculares',
        targetAmountCents: 8000,
        initialReservedCents: 4000,
      });

      // Spendable balance is now 1000 cents. Trying to deposit 2000 must fail
      await expect(
        savingsGoalService.depositToGoal(studentId, institutionA, goal.id, {
          amountCents: 2000,
        }),
      ).rejects.toThrow(InsufficientFundsException);
    });

    it('releasing a savings goal unlocks reserved funds back to spendable balance', async () => {
      const goal = await savingsGoalService.createGoal(studentId, institutionA, {
        title: 'Zapatillas',
        targetAmountCents: 15000,
        initialReservedCents: 3500,
      });

      expect(await savingsGoalService.getSpendableBalance(studentId, institutionA)).toBe(1500);

      await savingsGoalService.cancelOrReleaseGoal(studentId, institutionA, goal.id);

      // Now all 5000 cents are spendable again
      expect(await savingsGoalService.getSpendableBalance(studentId, institutionA)).toBe(5000);
    });

    it('prohibits converting savings goals into points or cash withdrawals', () => {
      expect(() => savingsGoalService.prohibitConversionToPoints()).toThrow(
        ProhibitedCommunityConversionException,
      );
      expect(() => savingsGoalService.prohibitCashWithdrawal()).toThrow(
        ProhibitedTransferException,
      );
    });
  });

  describe('2. Kiosk Spending Protection Against Reserved Savings Goals', () => {
    it('blocks kiosk purchases that would spend funds reserved in savings goals', async () => {
      // Student has 5000 cents. Reserve 3500 cents in savings goal. Spendable: 1500 cents
      await savingsGoalService.createGoal(studentId, institutionA, {
        title: 'Viaje de Egresados',
        targetAmountCents: 50000,
        initialReservedCents: 3500,
      });

      // Set up product in kiosk catalog priced at $20.00 (2,000 cents)
      const product = await catalogRepo.create({
        id: prodLunchId,
        institutionId: institutionA,
        name: 'Super Sandwich Especial',
        category: 'HOT_MEAL',
        priceCents: 2000,
        stock: 10,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // Generate payment token for student
      const token = await generateTokenUseCase.execute(studentId, institutionA);

      // Attempt purchase of 2,000 cents (exceeds spendable 1,500 cents)
      await expect(
        processKioskPaymentUseCase.execute(kioskUserId, institutionA, {
          paymentTokenOrCode: token.token,
          items: [{ productId: product.id, quantity: 1 }],
          idempotencyKey: 'idem-kiosk-insufficient-spendable',
        }),
      ).rejects.toThrow(InsufficientFundsException);
    });

    it('allows kiosk purchases within spendable balance after savings goals deduction', async () => {
      // Student has 5000 cents. Reserve 3500 cents. Spendable: 1500 cents
      await savingsGoalService.createGoal(studentId, institutionA, {
        title: 'Microscopio',
        targetAmountCents: 20000,
        initialReservedCents: 3500,
      });

      // Product priced at $12.00 (1,200 cents)
      const product = await catalogRepo.create({
        id: prodYogurId,
        institutionId: institutionA,
        name: 'Yogur con Cereales',
        category: 'HEALTHY_SNACK',
        priceCents: 1200,
        stock: 10,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const token = await generateTokenUseCase.execute(studentId, institutionA);

      const receipt = await processKioskPaymentUseCase.execute(kioskUserId, institutionA, {
        paymentTokenOrCode: token.token,
        items: [{ productId: product.id, quantity: 1 }],
        idempotencyKey: 'idem-kiosk-valid-spendable',
      });

      expect(receipt.status).toBe('APPROVED');
      expect(receipt.totalCents).toBe(1200);

      // Spendable balance is now 1500 - 1200 = 300 cents
      const remainingSpendable = await savingsGoalService.getSpendableBalance(
        studentId,
        institutionA,
      );
      expect(remainingSpendable).toBe(300);
    });
  });

  describe('3. Weekly Parent Summary Consolidation', () => {
    it('accurately calculates totalSpentCents, breakdown, recent purchases, blocked attempts and community points', async () => {
      // 1. Set up products in catalog
      const snack = await catalogRepo.create({
        id: prodAppleId,
        institutionId: institutionA,
        name: 'Manzana Orgánica',
        category: 'HEALTHY_SNACK',
        priceCents: 500,
        stock: 50,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const drink = await catalogRepo.create({
        id: prodWaterId,
        institutionId: institutionA,
        name: 'Agua Mineral 500ml',
        category: 'DRINK',
        priceCents: 800,
        stock: 50,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const stationery = await catalogRepo.create({
        id: prodNotebookId,
        institutionId: institutionA,
        name: 'Cuaderno Rayado 48h',
        category: 'STATIONERY',
        priceCents: 1200,
        stock: 20,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // 2. Perform 2 successful purchases
      const token1 = await generateTokenUseCase.execute(studentId, institutionA);
      await processKioskPaymentUseCase.execute(kioskUserId, institutionA, {
        paymentTokenOrCode: token1.token,
        items: [
          { productId: snack.id, quantity: 2 }, // 1000 cents (HEALTHY_SNACK)
          { productId: drink.id, quantity: 1 }, // 800 cents (DRINK)
        ],
        idempotencyKey: 'tx-week-1',
      });

      const token2 = await generateTokenUseCase.execute(studentId, institutionA);
      await processKioskPaymentUseCase.execute(kioskUserId, institutionA, {
        paymentTokenOrCode: token2.token,
        items: [
          { productId: stationery.id, quantity: 1 }, // 1200 cents (STATIONERY)
        ],
        idempotencyKey: 'tx-week-2',
      });

      // Total purchases = 1800 + 1200 = 3000 cents

      // 3. Configure spending limit and trigger a BLOCKED purchase attempt
      await limitsRepo.save({
        studentId,
        institutionId: institutionA,
        dailyLimitCents: 2000,
        weeklyLimitCents: 10000,
        blockedCategories: ['CANDY'],
        isPaused: false,
        updatedAt: new Date(),
      });


      const candy = await catalogRepo.create({
        id: prodCandyId,
        institutionId: institutionA,
        name: 'Caramelos masticables',
        category: 'CANDY',
        priceCents: 300,
        stock: 10,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const tokenBlocked = await generateTokenUseCase.execute(studentId, institutionA);
      await expect(
        processKioskPaymentUseCase.execute(kioskUserId, institutionA, {
          paymentTokenOrCode: tokenBlocked.token,
          items: [{ productId: candy.id, quantity: 1 }],
          idempotencyKey: 'tx-blocked-candy',
        }),
      ).rejects.toThrow(CategoryBlockedException);


      // 4. Award community points to student within the 7-day window
      await pointsRepo.save({
        id: 'pts-donation-1',
        institutionId: institutionA,
        studentUserId: studentId,
        pointsDelta: 50,
        reason: 'EXCHANGE_DELIVERED',
        createdAt: new Date(),
      });

      // 5. Generate Weekly Summary for parent
      const summary = await weeklySummaryService.getWeeklySummary(
        parentId,
        institutionA,
        studentId,
      );

      // Verify exact matching of totalSpentCents to ledger purchases
      expect(summary.studentId).toBe(studentId);
      expect(summary.totalSpentCents).toBe(3000);

      // Verify recentPurchases list
      expect(summary.recentPurchases.length).toBe(3);

      // Verify breakdownByCategory
      const snackBreakdown = summary.breakdownByCategory.find(
        (b) => b.category === 'HEALTHY_SNACK',
      );
      expect(snackBreakdown?.amountCents).toBe(1000);
      expect(snackBreakdown?.percentage).toBe(33.33);

      const drinkBreakdown = summary.breakdownByCategory.find(
        (b) => b.category === 'DRINK',
      );
      expect(drinkBreakdown?.amountCents).toBe(800);
      expect(drinkBreakdown?.percentage).toBe(26.67);

      const stationeryBreakdown = summary.breakdownByCategory.find(
        (b) => b.category === 'STATIONERY',
      );
      expect(stationeryBreakdown?.amountCents).toBe(1200);
      expect(stationeryBreakdown?.percentage).toBe(40.0);

      // Verify blocked purchase attempts count
      expect(summary.blockedAttemptsCount).toBe(1);

      // Verify community points earned in the 7-day window
      expect(summary.communityPointsEarned).toBe(50);
    });

    it('rejects parent requesting summary for student they are not linked to', async () => {
      await expect(
        weeklySummaryService.getWeeklySummary(parentId, institutionA, otherStudentId),
      ).rejects.toThrow(UnauthorizedRoleException);
    });

    it('rejects cross-tenant access when parent institution differs from student link', async () => {
      await expect(
        weeklySummaryService.getWeeklySummary(parentId, institutionB, studentId),
      ).rejects.toThrow(UnauthorizedRoleException);
    });

    it('processes weekly summary successfully via WeeklySummaryWorker', async () => {
      const summary = await weeklySummaryWorker.processStudentWeeklySummary(
        parentId,
        institutionA,
        studentId,
      );

      expect(summary.studentId).toBe(studentId);
      expect(typeof summary.totalSpentCents).toBe('number');
      expect(Array.isArray(summary.breakdownByCategory)).toBe(true);
    });
  });
});
