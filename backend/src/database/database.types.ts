import { Prisma } from '@prisma/client';

export type TransactionClient = Prisma.TransactionClient;

export interface DatabaseHealthStatus {
  status: 'UP' | 'DOWN';
  latencyMs?: number;
  error?: string;
}

export interface QueryOptions {
  skip?: number;
  take?: number;
  orderBy?: Record<string, 'asc' | 'desc'>;
}

export interface TenantScopedEntity {
  tenantId: string;
}

export interface SoftDeletableEntity {
  deletedAt?: Date | null;
}

export interface AuditableEntity {
  createdAt: Date;
  updatedAt: Date;
}
