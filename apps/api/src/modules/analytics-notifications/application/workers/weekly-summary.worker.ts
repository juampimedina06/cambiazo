import { Injectable, Logger } from '@nestjs/common';
import { WeeklySummaryService } from '../services/weekly-summary.service.js';
import type { WeeklyParentSummaryDto } from '@cambiazo/shared';

@Injectable()
export class WeeklySummaryWorker {
  private readonly logger = new Logger(WeeklySummaryWorker.name);

  constructor(private readonly summaryService: WeeklySummaryService) {}

  async processStudentWeeklySummary(
    parentId: string,
    institutionId: string,
    studentId: string,
  ): Promise<WeeklyParentSummaryDto> {
    this.logger.log(`Processing weekly summary for student ${studentId} (parent ${parentId})`);
    return this.summaryService.getWeeklySummary(parentId, institutionId, studentId);
  }
}
