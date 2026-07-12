// DairySphere Shared Module Entry Point
export interface UserSession {
  userId: string;
  tenantId: string;
  role: 'SYSTEM_ADMIN' | 'DAIRY_OWNER' | 'FARM_MANAGER' | 'VETERINARIAN' | 'FIELD_OPERATOR';
  permissions: string[];
}
