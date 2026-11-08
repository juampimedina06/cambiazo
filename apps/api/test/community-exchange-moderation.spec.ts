import { describe, it, expect, beforeEach } from 'vitest';
import { CommunityService } from '../src/modules/community-exchange/application/services/community.service.js';
import { InMemoryExchangeItemRepository } from '../src/modules/community-exchange/infrastructure/persistence/in-memory-exchange-item.repository.js';
import { InMemoryCommunityPointsRepository } from '../src/modules/community-exchange/infrastructure/persistence/in-memory-community-points.repository.js';
import { InMemorySchoolRewardRepository } from '../src/modules/community-exchange/infrastructure/persistence/in-memory-school-reward.repository.js';
import { InMemoryRewardRedemptionRepository } from '../src/modules/community-exchange/infrastructure/persistence/in-memory-reward-redemption.repository.js';
import { InMemoryUserRepository } from '../src/modules/identity-parental/infrastructure/persistence/in-memory-user.repository.js';
import type { AuthUser } from '../src/common/auth/auth-user.interface.js';
import {
  TenantMismatchException,
  ItemNotApprovedException,
  ExchangeItemNotFoundException,
  RewardNotFoundException,
  InsufficientCommunityPointsException,
  InsufficientStockException,
  ProhibitedCommunityConversionException,
  UnauthorizedRoleException,
} from '../src/common/errors/domain.exception.js';

