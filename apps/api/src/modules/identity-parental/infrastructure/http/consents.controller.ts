import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Req,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import type { Request } from 'express';
import {
  GrantParentalConsentSchema,
  RevokeParentalConsentSchema,
  type GrantParentalConsentDto,
  type RevokeParentalConsentDto,
} from '@cambiazo/shared';
import { Roles } from '../../../../common/auth/roles.decorator.js';
import { AuthGuard } from '../../../../common/auth/auth.guard.js';
import { RolesGuard } from '../../../../common/auth/roles.guard.js';
import { TenantGuard } from '../../../../common/tenant/tenant.guard.js';
import { CurrentUser } from '../../../../common/auth/current-user.decorator.js';
import type { AuthUser } from '../../../../common/auth/auth-user.interface.js';
import { ZodValidationPipe } from '../../../../common/pipes/zod-validation.pipe.js';
import { GrantParentalConsentUseCase } from '../../application/use-cases/grant-parental-consent.use-case.js';
import { RevokeParentalConsentUseCase } from '../../application/use-cases/revoke-parental-consent.use-case.js';
import { CheckStudentConsentUseCase } from '../../application/use-cases/check-student-consent.use-case.js';
import { GetParentalConsentAuditUseCase } from '../../application/use-cases/get-parental-consent-audit.use-case.js';

@Controller('api/v1/consents')
@UseGuards(AuthGuard, RolesGuard, TenantGuard)
export class ConsentsController {
  constructor(
    private readonly grantParentalConsentUseCase: GrantParentalConsentUseCase,
    private readonly revokeParentalConsentUseCase: RevokeParentalConsentUseCase,
    private readonly checkStudentConsentUseCase: CheckStudentConsentUseCase,
    private readonly getParentalConsentAuditUseCase: GetParentalConsentAuditUseCase,
  ) {}

  @Post('grant')
  @HttpCode(HttpStatus.OK)
  @Roles('PARENT')
  async grantConsent(
    @Body(new ZodValidationPipe(GrantParentalConsentSchema))
    dto: GrantParentalConsentDto,
    @CurrentUser() user: AuthUser,
    @Req() req: Request,
  ) {
    const ip = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1';
    const userAgent = req.headers['user-agent'] || 'Unknown Client';
    return this.grantParentalConsentUseCase.execute(user, dto, ip, userAgent);
  }

  @Post('revoke')
  @HttpCode(HttpStatus.OK)
  @Roles('PARENT')
  async revokeConsent(
    @Body(new ZodValidationPipe(RevokeParentalConsentSchema))
    dto: RevokeParentalConsentDto,
    @CurrentUser() user: AuthUser,
    @Req() req: Request,
  ) {
    const ip = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1';
    const userAgent = req.headers['user-agent'] || 'Unknown Client';
    return this.revokeParentalConsentUseCase.execute(user, dto, ip, userAgent);
  }

  @Get('status/:studentId')
  async checkStatus(
    @Param('studentId') studentId: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.checkStudentConsentUseCase.execute(
      studentId,
      user.role === 'SUPER_ADMIN' ? null : user.institutionId,
    );
  }

  @Get('audit/all')
  @Roles('SCHOOL_ADMIN', 'SUPER_ADMIN')
  async getAllRoster(@CurrentUser() user: AuthUser) {
    return [
      {
        id: '22222222-2222-4222-8222-222222222222',
        institutionId: user.institutionId || 'e28bb18a-66fe-4f8e-9092-2df283f55001',
        fullName: 'Mateo Gómez',
        dni: '52345678',
        grade: '6° Primaria',
        parentName: 'Carolina Gómez',
        parentEmail: 'carolina.gomez@ejemplo.com',
        consentStatus: 'GRANTED',
        consentUpdatedAt: new Date().toISOString(),
        isActive: true,
      },
    ];
  }

  @Get('audit/:studentId')
  async getAudit(
    @Param('studentId') studentId: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.getParentalConsentAuditUseCase.execute(studentId, user);
  }
}
