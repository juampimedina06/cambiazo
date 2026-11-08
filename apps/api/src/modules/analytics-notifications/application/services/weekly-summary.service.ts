import { Inject, Injectable } from '@nestjs/common';
import {
  PRODUCT_CATEGORIES,
  WeeklyParentSummaryDtoSchema,
  type WeeklyParentSummaryDto,
  type CategorySpendingBreakdownDto,
  type WeeklyPurchaseItemDto,
  type ProductCategory,
} from '@cambiazo/shared';
import {
  TenantMismatchException,
  UnauthorizedRoleException,
} from '../../../../common/errors/domain.exception.js';
import {
  type BlockedPurchaseRepositoryPort,
  BLOCKED_PURCHASE_REPOSITORY,
} from '../../domain/ports/blocked-purchase.repository.port.js';
import {
  type LedgerRepositoryPort,
  LEDGER_REPOSITORY,
} from '../../../wallet-ledger/domain/ports/ledger.repository.port.js';
import {
  type CommunityPointsRepositoryPort,
  COMMUNITY_POINTS_REPOSITORY,
} from '../../../community-exchange/domain/ports/community-points.repository.port.js';
import {
  type ParentStudentLinkRepositoryPort,
  PARENT_STUDENT_LINK_REPOSITORY,
} from '../../../identity-parental/domain/ports/parent-student-link.repository.port.js';

@Injectable()
export class WeeklySummaryService {
  constructor(
    @Inject(BLOCKED_PURCHASE_REPOSITORY)
    private readonly blockedPurchaseRepo: BlockedPurchaseRepositoryPort,
    @Inject(LEDGER_REPOSITORY)
    private readonly ledgerRepo: LedgerRepositoryPort,
    @Inject(COMMUNITY_POINTS_REPOSITORY)
    private readonly pointsRepo: CommunityPointsRepositoryPort,
    @Inject(PARENT_STUDENT_LINK_REPOSITORY)
    private readonly linkRepo: ParentStudentLinkRepositoryPort,
  ) {}

  async getWeeklySummary(
    parentId: string,
    parentInstitutionId: string,
    studentId: string,
  ): Promise<WeeklyParentSummaryDto> {
    // 1. Verify parent-student authorization
    const link = await this.linkRepo.findLink(
      parentInstitutionId,
      parentId,
      studentId,
    );
    if (!link) {
      throw new UnauthorizedRoleException('Parent is not linked to this student in this institution');
    }

    // 2. Define 7-day rolling window
    const now = new Date();
    const cutoffDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const endDate = now.toISOString().split('T')[0] || '';
    const startDate = cutoffDate.toISOString().split('T')[0] || '';


    // 3. Resolve student allocation account
    const studentAccount = await this.ledgerRepo.getOrCreateAccount({
      userId: studentId,
      type: 'STUDENT_ALLOCATION',
      institutionId: parentInstitutionId,
    });

    // 4. Retrieve debit entries within the 7-day window
    const entries = await this.ledgerRepo.getEntriesByAccountId(studentAccount.id, {
      from: cutoffDate,
    });

    let totalSpentCents = 0;
    const categoryTotals = new Map<ProductCategory, number>();
    for (const cat of PRODUCT_CATEGORIES) {
      categoryTotals.set(cat, 0);
    }

    const recentPurchases: WeeklyPurchaseItemDto[] = [];

    for (const entry of entries) {
      if (entry.direction === 'DEBIT') {
        const tx = await this.ledgerRepo.findTransactionById(entry.transactionId);
        if (tx && tx.referenceType === 'KIOSK_PURCHASE') {
          totalSpentCents += entry.amountCents;

          // Parse purchased items from metadata if available
          const rawItems = (tx.metadata?.items as any[]) || [];
          if (Array.isArray(rawItems) && rawItems.length > 0) {
            for (const item of rawItems) {
              const cat = item.category as ProductCategory;
              const itemTotal = item.subtotalCents || (item.quantity * item.priceCents) || entry.amountCents;

              if (categoryTotals.has(cat)) {
                categoryTotals.set(cat, (categoryTotals.get(cat) || 0) + itemTotal);
              }

              recentPurchases.push({
                id: item.productId || tx.id,
                productName: item.name || item.productName || 'Producto de Kiosco',
                category: cat,
                amountCents: itemTotal,
                purchasedAt: entry.createdAt.toISOString(),
              });
            }
          } else {
            // Default to HEALTHY_SNACK if no metadata items breakdown
            const defaultCat: ProductCategory = 'HEALTHY_SNACK';
            categoryTotals.set(
              defaultCat,
              (categoryTotals.get(defaultCat) || 0) + entry.amountCents,
            );
            recentPurchases.push({
              id: tx.id,
              productName: tx.description || 'Compra en Kiosco',
              category: defaultCat,
              amountCents: entry.amountCents,
              purchasedAt: entry.createdAt.toISOString(),
            });
          }
        }
      }
    }

    // 5. Build category breakdown
    const breakdownByCategory: CategorySpendingBreakdownDto[] = [];
    for (const cat of PRODUCT_CATEGORIES) {
      const amountCents = categoryTotals.get(cat) || 0;
      const percentage =
        totalSpentCents > 0
          ? Number(((amountCents / totalSpentCents) * 100).toFixed(2))
          : 0;

      if (amountCents > 0 || totalSpentCents === 0) {
        breakdownByCategory.push({
          category: cat,
          amountCents,
          percentage,
        });
      }
    }

    // Sort by amount descending
    breakdownByCategory.sort((a, b) => b.amountCents - a.amountCents);

    // 6. Retrieve blocked purchase attempts count
    const blockedAttemptsCount = await this.blockedPurchaseRepo.countAttempts(
      studentId,
      cutoffDate,
    );

    // 7. Retrieve community points earned within the 7-day window
    const communityPointsEarned = await this.pointsRepo.getPointsEarnedSince(
      studentId,
      cutoffDate,
    );

    const summary: WeeklyParentSummaryDto = {
      studentId,
      startDate,
      endDate,
      totalSpentCents,
      breakdownByCategory,
      recentPurchases,
      communityPointsEarned,
      blockedAttemptsCount,
    };

    return WeeklyParentSummaryDtoSchema.parse(summary);
  }
}
