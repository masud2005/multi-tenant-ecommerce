import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export interface AuthUser {
  id: string;
  sub?: string;
  email?: string | null;
  name?: string | null;
  phone?: string | null;
  role?: string;
  tenantId?: string;
  sid?: string | null;
  isOwner?: boolean;
}

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): AuthUser | undefined => {
    const request = ctx.switchToHttp().getRequest<{ user?: AuthUser }>();
    return request.user;
  },
);
