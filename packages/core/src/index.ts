// DairySphere Core Package Entry Point
export interface TenantConfig {
  tenantId: string;
  name: string;
  subscriptionPlan: 'BASIC' | 'PREMIUM' | 'ENTERPRISE';
}
