import {
  Injectable,
  CanActivate,
  type ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { UserRole } from '@cambiazo/shared';
import { IS_PUBLIC_KEY } from './public.decorator.js';
import type { AuthUser } from './auth-user.interface.js';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    const request = context.switchToHttp().getRequest();

    // If request already has user attached (e.g. from tests or prior middleware)
    if (request.user) {
      return true;
    }

    const authHeader = request.headers['authorization'];
    const headerUserId = request.headers['x-user-id'] as string | undefined;

    let user: AuthUser | null = null;

    if (authHeader && typeof authHeader === 'string' && authHeader.startsWith('Bearer ')) {
      const token = authHeader.slice(7).trim();
      user = this.parseToken(token);
    } else if (headerUserId) {
      const role = (request.headers['x-user-role'] as UserRole) || 'STUDENT';
      const institutionId = (request.headers['x-institution-id'] as string) || null;
      const email = (request.headers['x-user-email'] as string) || `${headerUserId}@cambiazo.internal`;
      const fullName = (request.headers['x-user-name'] as string) || 'Test User';

      user = {
        id: headerUserId,
        email,
        role,
        institutionId,
        fullName,
      };
    }

    if (user) {
      request.user = user;
      return true;
    }

    if (isPublic) {
      return true;
    }

    throw new UnauthorizedException('Authentication required');
  }

  private parseToken(token: string): AuthUser | null {
    try {
      // Check if it's base64 encoded JSON
      const decoded = Buffer.from(token, 'base64').toString('utf-8');
      if (decoded.startsWith('{') && decoded.endsWith('}')) {
        return JSON.parse(decoded) as AuthUser;
      }
    } catch {
      // not base64 json
    }

    try {
      if (token.startsWith('{') && token.endsWith('}')) {
        return JSON.parse(token) as AuthUser;
      }
    } catch {
      // not direct json
    }

    return null;
  }
}
