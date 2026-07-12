import { Injectable, CanActivate, ExecutionContext, ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { DatabaseService } from '../../database/database.service';
import { PERMISSIONS_KEY } from '../decorators/permissions.decorator';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly db: DatabaseService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredPermissions = this.reflector.getAllAndOverride<string[]>(PERMISSIONS_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const businessId = request.businessId;

    if (!user || !user.userId) {
      throw new UnauthorizedException('Authentication session required for permission check');
    }

    if (!businessId) {
      throw new UnauthorizedException('Tenant context required for permission verification');
    }

    // Resolve user roles and check if they are "ADMIN" (which bypasses checks or has all permissions)
    // We fetch user roles for this tenant from database.
    const userRoles = await this.db.userRole.findMany({
      where: {
        userId: user.userId,
        role: {
          businessId: businessId,
        },
      },
      include: {
        role: {
          include: {
            rolePermissions: {
              include: {
                permission: true,
              },
            },
          },
        },
      },
    });

    if (userRoles.length === 0) {
      throw new ForbiddenException('User has no assigned roles in this business cooperative');
    }

    // Check if user is ADMIN role (which has all access)
    const isAdmin = userRoles.some(ur => ur.role.name === 'ADMIN');
    if (isAdmin) {
      return true;
    }

    // Consolidate permission keys
    const userPermissionKeys = new Set<string>();
    for (const ur of userRoles) {
      for (const rp of ur.role.rolePermissions) {
        userPermissionKeys.add(rp.permission.name);
      }
    }

    // Check if user has all the required permissions
    const hasPermission = requiredPermissions.every(permission => userPermissionKeys.has(permission));

    if (!hasPermission) {
      throw new ForbiddenException(
        `Insufficient privileges. Required permission: ${requiredPermissions.join(', ')}`,
      );
    }

    return true;
  }
}
