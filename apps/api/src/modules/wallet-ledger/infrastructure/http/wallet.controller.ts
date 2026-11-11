import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Inject,
  UsePipes,
} from '@nestjs/common';
import {
  TopUpPreferenceRequestSchema,
  VerifyTopUpRequestSchema,
  type TopUpPreferenceRequestDto,
  type VerifyTopUpRequestDto,
} from '@cambiazo/shared';
import { Roles } from '../../../../common/auth/roles.decorator.js';
import { CurrentUser } from '../../../../common/auth/current-user.decorator.js';
import type { AuthUser } from '../../../../common/auth/auth-user.interface.js';
import { TenantId } from '../../../../common/tenant/tenant.guard.js';
import { ZodValidationPipe } from '../../../../common/pipes/zod-validation.pipe.js';
import { CreateTopUpPreferenceUseCase } from '../../application/use-cases/create-top-up-preference.use-case.js';
import {
  VerifyTopUpUseCase,
  type VerifyTopUpResult,
} from '../../application/use-cases/verify-top-up.use-case.js';
import {
  GetWalletBalanceUseCase,
  type WalletBalanceResult,
  type WalletTransactionItem,
} from '../../application/use-cases/get-wallet-balance.use-case.js';
import type { PreferenceResult } from '../../domain/ports/payment-gateway.port.js';

@Controller('api/v1/wallet')
export class WalletController {
  constructor(
    @Inject(CreateTopUpPreferenceUseCase)
    private readonly createTopUpPreferenceUseCase: CreateTopUpPreferenceUseCase,
    @Inject(VerifyTopUpUseCase)
    private readonly verifyTopUpUseCase: VerifyTopUpUseCase,
    @Inject(GetWalletBalanceUseCase)
    private readonly getWalletBalanceUseCase: GetWalletBalanceUseCase,
  ) {}

  @Post('top-up-preference')
  @Roles('PARENT')
  @UsePipes(new ZodValidationPipe(TopUpPreferenceRequestSchema))
  async createTopUpPreference(
    @Body() body: TopUpPreferenceRequestDto,
    @CurrentUser() parentUser: AuthUser,
    @TenantId() institutionId: string,
  ): Promise<PreferenceResult> {
    return this.createTopUpPreferenceUseCase.execute(
      parentUser.id,
      institutionId,
      body,
      parentUser.email,
    );
  }

  @Post('verify-top-up')
  @Roles('PARENT')
  @UsePipes(new ZodValidationPipe(VerifyTopUpRequestSchema))
  async verifyTopUp(
    @Body() body: VerifyTopUpRequestDto,
    @CurrentUser() parentUser: AuthUser,
    @TenantId() institutionId: string,
  ): Promise<VerifyTopUpResult> {
    return this.verifyTopUpUseCase.execute(
      parentUser.id,
      institutionId,
      body,
    );
  }

  @Get('balance/:studentId')
  @Roles('PARENT', 'STUDENT', 'SCHOOL_ADMIN', 'SUPER_ADMIN')
  async getStudentBalance(
    @Param('studentId') studentId: string,
    @CurrentUser() user: AuthUser,
    @TenantId() institutionId: string,
  ): Promise<WalletBalanceResult> {
    return this.getWalletBalanceUseCase.getStudentBalance(
      user.id,
      user.role,
      studentId,
      institutionId,
    );
  }

  @Get('transactions/:studentId')
  @Roles('PARENT', 'STUDENT', 'SCHOOL_ADMIN', 'SUPER_ADMIN')
  async getStudentTransactions(
    @Param('studentId') studentId: string,
    @CurrentUser() user: AuthUser,
    @TenantId() institutionId: string,
  ): Promise<WalletTransactionItem[]> {
    return this.getWalletBalanceUseCase.getStudentTransactions(
      user.id,
      user.role,
      studentId,
      institutionId,
    );
  }
}
