import { describe, it, expect, beforeEach } from 'vitest';
import { InMemoryUserRepository } from '../src/modules/identity-parental/infrastructure/persistence/in-memory-user.repository.js';
import { InMemoryParentStudentLinkRepository } from '../src/modules/identity-parental/infrastructure/persistence/in-memory-parent-student-link.repository.js';
import { InMemoryParentalConsentRepository } from '../src/modules/identity-parental/infrastructure/persistence/in-memory-parental-consent.repository.js';
import { CheckStudentConsentUseCase } from '../src/modules/identity-parental/application/use-cases/check-student-consent.use-case.js';
import { GrantParentalConsentUseCase } from '../src/modules/identity-parental/application/use-cases/grant-parental-consent.use-case.js';
import { InMemoryLedgerRepository } from '../src/modules/wallet-ledger/infrastructure/persistence/in-memory-ledger.repository.js';
import { MercadoPagoMockGateway } from '../src/modules/wallet-ledger/infrastructure/gateways/mercadopago-mock.gateway.js';
import { LedgerService } from '../src/modules/wallet-ledger/application/services/ledger.service.js';
import { CreateTopUpPreferenceUseCase } from '../src/modules/wallet-ledger/application/use-cases/create-top-up-preference.use-case.js';
import { HandleMpTopupWebhookUseCase } from '../src/modules/wallet-ledger/application/use-cases/handle-mp-topup-webhook.use-case.js';
import { GetWalletBalanceUseCase } from '../src/modules/wallet-ledger/application/use-cases/get-wallet-balance.use-case.js';
import {
  ParentalConsentRequiredException,
  DomainException,
} from '../src/common/errors/domain.exception.js';
import { DOMAIN_ERROR_CODES } from '@cambiazo/shared';

