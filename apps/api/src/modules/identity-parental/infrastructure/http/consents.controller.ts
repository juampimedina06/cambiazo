import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Query,
  Req,
  Inject,
  Optional,
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
import {
  type UserRepositoryPort,
  USER_REPOSITORY,
} from '../../domain/ports/user.repository.port.js';
import {
  type ParentStudentLinkRepositoryPort,
  PARENT_STUDENT_LINK_REPOSITORY,
} from '../../domain/ports/parent-student-link.repository.port.js';
import {
  type ParentalConsentRepositoryPort,
  PARENTAL_CONSENT_REPOSITORY,
} from '../../domain/ports/parental-consent.repository.port.js';

@Controller('api/v1/consents')
@UseGuards(AuthGuard, RolesGuard, TenantGuard)
export class ConsentsController {
  constructor(
    @Inject(GrantParentalConsentUseCase)
    private readonly grantParentalConsentUseCase: GrantParentalConsentUseCase,
    @Inject(RevokeParentalConsentUseCase)
    private readonly revokeParentalConsentUseCase: RevokeParentalConsentUseCase,
    @Inject(CheckStudentConsentUseCase)
    private readonly checkStudentConsentUseCase: CheckStudentConsentUseCase,
    @Inject(GetParentalConsentAuditUseCase)
    private readonly getParentalConsentAuditUseCase: GetParentalConsentAuditUseCase,
    @Inject(USER_REPOSITORY)
    @Optional()
    private readonly userRepo?: UserRepositoryPort,
    @Inject(PARENT_STUDENT_LINK_REPOSITORY)
    @Optional()
    private readonly linkRepo?: ParentStudentLinkRepositoryPort,
    @Inject(PARENTAL_CONSENT_REPOSITORY)
    @Optional()
    private readonly consentRepo?: ParentalConsentRepositoryPort,
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
  async getAllRoster(
    @CurrentUser() user: AuthUser,
    @Query('institutionId') queryInstitutionId?: string,
  ) {
    const instId = user.institutionId || queryInstitutionId || 'e28bb18a-66fe-4f8e-9092-2df283f55001';
    const { userRepo, linkRepo, consentRepo } = this;
    if (!userRepo || !linkRepo || !consentRepo) {
      return [];
    }
    const users = await userRepo.findAllByInstitution(instId);
    const students = users.filter((u) => u.role === 'STUDENT');
    const parents = new Map(users.filter((u) => u.role === 'PARENT').map((p) => [p.id, p]));

    const roster = await Promise.all(
      students.map(async (s) => {
        const link = await linkRepo.findByStudentId(s.id);
        const parent = link ? parents.get(link.parentUserId) : undefined;
        const consent = await consentRepo.getLatestConsent(s.id);

        return {
          id: `rost-${s.id}`,
          studentId: s.id,
          institutionId: instId,
          studentName: s.fullName,
          studentDni: s.dni || '',
          grade: s.grade || 'Sin curso',
          parentName: parent?.fullName || 'Tutor',
          parentEmail: parent?.email || '',
          parentPhone: parent?.phone || '',
          consentStatus: consent ? consent.action : (s.isActive ? 'GRANTED' : 'PENDING'),
          consentAudit: consent
            ? {
                acceptedTermsVersion: consent.termsVersion,
                signedAt: consent.createdAt.toISOString(),
                signatureIp: consent.ipAddress,
              }
            : {},
          walletBalanceCents: 450000,
          communityPoints: 120,
          createdAt: s.createdAt.toISOString(),
        };
      })
    );

    return roster;
  }

  @Get('audit/:studentId')
  async getAudit(
    @Param('studentId') studentId: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.getParentalConsentAuditUseCase.execute(studentId, user);
  }
}
