import {
  type PipeTransform,
  Injectable,
  type ArgumentMetadata,
  BadRequestException,
} from '@nestjs/common';
import type { ZodSchema } from 'zod';

@Injectable()
export class ZodValidationPipe implements PipeTransform {
  constructor(private readonly schema?: ZodSchema) {}

  transform(value: unknown, _metadata: ArgumentMetadata): unknown {
    if (!this.schema) {
      return value;
    }

    const result = this.schema.safeParse(value);
    if (!result.success) {
      const formattedErrors = result.error.errors.map((err) => ({
        path: err.path.join('.'),
        message: err.message,
        code: err.code,
      }));

      throw new BadRequestException({
        statusCode: 400,
        error: 'Bad Request',
        message: 'Validation failed',
        details: formattedErrors,
      });
    }

    return result.data;
  }
}
