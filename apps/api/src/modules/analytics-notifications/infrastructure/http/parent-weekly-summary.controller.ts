import { Controller, Get, Param, Inject } from '@nestjs/common';
import type { WeeklyParentSummaryDto } from '@cambiazo/shared';
import { CurrentUser } from '../../../../common/auth/current-user.decorator.js';
import type { AuthUser } from '../../../../common/auth/auth-user.interface.js';
import { Roles } from '../../../../common/auth/roles.decorator.js';
import { WeeklySummaryService } from '../../application/services/weekly-summary.service.js';

@Controller('api/v1/parents')
export class ParentWeeklySummaryController {
  constructor(
    @Inject(WeeklySummaryService)
    private readonly summaryService: WeeklySummaryService,
  ) {}

  @Get('children/:studentId/weekly-summary')
  @Roles('PARENT')
  async getWeeklySummary(
    @CurrentUser() user: AuthUser,
    @Param('studentId') studentId: string,
  ): Promise<WeeklyParentSummaryDto> {
    return this.summaryService.getWeeklySummary(user.id, user.institutionId!, studentId);
  }
}
