import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { BYPASS_TENANT_KEY } from '../decorators/tenant.decorator';

@Injectable()
export class TenantGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // 1. Check if route is annotated with @BypassTenant()
    const isBypass = this.reflector.getAllAndOverride<boolean>(BYPASS_TENANT_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isBypass) {
      return true;
    }

    // 2. Otherwise, enforce that a valid tenant context was resolved
    const request = context.switchToHttp().getRequest();
    if (!request.business || !request.businessId) {
      throw new UnauthorizedException(
        'Tenant isolation context could not be resolved. ' +
        'Please supply a valid X-Tenant-ID header, x-business-slug header, or a valid bearer token.',
      );
    }

    return true;
  }
}
