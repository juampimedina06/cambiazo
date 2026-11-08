import { createParamDecorator, type ExecutionContext } from '@nestjs/common';
import type { AuthUser } from './auth-user.interface.js';

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): AuthUser | undefined => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  },
);
