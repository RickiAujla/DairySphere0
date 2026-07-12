import { createParamDecorator, ExecutionContext, SetMetadata } from '@nestjs/common';

export const BYPASS_TENANT_KEY = 'bypassTenant';
export const BypassTenant = () => SetMetadata(BYPASS_TENANT_KEY, true);

export const Tenant = createParamDecorator((data: string | undefined, ctx: ExecutionContext) => {
  const request = ctx.switchToHttp().getRequest();
  const business = request.business;

  if (!business) {
    return null;
  }

  return data ? business[data] : business;
});
