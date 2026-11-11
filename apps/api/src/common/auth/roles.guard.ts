import {
  Injectable,
  Inject,
  CanActivate,
  type ExecutionContext,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { UserRole } from '@cambiazo/shared';
import { ROLES_KEY } from './roles.decorator.js';
import { IS_PUBLIC_KEY } from './public.decorator.js';
import { UnauthorizedRoleException } from '../errors/domain.exception.js';
import type { AuthUser } from './auth-user.interface.js';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(@Inject(Reflector) private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user as AuthUser | undefined;

    if (!user) {
      throw new UnauthorizedRoleException('No user attached to request');
    }

    const hasRole = requiredRoles.includes(user.role);
    if (!hasRole) {
      throw new UnauthorizedRoleException(
        `Role ${user.role} is not authorized. Required: ${requiredRoles.join(', ')}`,
      );
    }

    return true;
  }
}
