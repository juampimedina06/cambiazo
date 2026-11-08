import {
  type ExceptionFilter,
  Catch,
  type ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import type { Response } from 'express';
import { DomainException } from '../errors/domain.exception.js';

@Catch()
export class DomainExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let error = 'Internal Server Error';
    let code: string | undefined = undefined;
    let message = 'An unexpected error occurred';
    let details: unknown = undefined;

    if (exception instanceof DomainException) {
      status = exception.getStatus();
      const res = exception.getResponse() as Record<string, unknown>;
      code = exception.code;
      error = exception.code;
      message = (res['message'] as string) || exception.message;
      details = exception.details;
    } else if (exception instanceof HttpException) {
      status = exception.getStatus();
      const res = exception.getResponse();
      if (typeof res === 'string') {
        message = res;
        error = exception.name;
      } else if (typeof res === 'object' && res !== null) {
        const obj = res as Record<string, unknown>;
        message = (obj['message'] as string) || exception.message;
        error = (obj['error'] as string) || exception.name;
        code = (obj['code'] as string) || undefined;
        details = obj['details'];
      }
    } else if (exception instanceof Error) {
      message = exception.message;
    }

    response.status(status).json({
      statusCode: status,
      error,
      code: code || error,
      message,
      details,
      timestamp: new Date().toISOString(),
    });
  }
}
