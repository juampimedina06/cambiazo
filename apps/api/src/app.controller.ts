import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service.js';
import { Public } from './common/auth/public.decorator.js';

@Controller('health')
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  @Public()
  getHealth(): { status: string; service: string; currency: string } {
    return this.appService.getHealth();
  }
}
