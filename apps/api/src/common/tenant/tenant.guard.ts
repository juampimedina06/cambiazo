import {
  Injectable,
  Inject,
  CanActivate,
  type ExecutionContext,
  createParamDecorator,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from '../auth/public.decorator.js';
import type { AuthUser } from '../auth/auth-user.interface.js';
import { TenantMismatchException, UnauthorizedRoleException } from '../errors/domain.exception.js';

export const TenantId = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): string | undefined => {
    const request = ctx.switchToHttp().getRequest();
    return request.tenantId || request.user?.institutionId;
  },
);

@Injectable()
export class TenantGuard implements CanActivate {
  constructor(@Inject(Reflector) private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user as AuthUser | undefined;

    if (!user) {
      return true;
    }

    // SUPER_ADMIN has global scope
    if (user.role === 'SUPER_ADMIN') {
      const explicitTenant =
        request.params?.institutionId ||
        request.query?.institutionId ||
        request.body?.institutionId ||
        (request.headers?.['x-target-institution-id'] as string) ||
        user.institutionId ||
        null;
      request.tenantId = explicitTenant;
      return true;
    }

    // For all other roles, institutionId is strictly required
    if (!user.institutionId) {
      throw new UnauthorizedRoleException('User is not associated with any institution');
    }

    const targetTenantId =
      request.params?.institutionId ||
      request.query?.institutionId ||
      request.body?.institutionId ||
      (request.headers?.['x-target-institution-id'] as string);

    if (targetTenantId && targetTenantId !== user.institutionId) {
      throw new TenantMismatchException(
        `User from institution ${user.institutionId} cannot access institution ${targetTenantId}`,
      );
    }

    request.tenantId = user.institutionId;
    return true;
  }
}
