import { describe, it, expect, beforeEach } from 'vitest';
import { InMemoryUserRepository } from '../src/modules/identity-parental/infrastructure/persistence/in-memory-user.repository.js';
import { InMemoryParentStudentLinkRepository } from '../src/modules/identity-parental/infrastructure/persistence/in-memory-parent-student-link.repository.js';
import { InMemoryParentalConsentRepository } from '../src/modules/identity-parental/infrastructure/persistence/in-memory-parental-consent.repository.js';
import { InMemorySpendingLimitsRepository } from '../src/modules/identity-parental/infrastructure/persistence/in-memory-spending-limits.repository.js';
import { CheckStudentConsentUseCase } from '../src/modules/identity-parental/application/use-cases/check-student-consent.use-case.js';
import { UpdateSpendingLimitsUseCase } from '../src/modules/identity-parental/application/use-cases/update-spending-limits.use-case.js';
import { GetSpendingLimitsUseCase } from '../src/modules/identity-parental/application/use-cases/get-spending-limits.use-case.js';
import { ParentalControlsService } from '../src/modules/identity-parental/application/services/parental-controls.service.js';
import {
  AccountPausedException,
  CategoryBlockedException,
  DailyLimitExceededException,
  WeeklyLimitExceededException,
} from '../src/common/errors/domain.exception.js';
import { DOMAIN_ERROR_CODES } from '@cambiazo/shared';