describe('1-to-1 Balance Top-Up via Mercado Pago & Webhooks', () => {
  let userRepo: InMemoryUserRepository;
  let linkRepo: InMemoryParentStudentLinkRepository;
  let consentRepo: InMemoryParentalConsentRepository;
  let ledgerRepo: InMemoryLedgerRepository;
  let paymentGateway: MercadoPagoMockGateway;
  let ledgerService: LedgerService;

  let checkConsentUseCase: CheckStudentConsentUseCase;
  let grantConsentUseCase: GrantParentalConsentUseCase;
  let createPreferenceUseCase: CreateTopUpPreferenceUseCase;
  let handleWebhookUseCase: HandleMpTopupWebhookUseCase;
  let getBalanceUseCase: GetWalletBalanceUseCase;

  const institutionId = '11111111-1111-1111-1111-111111111111';
  const parentId = 'parent-1';
  const studentId = 'student-1';

  beforeEach(async () => {
    userRepo = new InMemoryUserRepository();
    linkRepo = new InMemoryParentStudentLinkRepository();
    consentRepo = new InMemoryParentalConsentRepository();
    ledgerRepo = new InMemoryLedgerRepository();
    paymentGateway = new MercadoPagoMockGateway();
    ledgerService = new LedgerService(ledgerRepo);

    checkConsentUseCase = new CheckStudentConsentUseCase(userRepo, consentRepo);
    grantConsentUseCase = new GrantParentalConsentUseCase(userRepo, linkRepo, consentRepo);

    createPreferenceUseCase = new CreateTopUpPreferenceUseCase(
      linkRepo,
      checkConsentUseCase,
      paymentGateway,
    );

    handleWebhookUseCase = new HandleMpTopupWebhookUseCase(
      paymentGateway,
      ledgerService,
    );

    getBalanceUseCase = new GetWalletBalanceUseCase(ledgerService, linkRepo);

    // Seed parent and student
    await userRepo.create({
      id: parentId,
      institutionId,
      role: 'PARENT',
      email: 'padre@colegio.edu.ar',
      passwordHash: 'hash',
      fullName: 'Roberto Gomez',
      isActive: true,
      createdAt: new Date(),
    });

    await userRepo.create({
      id: studentId,
      institutionId,
      role: 'STUDENT',
      email: 'alumno@colegio.edu.ar',
      passwordHash: 'hash',
      fullName: 'Facundo Gomez',
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

    // Grant parental consent
    await consentRepo.append({
      id: 'consent-1',
      institutionId,
      parentUserId: parentId,
      studentUserId: studentId,
      action: 'GRANTED',
      termsVersion: 'v1.0.0',
      ipAddress: '190.11.22.33',
      userAgent: 'JestTest',
      createdAt: new Date(),
    });
  });

  describe('Creating Top-Up Preference', () => {
    it('creates a Mercado Pago checkout preference for valid parent-student link and active consent', async () => {
      const pref = await createPreferenceUseCase.execute(
        parentId,
        institutionId,
        {
          studentId,
          amountCents: 500000, // $5,000 ARS
        },
        'padre@colegio.edu.ar',
      );

      expect(pref.preferenceId).toBeDefined();
      expect(pref.initPoint).toContain(pref.preferenceId);
      expect(pref.externalReference).toBeDefined();
    });

    it('rejects preference creation if parent is not linked to student', async () => {
      await expect(
        createPreferenceUseCase.execute(
          'other-unlinked-parent',
          institutionId,
          {
            studentId,
            amountCents: 200000,
          },
        ),
      ).rejects.toThrowError(
        expect.objectContaining({
          code: DOMAIN_ERROR_CODES.STUDENT_NOT_LINKED_TO_PARENT,
        }),
      );
    });

    it('rejects preference creation if student lacks parental consent', async () => {
      const unconsentedStudentId = 'unconsented-student-2';
      await userRepo.create({
        id: unconsentedStudentId,
        institutionId,
        role: 'STUDENT',
        email: 'sinconsentimiento@colegio.edu.ar',
        passwordHash: 'hash',
        fullName: 'Sin Consentimiento',
        isActive: false,
        createdAt: new Date(),
      });

      await linkRepo.create({
        id: 'link-2',
        institutionId,
        parentUserId: parentId,
        studentUserId: unconsentedStudentId,
        createdAt: new Date(),
      });

      await expect(
        createPreferenceUseCase.execute(
          parentId,
          institutionId,
          {
            studentId: unconsentedStudentId,
            amountCents: 100000,
          },
        ),
      ).rejects.toThrowError(ParentalConsentRequiredException);
    });
  });

  describe('Idempotent Webhook Processing', () => {
    it('processes approved payment webhook, crediting student 1-to-1 in double-entry ledger', async () => {
      // 1. Create preference to register mock payment
      const pref = await createPreferenceUseCase.execute(
        parentId,
        institutionId,
        {
          studentId,
          amountCents: 350000, // $3,500 ARS
        },
      );

      // 2. Initial balance is 0
      const initialBalance = await getBalanceUseCase.getStudentBalance(
        parentId,
        'PARENT',
        studentId,
        institutionId,
      );
      expect(initialBalance.balanceCents).toBe(0);

      // 3. Process webhook
      const webhookResult = await handleWebhookUseCase.execute({
        id: pref.preferenceId,
        type: 'payment',
        data: { id: pref.preferenceId },
        externalReference: pref.externalReference,
      });

      expect(webhookResult.status).toBe('PROCESSED');
      expect(webhookResult.transactionId).toBeDefined();

      // 4. Verify balance is credited exactly 1-to-1 in cents ($3,500)
      const afterTopUp = await getBalanceUseCase.getStudentBalance(
        parentId,
        'PARENT',
        studentId,
        institutionId,
      );
      expect(afterTopUp.balanceCents).toBe(350000);
      expect(afterTopUp.formattedBalance).toBe('$3500.00');

      // 5. Verify clearing account also has matching debit in ledger
      const clearingAccount = await ledgerService.getPlatformClearingAccount(institutionId);
      expect(clearingAccount.balanceCents).toBe(350000);
    });

    it('enforces strict idempotency: duplicate webhook does not credit funds twice', async () => {
      const pref = await createPreferenceUseCase.execute(
        parentId,
        institutionId,
        {
          studentId,
          amountCents: 200000,
        },
      );

      // First webhook
      const firstRun = await handleWebhookUseCase.execute({
        id: pref.preferenceId,
        type: 'payment',
        data: { id: pref.preferenceId },
      });
      expect(firstRun.status).toBe('PROCESSED');

      // Duplicate webhook
      const duplicateRun = await handleWebhookUseCase.execute({
        id: pref.preferenceId,
        type: 'payment',
        data: { id: pref.preferenceId },
      });
      expect(duplicateRun.status).toBe('ALREADY_PROCESSED');
      expect(duplicateRun.transactionId).toBe(firstRun.transactionId);

      // Balance remains 200000, NOT 400000
      const balance = await getBalanceUseCase.getStudentBalance(
        parentId,
        'PARENT',
        studentId,
        institutionId,
      );
      expect(balance.balanceCents).toBe(200000);
    });

    it('ignores non-approved payment statuses', async () => {
      paymentGateway.registerMockPayment({
        paymentId: 'pending-payment-99',
        externalReference: 'ext-99',
        status: 'pending',
        amountCents: 500000,
        studentId,
        institutionId,
      });

      const res = await handleWebhookUseCase.execute({
        id: 'pending-payment-99',
        type: 'payment',
        data: { id: 'pending-payment-99' },
      });

      expect(res.status).toBe('IGNORED');
      expect(res.reason).toContain('pending');
    });
  });
});
