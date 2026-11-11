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

  transform(value: unknown, metadata: ArgumentMetadata): unknown {
    if (!this.schema) {
      return value;
    }

    // Method-level @UsePipes applies to every handler parameter (@CurrentUser, @Param, @Query, @Body).
    // Skip non-body parameters so auth/route decorators are not validated against body DTO schemas.
    if (metadata?.type && metadata.type !== 'body') {
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
