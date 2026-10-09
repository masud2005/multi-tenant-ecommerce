import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PrismaService } from '../../prisma/prisma.service';
import {
  RBAC_OVERRIDE_KEY,
  RbacPermissionOverride,
  RbacAction,
} from '../decorators/rbac.decorator';
import { UserRole } from '../../../prisma/generated/client';

@Injectable()
export class TenantRbacGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('User not authenticated');
    }

    // 1. Platform Super Admin / Global Owner has unrestricted access
    if (user.role === UserRole.OWNER) {
      return true;
    }

    // 2. Resolve current store context
    const currentTenantId =
      request.tenantId ||
      request.headers['x-tenant-id'] ||
      user.tenantId ||
      user.tenantMemberships?.[0]?.tenantId;

    if (!currentTenantId) {
      throw new ForbiddenException('Store context not found in request');
    }

    // 3. Query user membership and assigned role in this tenant
    const membership = await this.prisma.tenantMember.findUnique({
      where: {
        tenantId_userId: {
          tenantId: currentTenantId,
          userId: user.id,
        },
      },
      include: {
        role: true,
      },
    });

    if (!membership) {
      throw new ForbiddenException('You are not a staff member of this store');
    }

    if (membership.status !== 'active') {
      throw new ForbiddenException(
        `Your store access is currently ${membership.status}`
      );
    }

    // 4. Store Owner bypass (Store owner has full rights)
    if (membership.isOwner) {
      return true;
    }

    // 5. Staff permissions validation
    if (!membership.role || !membership.role.permissions) {
      throw new ForbiddenException(
        'No role or permissions assigned to this staff account'
      );
    }

    // 6. Resolve module and action (auto-detect or metadata override)
    const override = this.reflector.getAllAndOverride<RbacPermissionOverride>(
      RBAC_OVERRIDE_KEY,
      [context.getHandler(), context.getClass()]
    );

    const moduleName = override?.module || this.detectModule(request);
    const actionName = override?.action || this.detectAction(request.method);

    if (!moduleName || !actionName) {
      return true;
    }

    const permissions = membership.role.permissions as Record<string, string[]>;
    const allowedActions = permissions[moduleName] || [];

    if (!allowedActions.includes(actionName)) {
      throw new ForbiddenException(
        `Permission denied: Requires '${actionName}' permission on '${moduleName}'`
      );
    }

    return true;
  }

  // Auto-detect module name from URL path (/owner/:module/...)
  private detectModule(request: any): string | null {
    const rawUrl = request.originalUrl || request.url || '';
    const cleanPath = rawUrl.split('?')[0];

    const match = cleanPath.match(/\/owner\/([a-zA-Z0-9_-]+)/);
    if (match && match[1]) {
      return match[1].toLowerCase();
    }

    return null;
  }

  // Auto-detect action from HTTP method
  private detectAction(method: string): RbacAction {
    switch (method?.toUpperCase()) {
      case 'GET':
      case 'HEAD':
        return 'view';
      case 'POST':
        return 'create';
      case 'PUT':
      case 'PATCH':
        return 'update';
      case 'DELETE':
        return 'delete';
      default:
        return 'view';
    }
  }
}