describe('Parental Controls: Spending Limits, Category Blocking & Pause', () => {
  let userRepo: InMemoryUserRepository;
  let linkRepo: InMemoryParentStudentLinkRepository;
  let consentRepo: InMemoryParentalConsentRepository;
  let limitsRepo: InMemorySpendingLimitsRepository;

  let checkConsentUseCase: CheckStudentConsentUseCase;
  let updateLimitsUseCase: UpdateSpendingLimitsUseCase;
  let getLimitsUseCase: GetSpendingLimitsUseCase;
  let parentalControlsService: ParentalControlsService;

  const institutionId = '11111111-1111-1111-1111-111111111111';
  const parentId = 'parent-1';
  const studentId = 'student-1';

  beforeEach(async () => {
    userRepo = new InMemoryUserRepository();
    linkRepo = new InMemoryParentStudentLinkRepository();
    consentRepo = new InMemoryParentalConsentRepository();
    limitsRepo = new InMemorySpendingLimitsRepository();

    checkConsentUseCase = new CheckStudentConsentUseCase(userRepo, consentRepo);
    updateLimitsUseCase = new UpdateSpendingLimitsUseCase(userRepo, linkRepo, limitsRepo);
    getLimitsUseCase = new GetSpendingLimitsUseCase(userRepo, linkRepo, limitsRepo);
    parentalControlsService = new ParentalControlsService(limitsRepo, checkConsentUseCase);

    // Seed parent and student
    await userRepo.create({
      id: parentId,
      institutionId,
      role: 'PARENT',
      email: 'padre@colegio.edu.ar',
      passwordHash: 'hash',
      fullName: 'Martin Benitez',
      isActive: true,
      createdAt: new Date(),
    });

    await userRepo.create({
      id: studentId,
      institutionId,
      role: 'STUDENT',
      email: 'alumno@colegio.edu.ar',
      passwordHash: 'hash',
      fullName: 'Lucas Benitez',
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
  });

  describe('Configuring Spending Limits (PUT /api/v1/students/:id/limits)', () => {
    it('allows linked parent to configure daily and weekly caps and blocked categories', async () => {
      const saved = await updateLimitsUseCase.execute(
        parentId,
        studentId,
        institutionId,
        {
          studentId,
          dailyLimitCents: 200000, // $2,000 ARS
          weeklyLimitCents: 800000, // $8,000 ARS
          blockedCategories: ['CANDY'],
          isPaused: false,
        },
      );

      expect(saved.studentId).toBe(studentId);
      expect(saved.dailyLimitCents).toBe(200000);
      expect(saved.weeklyLimitCents).toBe(800000);
      expect(saved.blockedCategories).toEqual(['CANDY']);
      expect(saved.isPaused).toBe(false);

      const retrieved = await getLimitsUseCase.execute(
        parentId,
        'PARENT',
        studentId,
        institutionId,
      );
      expect(retrieved.dailyLimitCents).toBe(200000);
      expect(retrieved.blockedCategories).toEqual(['CANDY']);
    });

    it('rejects limit configuration by an unrelated parent', async () => {
      await expect(
        updateLimitsUseCase.execute(
          'stranger-parent',
          studentId,
          institutionId,
          {
            dailyLimitCents: 100000,
            weeklyLimitCents: 500000,
            blockedCategories: [],
            isPaused: false,
          },
        ),
      ).rejects.toThrowError(
        expect.objectContaining({
          code: DOMAIN_ERROR_CODES.STUDENT_NOT_LINKED_TO_PARENT,
        }),
      );
    });
  });

  describe('Instant Account Pause', () => {
    it('immediately suspends student operations when isPaused is true', async () => {
      await updateLimitsUseCase.execute(
        parentId,
        studentId,
        institutionId,
        {
          dailyLimitCents: 200000,
          weeklyLimitCents: 800000,
          blockedCategories: [],
          isPaused: true, // PAUSED
        },
      );

      // Student user must be inactive
      const studentInDb = await userRepo.findById(studentId);
      expect(studentInDb?.isActive).toBe(false);

      // Eligibility check throws AccountPausedException
      await expect(
        parentalControlsService.validateStudentEligibility(studentId, institutionId),
      ).rejects.toThrowError(AccountPausedException);
    });

    it('restores operations when account is unpaused', async () => {
      // Pause
      await updateLimitsUseCase.execute(
        parentId,
        studentId,
        institutionId,
        {
          dailyLimitCents: 200000,
          weeklyLimitCents: 800000,
          blockedCategories: [],
          isPaused: true,
        },
      );

      // Unpause
      await updateLimitsUseCase.execute(
        parentId,
        studentId,
        institutionId,
        {
          dailyLimitCents: 200000,
          weeklyLimitCents: 800000,
          blockedCategories: [],
          isPaused: false,
        },
      );

      const studentInDb = await userRepo.findById(studentId);
      expect(studentInDb?.isActive).toBe(true);

      await expect(
        parentalControlsService.validateStudentEligibility(studentId, institutionId),
      ).resolves.not.toThrow();
    });
  });

  describe('Category Blocking Enforcement', () => {
    it('blocks purchases containing items from blocked categories', async () => {
      await updateLimitsUseCase.execute(
        parentId,
        studentId,
        institutionId,
        {
          dailyLimitCents: 500000,
          weeklyLimitCents: 2000000,
          blockedCategories: ['CANDY'],
          isPaused: false,
        },
      );

      // Purchase contains CANDY -> must throw CategoryBlockedException
      await expect(
        parentalControlsService.validatePurchaseItemsAndLimits(
          studentId,
          institutionId,
          [
            { category: 'HEALTHY_SNACK', priceCents: 50000, quantity: 1 },
            { category: 'CANDY', priceCents: 30000, quantity: 1 },
          ],
          0,
          0,
        ),
      ).rejects.toThrowError(CategoryBlockedException);
    });

    it('permits purchases containing only allowed categories', async () => {
      await updateLimitsUseCase.execute(
        parentId,
        studentId,
        institutionId,
        {
          dailyLimitCents: 500000,
          weeklyLimitCents: 2000000,
          blockedCategories: ['CANDY'],
          isPaused: false,
        },
      );

      await expect(
        parentalControlsService.validatePurchaseItemsAndLimits(
          studentId,
          institutionId,
          [
            { category: 'HEALTHY_SNACK', priceCents: 50000, quantity: 1 },
            { category: 'DRINK', priceCents: 70000, quantity: 1 },
          ],
          0,
          0,
        ),
      ).resolves.not.toThrow();
    });
  });

  describe('Daily and Weekly Spending Caps', () => {
    it('rejects purchase exceeding daily spending cap', async () => {
      await updateLimitsUseCase.execute(
        parentId,
        studentId,
        institutionId,
        {
          dailyLimitCents: 150000, // $1,500 daily limit
          weeklyLimitCents: 1000000,
          blockedCategories: [],
          isPaused: false,
        },
      );

      // Student already spent $1,000 (100000 cents) today
      // Attempting to buy item for $700 (70000 cents) -> Total $1,700 > $1,500
      await expect(
        parentalControlsService.validatePurchaseItemsAndLimits(
          studentId,
          institutionId,
          [{ category: 'HEALTHY_SNACK', priceCents: 70000, quantity: 1 }],
          100000, // spent today
          100000, // spent this week
        ),
      ).rejects.toThrowError(DailyLimitExceededException);
    });

    it('rejects purchase exceeding weekly spending cap', async () => {
      await updateLimitsUseCase.execute(
        parentId,
        studentId,
        institutionId,
        {
          dailyLimitCents: 500000,
          weeklyLimitCents: 600000, // $6,000 weekly limit
          blockedCategories: [],
          isPaused: false,
        },
      );

      // Student spent $5,000 this week, $500 today.
      // Attempting to buy item for $1,500 -> Total this week $6,500 > $6,000
      await expect(
        parentalControlsService.validatePurchaseItemsAndLimits(
          studentId,
          institutionId,
          [{ category: 'HOT_MEAL', priceCents: 150000, quantity: 1 }],
          50000,
          500000,
        ),
      ).rejects.toThrowError(WeeklyLimitExceededException);
    });
  });
});
