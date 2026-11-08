import { describe, it, expect, beforeEach } from 'vitest';
import { InMemoryUserRepository } from '../src/modules/identity-parental/infrastructure/persistence/in-memory-user.repository.js';
import { InMemoryParentStudentLinkRepository } from '../src/modules/identity-parental/infrastructure/persistence/in-memory-parent-student-link.repository.js';
import { InMemoryParentalConsentRepository } from '../src/modules/identity-parental/infrastructure/persistence/in-memory-parental-consent.repository.js';
import { InMemorySpendingLimitsRepository } from '../src/modules/identity-parental/infrastructure/persistence/in-memory-spending-limits.repository.js';
import { CheckStudentConsentUseCase } from '../src/modules/identity-parental/application/use-cases/check-student-consent.use-case.js';
import { UpdateSpendingLimitsUseCase } from '../src/modules/identity-parental/application/use-cases/update-spending-limits.use-case.js';
import { ParentalControlsService } from '../src/modules/identity-parental/application/services/parental-controls.service.js';
import { InMemoryLedgerRepository } from '../src/modules/wallet-ledger/infrastructure/persistence/in-memory-ledger.repository.js';
import { LedgerService } from '../src/modules/wallet-ledger/application/services/ledger.service.js';
import { RequestKioskPayoutUseCase } from '../src/modules/wallet-ledger/application/use-cases/request-kiosk-payout.use-case.js';
import { InMemoryCatalogProductRepository } from '../src/modules/kiosk-catalog/infrastructure/persistence/in-memory-catalog-product.repository.js';
import { InMemoryPaymentTokenRepository } from '../src/modules/kiosk-catalog/infrastructure/persistence/in-memory-payment-token.repository.js';
import { CreateCatalogProductUseCase } from '../src/modules/kiosk-catalog/application/use-cases/create-catalog-product.use-case.js';
import { ListCatalogProductsUseCase } from '../src/modules/kiosk-catalog/application/use-cases/list-catalog-products.use-case.js';
import { GenerateStudentPaymentTokenUseCase } from '../src/modules/kiosk-catalog/application/use-cases/generate-student-payment-token.use-case.js';
import { ProcessKioskQrPaymentUseCase } from '../src/modules/kiosk-catalog/application/use-cases/process-kiosk-qr-payment.use-case.js';
import {
  QrTokenExpiredException,
  TenantMismatchException,
  CategoryBlockedException,
  DailyLimitExceededException,
  InsufficientFundsException,
  InsufficientStockException,
} from '../src/common/errors/domain.exception.js';