describe('Community Exchange, Moderation Desk & School Leaderboard (WAVE-3-BACKEND-03)', () => {
  let communityService: CommunityService;
  let itemRepo: InMemoryExchangeItemRepository;
  let pointsRepo: InMemoryCommunityPointsRepository;
  let rewardRepo: InMemorySchoolRewardRepository;
  let redemptionRepo: InMemoryRewardRedemptionRepository;
  let userRepo: InMemoryUserRepository;

  const schoolA = '11111111-1111-1111-1111-111111111111';
  const schoolB = '22222222-2222-2222-2222-222222222222';

  const studentA1: AuthUser = {
    id: 'student-a1',
    email: 'mateo@school-a.edu',
    role: 'STUDENT',
    institutionId: schoolA,
    fullName: 'Mateo Rossi',
  };

  const studentA2: AuthUser = {
    id: 'student-a2',
    email: 'lucia@school-a.edu',
    role: 'STUDENT',
    institutionId: schoolA,
    fullName: 'Lucia Gomez',
  };

  const studentB1: AuthUser = {
    id: 'student-b1',
    email: 'tomas@school-b.edu',
    role: 'STUDENT',
    institutionId: schoolB,
    fullName: 'Tomas Benitez',
  };

  const adminA: AuthUser = {
    id: 'admin-a',
    email: 'moderator@school-a.edu',
    role: 'SCHOOL_ADMIN',
    institutionId: schoolA,
    fullName: 'Directora Marta',
  };

  const adminB: AuthUser = {
    id: 'admin-b',
    email: 'moderator@school-b.edu',
    role: 'SCHOOL_ADMIN',
    institutionId: schoolB,
    fullName: 'Director Esteban',
  };

  beforeEach(async () => {
    itemRepo = new InMemoryExchangeItemRepository();
    pointsRepo = new InMemoryCommunityPointsRepository();
    rewardRepo = new InMemorySchoolRewardRepository();
    redemptionRepo = new InMemoryRewardRedemptionRepository();
    userRepo = new InMemoryUserRepository();

    await userRepo.create({
      id: studentA1.id,
      institutionId: schoolA,
      email: studentA1.email,
      passwordHash: 'hash',
      role: 'STUDENT',
      fullName: studentA1.fullName,
      dni: '45000001',
      isActive: true,
      createdAt: new Date(),
    });

    await userRepo.create({
      id: studentA2.id,
      institutionId: schoolA,
      email: studentA2.email,
      passwordHash: 'hash',
      role: 'STUDENT',
      fullName: studentA2.fullName,
      dni: '45000002',
      isActive: true,
      createdAt: new Date(),
    });

    await userRepo.create({
      id: studentB1.id,
      institutionId: schoolB,
      email: studentB1.email,
      passwordHash: 'hash',
      role: 'STUDENT',
      fullName: studentB1.fullName,
      dni: '45000003',
      isActive: true,
      createdAt: new Date(),
    });


    communityService = new CommunityService(
      itemRepo,
      pointsRepo,
      rewardRepo,
      redemptionRepo,
      userRepo,
    );
  });

  describe('1. Multi-Tenant Isolation', () => {
    it('prohibits student from School A from accessing items from School B', async () => {
      const itemB = await communityService.createItem(studentB1.id, schoolB, {
        title: 'Manual de Historia 2do Año',
        description: 'Libro en muy buen estado para 2do año',
        category: 'STATIONERY',
        mode: 'DONATION',
        photoUrls: ['https://storage.cambiazo.ar/items/history.jpg'],
      });

      await expect(
        communityService.getItemById(studentA1, itemB.id),
      ).rejects.toThrow(TenantMismatchException);
    });

    it('prohibits School Admin from School A from moderating items from School B', async () => {
      const itemB = await communityService.createItem(studentB1.id, schoolB, {
        title: 'Diccionario de Inglés Oxford',
        description: 'Diccionario bilingüe inglés-castellano',
        category: 'STATIONERY',
        mode: 'BARTER',
        photoUrls: ['https://storage.cambiazo.ar/items/dictionary.jpg'],
      });

      await expect(
        communityService.moderateItem(adminA.id, adminA.institutionId!, itemB.id, {
          itemId: itemB.id,
          status: 'APPROVED',
          moderatorNotes: 'Intento de moderacion cruzada',
          awardedPoints: 0,
        }),
      ).rejects.toThrow(TenantMismatchException);
    });

    it('prohibits student from School A from redeeming rewards defined by School B', async () => {
      const rewardB = await communityService.createReward(schoolB, {
        title: 'Regla Metálica 30cm',
        description: 'Útil escolar para geometría',
        pointsCost: 30,
        isActive: true,
      });

      await expect(
        communityService.redeemReward(studentA1.id, schoolA, {
          rewardId: rewardB.id,
          studentId: studentA1.id,
        }),
      ).rejects.toThrow(TenantMismatchException);
    });

    it('strictly isolates school leaderboard by institution_id', async () => {
      // Award points to student A1 in School A
      await pointsRepo.save({
        id: 'p-1',
        institutionId: schoolA,
        studentUserId: studentA1.id,
        pointsDelta: 100,
        reason: 'EXCHANGE_DELIVERED',
        createdAt: new Date(),
      });

      // Award points to student B1 in School B
      await pointsRepo.save({
        id: 'p-2',
        institutionId: schoolB,
        studentUserId: studentB1.id,
        pointsDelta: 250,
        reason: 'EXCHANGE_DELIVERED',
        createdAt: new Date(),
      });

      const leaderboardA = await communityService.getLeaderboard(schoolA);
      expect(leaderboardA).toHaveLength(1);
      expect(leaderboardA[0]?.studentId).toBe(studentA1.id);
      expect(leaderboardA[0]?.accumulatedPoints).toBe(100);

      const leaderboardB = await communityService.getLeaderboard(schoolB);
      expect(leaderboardB).toHaveLength(1);
      expect(leaderboardB[0]?.studentId).toBe(studentB1.id);
      expect(leaderboardB[0]?.accumulatedPoints).toBe(250);
    });
  });

  describe('2. Moderation Visibility Gating', () => {
    it('creates items in PENDING state by default', async () => {
      const item = await communityService.createItem(studentA1.id, schoolA, {
        title: 'Mochila Cartuchera Maped',
        description: 'Cartuchera de dos pisos sin roturas',
        category: 'STATIONERY',
        mode: 'DONATION',
        photoUrls: ['https://storage.cambiazo.ar/items/pencil-case.jpg'],
      });

      expect(item.moderationStatus).toBe('PENDING');
      expect(item.studentUserId).toBe(studentA1.id);
      expect(item.institutionId).toBe(schoolA);
    });

    it('hides PENDING items from other students in the same school', async () => {
      const item = await communityService.createItem(studentA1.id, schoolA, {
        title: 'Compás de Precisión',
        description: 'Compás metálico con repuesto de minas',
        category: 'STATIONERY',
        mode: 'BARTER',
        photoUrls: [],
      });

      // Student A2 lists items
      const listA2 = await communityService.listItems(studentA2);
      expect(listA2.some((it) => it.id === item.id)).toBe(false);

      // Student A2 directly requests item by ID
      await expect(
        communityService.getItemById(studentA2, item.id),
      ).rejects.toThrow(ItemNotApprovedException);
    });

    it('allows publishing student to see their own PENDING items', async () => {
      const item = await communityService.createItem(studentA1.id, schoolA, {
        title: 'Set de Escuadras',
        description: 'Escuadra de 45 y 60 grados',
        category: 'STATIONERY',
        mode: 'LOAN',
        photoUrls: [],
      });

      const listA1 = await communityService.listItems(studentA1);
      expect(listA1.some((it) => it.id === item.id)).toBe(true);

      const fetched = await communityService.getItemById(studentA1, item.id);
      expect(fetched.id).toBe(item.id);
    });

    it('allows School Admin to see all items regardless of moderation status', async () => {
      const itemPending = await communityService.createItem(studentA1.id, schoolA, {
        title: 'Libro de Geografía',
        description: 'Geografía de América Latina',
        category: 'STATIONERY',
        mode: 'DONATION',
        photoUrls: [],
      });

      const adminList = await communityService.listItems(adminA);
      expect(adminList.some((it) => it.id === itemPending.id)).toBe(true);
    });

    it('makes item visible to other students once APPROVED by School Admin', async () => {
      const item = await communityService.createItem(studentA1.id, schoolA, {
        title: 'Calculadora Científica Casio',
        description: 'Calculadora científica en perfecto funcionamiento',
        category: 'STATIONERY',
        mode: 'BARTER',
        photoUrls: [],
      });

      // Moderator approves publication
      await communityService.moderateItem(adminA.id, schoolA, item.id, {
        itemId: item.id,
        status: 'APPROVED',
        moderatorNotes: 'Aprobado para trueque escolar',
        awardedPoints: 0,
      });

      const listA2 = await communityService.listItems(studentA2);
      expect(listA2.some((it) => it.id === item.id)).toBe(true);

      const fetchedA2 = await communityService.getItemById(studentA2, item.id);
      expect(fetchedA2.moderationStatus).toBe('APPROVED');
    });

    it('hides REJECTED items from other students', async () => {
      const item = await communityService.createItem(studentA1.id, schoolA, {
        title: 'Juguete no escolar',
        description: 'No cumple con las pautas de útiles escolares',
        category: 'STATIONERY',
        mode: 'DONATION',
        photoUrls: [],
      });

      await communityService.moderateItem(adminA.id, schoolA, item.id, {
        itemId: item.id,
        status: 'REJECTED',
        moderatorNotes: 'No es un útil escolar',
        awardedPoints: 0,
      });

      const listA2 = await communityService.listItems(studentA2);
      expect(listA2.some((it) => it.id === item.id)).toBe(false);

      await expect(
        communityService.getItemById(studentA2, item.id),
      ).rejects.toThrow(ItemNotApprovedException);
    });
  });

  describe('3. Points Award Timing & Redemptions', () => {
    it('does NOT award points when item is APPROVED or REJECTED', async () => {
      const item = await communityService.createItem(studentA1.id, schoolA, {
        title: 'Carpeta A4 3 Anillos',
        description: 'Carpeta con ganchos metálicos',
        category: 'STATIONERY',
        mode: 'DONATION',
        photoUrls: [],
      });

      await communityService.moderateItem(adminA.id, schoolA, item.id, {
        itemId: item.id,
        status: 'APPROVED',
        awardedPoints: 50,
      });

      const balance = await pointsRepo.getStudentBalance(studentA1.id, schoolA);
      expect(balance).toBe(0);
    });

    it('awards community points ONLY when status reaches DELIVERED (pickup desk confirmation)', async () => {
      const item = await communityService.createItem(studentA1.id, schoolA, {
        title: 'Caja de 24 Marcadores Faber-Castell',
        description: 'Marcadores al agua para plástica',
        category: 'STATIONERY',
        mode: 'DONATION',
        photoUrls: [],
      });

      // 1. Moderate to APPROVED -> 0 points
      await communityService.moderateItem(adminA.id, schoolA, item.id, {
        itemId: item.id,
        status: 'APPROVED',
        awardedPoints: 50,
      });
      expect(await pointsRepo.getStudentBalance(studentA1.id, schoolA)).toBe(0);

      // 2. Physical delivery confirmed at school desk -> DELIVERED
      const deliveredItem = await communityService.moderateItem(adminA.id, schoolA, item.id, {
        itemId: item.id,
        status: 'DELIVERED',
        moderatorNotes: 'Recepción confirmada en mesa de entrada de la escuela',
        awardedPoints: 60,
      });

      expect(deliveredItem.moderationStatus).toBe('DELIVERED');
      expect(deliveredItem.awardedPoints).toBe(60);

      const balance = await pointsRepo.getStudentBalance(studentA1.id, schoolA);
      expect(balance).toBe(60);
    });

    it('does not award duplicate points if DELIVERED is called repeatedly', async () => {
      const item = await communityService.createItem(studentA1.id, schoolA, {
        title: 'Lapicera Pluma Parker',
        description: 'Pluma fuente escolar',
        category: 'STATIONERY',
        mode: 'BARTER',
        photoUrls: [],
      });

      await communityService.moderateItem(adminA.id, schoolA, item.id, {
        itemId: item.id,
        status: 'DELIVERED',
        awardedPoints: 40,
      });

      expect(await pointsRepo.getStudentBalance(studentA1.id, schoolA)).toBe(40);

      // Second DELIVERED call
      await communityService.moderateItem(adminA.id, schoolA, item.id, {
        itemId: item.id,
        status: 'DELIVERED',
        awardedPoints: 40,
      });

      // Balance remains 40 (no duplicate award)
      expect(await pointsRepo.getStudentBalance(studentA1.id, schoolA)).toBe(40);
    });

    it('allows student to redeem points for school rewards and decrements stock', async () => {
      // Award 150 points to student A1
      await pointsRepo.save({
        id: 'pts-1',
        institutionId: schoolA,
        studentUserId: studentA1.id,
        pointsDelta: 150,
        reason: 'EXCHANGE_DELIVERED',
        createdAt: new Date(),
      });

      // Create school reward
      const reward = await communityService.createReward(schoolA, {
        title: 'Insignia Guardián del Reciclaje',
        description: 'Reconocimiento escolar',
        pointsCost: 75,
        stock: 5,
        isActive: true,
      });

      const redemption = await communityService.redeemReward(studentA1.id, schoolA, {
        rewardId: reward.id,
        studentId: studentA1.id,
      });

      expect(redemption.status).toBe('PENDING_PICKUP');
      expect(redemption.pointsCost).toBe(75);

      // Student points balance is now 150 - 75 = 75
      const remainingPoints = await pointsRepo.getStudentBalance(studentA1.id, schoolA);
      expect(remainingPoints).toBe(75);

      // Reward stock is decremented
      const updatedReward = await rewardRepo.findById(reward.id);
      expect(updatedReward?.stock).toBe(4);
    });

    it('rejects reward redemption if student has insufficient community points', async () => {
      const reward = await communityService.createReward(schoolA, {
        title: 'Cuaderno Universitario ABC',
        description: 'Cuaderno tapa dura 100 hojas',
        pointsCost: 100,
        isActive: true,
      });

      // Student has 0 points
      await expect(
        communityService.redeemReward(studentA1.id, schoolA, {
          rewardId: reward.id,
          studentId: studentA1.id,
        }),
      ).rejects.toThrow(InsufficientCommunityPointsException);
    });

    it('rejects reward redemption if reward is out of stock', async () => {
      await pointsRepo.save({
        id: 'pts-high',
        institutionId: schoolA,
        studentUserId: studentA1.id,
        pointsDelta: 500,
        reason: 'EXCHANGE_DELIVERED',
        createdAt: new Date(),
      });

      const reward = await communityService.createReward(schoolA, {
        title: 'Set Geometría Exclusivo',
        description: 'Edición limitada',
        pointsCost: 50,
        stock: 0,
        isActive: true,
      });

      await expect(
        communityService.redeemReward(studentA1.id, schoolA, {
          rewardId: reward.id,
          studentId: studentA1.id,
        }),
      ).rejects.toThrow(InsufficientStockException);
    });
  });

  describe('4. Strict Economy Separation (Prohibited Conversions)', () => {
    it('strictly prohibits converting community points into money or kiosk credit', () => {
      expect(() => {
        communityService.attemptConvertPointsToMoney();
      }).toThrow(ProhibitedCommunityConversionException);
    });

    it('strictly prohibits converting money into community points', () => {
      expect(() => {
        communityService.attemptConvertMoneyToPoints();
      }).toThrow(ProhibitedCommunityConversionException);
    });
  });

  describe('5. School Leaderboard Ranking & Badges', () => {
    it('returns ranked students with aliases and badges according to points', async () => {
      await pointsRepo.save({
        id: 'p-1',
        institutionId: schoolA,
        studentUserId: studentA1.id,
        pointsDelta: 320,
        reason: 'EXCHANGE_DELIVERED',
        createdAt: new Date(),
      });

      await pointsRepo.save({
        id: 'p-2',
        institutionId: schoolA,
        studentUserId: studentA2.id,
        pointsDelta: 80,
        reason: 'EXCHANGE_DELIVERED',
        createdAt: new Date(),
      });

      const leaderboard = await communityService.getLeaderboard(schoolA);
      expect(leaderboard).toHaveLength(2);

      // Rank 1: Mateo Rossi (320 pts)
      expect(leaderboard[0]?.rank).toBe(1);
      expect(leaderboard[0]?.studentId).toBe(studentA1.id);
      expect(leaderboard[0]?.studentAlias).toBe('Mateo R.');
      expect(leaderboard[0]?.accumulatedPoints).toBe(320);
      expect(leaderboard[0]?.badges).toEqual([
        'SOLIDARIO_INICIAL',
        'GUARDIAN_DEL_RECICLAJE',
        'SOLIDARIO_ORO',
      ]);

      // Rank 2: Lucia Gomez (80 pts)
      expect(leaderboard[1]?.rank).toBe(2);
      expect(leaderboard[1]?.studentId).toBe(studentA2.id);
      expect(leaderboard[1]?.studentAlias).toBe('Lucia G.');
      expect(leaderboard[1]?.accumulatedPoints).toBe(80);
      expect(leaderboard[1]?.badges).toEqual(['SOLIDARIO_INICIAL']);
    });
  });
});
