import {
  Controller,
  Post,
  Body,
  UsePipes,
} from '@nestjs/common';
import {
  MercadoPagoWebhookPayloadSchema,
  type MercadoPagoWebhookPayloadDto,
} from '@cambiazo/shared';
import { Public } from '../../../../common/auth/public.decorator.js';
import { ZodValidationPipe } from '../../../../common/pipes/zod-validation.pipe.js';
import {
  HandleMpTopupWebhookUseCase,
  type WebhookProcessingResult,
} from '../../application/use-cases/handle-mp-topup-webhook.use-case.js';

@Controller('api/v1/webhooks')
export class WebhooksController {
  constructor(
    private readonly handleMpTopupWebhookUseCase: HandleMpTopupWebhookUseCase,
  ) {}

  @Public()
  @Post('mercadopago')
  @UsePipes(new ZodValidationPipe(MercadoPagoWebhookPayloadSchema))
  async handleMercadoPagoWebhook(
    @Body() payload: MercadoPagoWebhookPayloadDto,
  ): Promise<WebhookProcessingResult> {
    return this.handleMpTopupWebhookUseCase.execute(payload);
  }
}