describe('Kiosk Catalog, QR Checkout & Payouts (POS Flow)', () => {
  let userRepo: InMemoryUserRepository;
  let linkRepo: InMemoryParentStudentLinkRepository;
  let consentRepo: InMemoryParentalConsentRepository;
  let limitsRepo: InMemorySpendingLimitsRepository;
  let ledgerRepo: InMemoryLedgerRepository;
  let catalogRepo: InMemoryCatalogProductRepository;
  let tokenRepo: InMemoryPaymentTokenRepository;

  let checkConsentUseCase: CheckStudentConsentUseCase;
  let updateLimitsUseCase: UpdateSpendingLimitsUseCase;
  let parentalControlsService: ParentalControlsService;
  let ledgerService: LedgerService;
  let requestPayoutUseCase: RequestKioskPayoutUseCase;

  let createProductUseCase: CreateCatalogProductUseCase;
  let listProductsUseCase: ListCatalogProductsUseCase;
  let generateTokenUseCase: GenerateStudentPaymentTokenUseCase;
  let processPaymentUseCase: ProcessKioskQrPaymentUseCase;

  const institutionId = '11111111-1111-1111-1111-111111111111';
  const otherInstitutionId = '22222222-2222-2222-2222-222222222222';
  const parentId = 'parent-1';
  const studentId = 'student-1';
  const kioskUserId = 'kiosk-user-1';

  let alfajorId: string;
  let jugoId: string;
  let sandwichId: string;

  beforeEach(async () => {
    userRepo = new InMemoryUserRepository();
    linkRepo = new InMemoryParentStudentLinkRepository();
    consentRepo = new InMemoryParentalConsentRepository();
    limitsRepo = new InMemorySpendingLimitsRepository();
    ledgerRepo = new InMemoryLedgerRepository();
    catalogRepo = new InMemoryCatalogProductRepository();
    tokenRepo = new InMemoryPaymentTokenRepository();

    checkConsentUseCase = new CheckStudentConsentUseCase(userRepo, consentRepo);
    updateLimitsUseCase = new UpdateSpendingLimitsUseCase(userRepo, linkRepo, limitsRepo);
    parentalControlsService = new ParentalControlsService(limitsRepo, checkConsentUseCase);
    ledgerService = new LedgerService(ledgerRepo);
    requestPayoutUseCase = new RequestKioskPayoutUseCase(ledgerService);

    createProductUseCase = new CreateCatalogProductUseCase(catalogRepo);
    listProductsUseCase = new ListCatalogProductsUseCase(catalogRepo);
    generateTokenUseCase = new GenerateStudentPaymentTokenUseCase(parentalControlsService, tokenRepo);
    processPaymentUseCase = new ProcessKioskQrPaymentUseCase(
      catalogRepo,
      tokenRepo,
      parentalControlsService,
      ledgerService,
    );

    // Seed users
    await userRepo.create({
      id: parentId,
      institutionId,
      role: 'PARENT',
      email: 'padre@colegio.edu.ar',
      passwordHash: 'hash',
      fullName: 'Sergio Ramos',
      isActive: true,
      createdAt: new Date(),
    });

    await userRepo.create({
      id: studentId,
      institutionId,
      role: 'STUDENT',
      email: 'alumno@colegio.edu.ar',
      passwordHash: 'hash',
      fullName: 'Nicolas Ramos',
      isActive: true,
      createdAt: new Date(),
    });

    await userRepo.create({
      id: kioskUserId,
      institutionId,
      role: 'KIOSK',
      email: 'kiosco@colegio.edu.ar',
      passwordHash: 'hash',
      fullName: 'Kiosco Central',
      isActive: true,
      createdAt: new Date(),
    });

    await linkRepo.create({
      id: 'link-1',
      institutionId,
      parentUserId: parentId,
      studentUserId: studentId,
      createdAt: new Date(),
    });

    // Active parental consent
    await consentRepo.append({
      id: 'consent-1',
      institutionId,
      parentUserId: parentId,
      studentUserId: studentId,
      action: 'GRANTED',
      termsVersion: 'v1.0.0',
      ipAddress: '190.11.22.33',
      userAgent: 'Test',
      createdAt: new Date(),
    });

    // Seed catalog products
    const alfajor = await createProductUseCase.execute(institutionId, {
      institutionId,
      name: 'Alfajor de Chocolate',
      category: 'CANDY',
      priceCents: 150000, // $1,500 ARS
      stock: 20,
      isActive: true,
    });
    alfajorId = alfajor.id;

    const jugo = await createProductUseCase.execute(institutionId, {
      institutionId,
      name: 'Jugo de Naranja 250ml',
      category: 'DRINK',
      priceCents: 100000, // $1,000 ARS
      stock: 15,
      isActive: true,
    });
    jugoId = jugo.id;

    const sandwich = await createProductUseCase.execute(institutionId, {
      institutionId,
      name: 'Sandwich de Miga Integral',
      category: 'HEALTHY_SNACK',
      priceCents: 250000, // $2,500 ARS
      stock: 10,
      isActive: true,
    });
    sandwichId = sandwich.id;

    // Seed student ledger balance with $10,000 ARS (1000000 cents)
    const studentAccount = await ledgerService.getStudentAccount(studentId, institutionId);
    const clearingAccount = await ledgerService.getPlatformClearingAccount(institutionId);
    await ledgerService.recordTransaction({
      institutionId,
      referenceType: 'TOP_UP',
      description: 'Initial student seed balance',
      entries: [
        { accountId: clearingAccount.id, direction: 'DEBIT', amountCents: 1000000 },
        { accountId: studentAccount.id, direction: 'CREDIT', amountCents: 1000000 },
      ],
    });
  });

  describe('Catalog ABM & Listing', () => {
    it('creates and lists products partitioned by institution', async () => {
      const products = await listProductsUseCase.execute(institutionId);
      expect(products).toHaveLength(3);
      expect(products.map((p) => p.name)).toContain('Alfajor de Chocolate');

      // Another institution has 0 products
      const otherProducts = await listProductsUseCase.execute(otherInstitutionId);
      expect(otherProducts).toHaveLength(0);
    });
  });

  describe('Ephemeral Payment Token Generation (120s TTL)', () => {
    it('generates an ephemeral QR token and backup 6-digit code for active student', async () => {
      const tokenResult = await generateTokenUseCase.execute(studentId, institutionId);

      expect(tokenResult.token).toMatch(/^qr_/);
      expect(tokenResult.code).toMatch(/^\d{6}$/);
      expect(tokenResult.studentId).toBe(studentId);
      expect(tokenResult.institutionId).toBe(institutionId);

      const expiresAt = new Date(tokenResult.expiresAt).getTime();
      const now = Date.now();
      expect(expiresAt - now).toBeGreaterThan(115000); // approx 120s
      expect(expiresAt - now).toBeLessThanOrEqual(121000);
    });
  });

  describe('Atomic QR Charging at Kiosk POS', () => {
    it('successfully executes atomic payment, updating ledger with 0% platform commission and reducing stock', async () => {
      const token = await generateTokenUseCase.execute(studentId, institutionId);

      const receipt = await processPaymentUseCase.execute(
        kioskUserId,
        institutionId,
        {
          paymentTokenOrCode: token.token,
          idempotencyKey: 'charge-tx-001',
          items: [
            { productId: sandwichId, quantity: 1 }, // $2,500
            { productId: jugoId, quantity: 2 }, // $2,000
          ],
        },
      );

      expect(receipt.status).toBe('APPROVED');
      expect(receipt.totalCents).toBe(450000); // $4,500 ARS
      expect(receipt.commissionCents).toBe(0); // 0% commission!
      expect(receipt.items).toHaveLength(2);

      // Verify student balance: 1000000 - 450000 = 550000 cents ($5,500)
      const studentAcc = await ledgerService.getStudentAccount(studentId, institutionId);
      expect(studentAcc.balanceCents).toBe(550000);

      // Verify kiosk balance: 0 + 450000 = 450000 cents ($4,500)
      const kioskAcc = await ledgerService.getKioskAccount(kioskUserId, institutionId);
      expect(kioskAcc.balanceCents).toBe(450000);

      // Verify stock was reduced
      const updatedSandwich = await catalogRepo.findById(sandwichId);
      expect(updatedSandwich?.stock).toBe(9); // was 10

      const updatedJugo = await catalogRepo.findById(jugoId);
      expect(updatedJugo?.stock).toBe(13); // was 15
    });

    it('supports POS checkout using the 6-digit numeric backup code', async () => {
      const token = await generateTokenUseCase.execute(studentId, institutionId);

      const receipt = await processPaymentUseCase.execute(
        kioskUserId,
        institutionId,
        {
          paymentTokenOrCode: token.code, // 6-digit code!
          idempotencyKey: 'charge-code-002',
          items: [{ productId: jugoId, quantity: 1 }],
        },
      );

      expect(receipt.status).toBe('APPROVED');
      expect(receipt.totalCents).toBe(100000);
    });

    it('rejects expired or reused QR tokens', async () => {
      const token = await generateTokenUseCase.execute(studentId, institutionId);

      // First use succeeds
      await processPaymentUseCase.execute(kioskUserId, institutionId, {
        paymentTokenOrCode: token.token,
        idempotencyKey: 'charge-use-1',
        items: [{ productId: jugoId, quantity: 1 }],
      });

      // Second use with same token throws QrTokenExpiredException
      await expect(
        processPaymentUseCase.execute(kioskUserId, institutionId, {
          paymentTokenOrCode: token.token,
          idempotencyKey: 'charge-use-2',
          items: [{ productId: jugoId, quantity: 1 }],
        }),
      ).rejects.toThrowError(QrTokenExpiredException);
    });

    it('rejects cross-institution payments (Tenant Isolation)', async () => {
      const token = await generateTokenUseCase.execute(studentId, institutionId);

      // Kiosk from another institution tries to charge
      await expect(
        processPaymentUseCase.execute(
          'other-kiosk',
          otherInstitutionId,
          {
            paymentTokenOrCode: token.token,
            idempotencyKey: 'charge-other-tenant',
            items: [{ productId: jugoId, quantity: 1 }],
          },
        ),
      ).rejects.toThrowError(TenantMismatchException);
    });

    it('blocks payment when product belongs to a blocked category', async () => {
      // Parent blocks CANDY
      await updateLimitsUseCase.execute(parentId, studentId, institutionId, {
        dailyLimitCents: 1000000,
        weeklyLimitCents: 5000000,
        blockedCategories: ['CANDY'],
        isPaused: false,
      });

      const token = await generateTokenUseCase.execute(studentId, institutionId);

      await expect(
        processPaymentUseCase.execute(kioskUserId, institutionId, {
          paymentTokenOrCode: token.token,
          idempotencyKey: 'blocked-candy-attempt',
          items: [{ productId: alfajorId, quantity: 1 }], // alfajor is CANDY
        }),
      ).rejects.toThrowError(CategoryBlockedException);
    });

    it('blocks payment when daily limit is exceeded', async () => {
      // Daily limit: $2,000 (200000 cents)
      await updateLimitsUseCase.execute(parentId, studentId, institutionId, {
        dailyLimitCents: 200000,
        weeklyLimitCents: 1000000,
        blockedCategories: [],
        isPaused: false,
      });

      const token = await generateTokenUseCase.execute(studentId, institutionId);

      // Attempting to buy sandwich ($2,500 = 250000 cents > $2,000 daily limit)
      await expect(
        processPaymentUseCase.execute(kioskUserId, institutionId, {
          paymentTokenOrCode: token.token,
          idempotencyKey: 'limit-exceeded-attempt',
          items: [{ productId: sandwichId, quantity: 1 }],
        }),
      ).rejects.toThrowError(DailyLimitExceededException);
    });

    it('blocks payment when student balance is insufficient', async () => {
      // Create a student with 0 balance
      const brokeStudentId = 'broke-student-id';
      await userRepo.create({
        id: brokeStudentId,
        institutionId,
        role: 'STUDENT',
        email: 'broke@colegio.edu.ar',
        passwordHash: 'hash',
        fullName: 'Broke Student',
        isActive: true,
        createdAt: new Date(),
      });
      await linkRepo.create({
        id: 'link-broke',
        institutionId,
        parentUserId: parentId,
        studentUserId: brokeStudentId,
        createdAt: new Date(),
      });
      await consentRepo.append({
        id: 'consent-broke',
        institutionId,
        parentUserId: parentId,
        studentUserId: brokeStudentId,
        action: 'GRANTED',
        termsVersion: 'v1.0.0',
        ipAddress: '190.1.1.1',
        userAgent: 'Test',
        createdAt: new Date(),
      });

      const token = await generateTokenUseCase.execute(brokeStudentId, institutionId);

      await expect(
        processPaymentUseCase.execute(kioskUserId, institutionId, {
          paymentTokenOrCode: token.token,
          idempotencyKey: 'broke-student-attempt',
          items: [{ productId: sandwichId, quantity: 1 }],
        }),
      ).rejects.toThrowError(InsufficientFundsException);
    });

    it('blocks payment when product is out of stock', async () => {
      const token = await generateTokenUseCase.execute(studentId, institutionId);

      // Sandwich stock is 10, requesting 15
      await expect(
        processPaymentUseCase.execute(kioskUserId, institutionId, {
          paymentTokenOrCode: token.token,
          idempotencyKey: 'out-of-stock-attempt',
          items: [{ productId: sandwichId, quantity: 15 }],
        }),
      ).rejects.toThrowError(InsufficientStockException);
    });

    it('guarantees idempotency on duplicate charge requests', async () => {
      const token = await generateTokenUseCase.execute(studentId, institutionId);

      const idempotencyKey = 'pos-charge-idemp-999';

      const firstReceipt = await processPaymentUseCase.execute(
        kioskUserId,
        institutionId,
        {
          paymentTokenOrCode: token.token,
          idempotencyKey,
          items: [{ productId: jugoId, quantity: 1 }],
        },
      );
      expect(firstReceipt.status).toBe('APPROVED');

      // Retry with same idempotency key
      const secondReceipt = await processPaymentUseCase.execute(
        kioskUserId,
        institutionId,
        {
          paymentTokenOrCode: token.token,
          idempotencyKey,
          items: [{ productId: jugoId, quantity: 1 }],
        },
      );

      expect(secondReceipt.status).toBe('ALREADY_PROCESSED');
      expect(secondReceipt.transactionId).toBe(firstReceipt.transactionId);

      // Stock was decremented ONLY ONCE
      const jugoInDb = await catalogRepo.findById(jugoId);
      expect(jugoInDb?.stock).toBe(14); // was 15, -1 once
    });
  });

  describe('Kiosk Payout Requests (0% Platform Commission)', () => {
    it('allows kiosk owner to withdraw balance to Mercado Pago CVU/Alias with 0% platform deduction', async () => {
      // 1. Give kiosk $8,000 ARS (800000 cents) from sales
      const kioskAcc = await ledgerService.getKioskAccount(kioskUserId, institutionId);
      const studentAcc = await ledgerService.getStudentAccount(studentId, institutionId);

      await ledgerService.recordTransaction({
        institutionId,
        referenceType: 'KIOSK_PURCHASE',
        description: 'Sales seed',
        entries: [
          { accountId: studentAcc.id, direction: 'DEBIT', amountCents: 800000 },
          { accountId: kioskAcc.id, direction: 'CREDIT', amountCents: 800000 },
        ],
      });

      // 2. Kiosk requests withdrawal of $5,000 ARS (500000 cents)
      const payoutResult = await requestPayoutUseCase.execute(
        kioskUserId,
        institutionId,
        {
          amountCents: 500000,
          mercadoPagoAliasOrCvu: 'kiosco.colegio.mp',
          idempotencyKey: 'payout-tx-001',
        },
      );

      expect(payoutResult.status).toBe('PROCESSED');
      expect(payoutResult.amountCents).toBe(500000);
      expect(payoutResult.commissionCents).toBe(0);
      expect(payoutResult.netPayoutCents).toBe(500000);
      expect(payoutResult.destination).toBe('kiosco.colegio.mp');

      // 3. Verify kiosk balance reduced to $3,000 (300000 cents)
      const updatedKiosk = await ledgerRepo.getAccountById(kioskAcc.id);
      expect(updatedKiosk?.balanceCents).toBe(300000);
    });

    it('rejects withdrawal if kiosk balance is insufficient', async () => {
      // Kiosk has 0 balance, tries to withdraw 100000 cents ($1,000)
      await expect(
        requestPayoutUseCase.execute(
          kioskUserId,
          institutionId,
          {
            amountCents: 100000,
            mercadoPagoAliasOrCvu: 'kiosco.mp',
            idempotencyKey: 'payout-fail-001',
          },
        ),
      ).rejects.toThrowError(InsufficientFundsException);
    });
  });
});
