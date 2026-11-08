import { Inject, Injectable, HttpStatus } from '@nestjs/common';
import { DOMAIN_ERROR_CODES, type UserRole } from '@cambiazo/shared';
import {
  DomainException,
  UnauthorizedRoleException,
} from '../../../../common/errors/domain.exception.js';
import {
  type ParentStudentLinkRepositoryPort,
  PARENT_STUDENT_LINK_REPOSITORY,
} from '../../../identity-parental/domain/ports/parent-student-link.repository.port.js';
import { LedgerService } from '../services/ledger.service.js';

export interface WalletBalanceResult {
  accountId: string;
  balanceCents: number;
  formattedBalance: string;
  currency: 'ARS';
}

@Injectable()
export class GetWalletBalanceUseCase {
  constructor(
    private readonly ledgerService: LedgerService,
    @Inject(PARENT_STUDENT_LINK_REPOSITORY)
    private readonly linkRepo: ParentStudentLinkRepositoryPort,
  ) {}

  async getStudentBalance(
    requestingUserId: string,
    role: UserRole,
    studentId: string,
    institutionId: string,
  ): Promise<WalletBalanceResult> {
    if (role === 'PARENT') {
      const link = await this.linkRepo.findLink(
        institutionId,
        requestingUserId,
        studentId,
      );
      if (!link) {
        throw new DomainException(
          DOMAIN_ERROR_CODES.STUDENT_NOT_LINKED_TO_PARENT,
          'Parent is not linked to this student',
          HttpStatus.FORBIDDEN,
        );
      }
    } else if (role === 'STUDENT') {
      if (requestingUserId !== studentId) {
        throw new UnauthorizedRoleException('Students can only check their own wallet balance');
      }
    }

    const account = await this.ledgerService.getStudentAccount(
      studentId,
      institutionId,
    );

    return {
      accountId: account.id,
      balanceCents: account.balanceCents,
      formattedBalance: `$${(account.balanceCents / 100).toFixed(2)}`,
      currency: 'ARS',
    };
  }

  async getKioskBalance(
    kioskUserId: string,
    institutionId: string,
  ): Promise<WalletBalanceResult> {
    const account = await this.ledgerService.getKioskAccount(
      kioskUserId,
      institutionId,
    );

    return {
      accountId: account.id,
      balanceCents: account.balanceCents,
      formattedBalance: `$${(account.balanceCents / 100).toFixed(2)}`,
      currency: 'ARS',
    };
  }
}
