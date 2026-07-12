import { Injectable, BadRequestException } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';
import { AppLogger } from '../../common/logger/logger.service';
import { SyncRequestDto, SyncItemDto, MobileSyncAction } from '../dto/mobile.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class MobileSyncService {
  constructor(
    private readonly db: DatabaseService,
    private readonly logger: AppLogger,
  ) {
    this.logger.setContext('MobileSyncService');
  }

  /**
   * Orchestrates offline-online bidirectional synchronization.
   * Processes mobile client's queued changes first within a strict database transaction,
   * resolves conflicts, and then returns all server-side changes (deltas) since the last sync.
   */
  async synchronize(businessId: string, userId: string, dto: SyncRequestDto) {
    const syncLogs: any[] = [];
    let processedCount = 0;
    let conflictCount = 0;

    // 1. Process client changes inside a transaction
    if (dto.clientChanges && dto.clientChanges.length > 0) {
      await this.db.runInTransaction(async (tx) => {
        for (const item of dto.clientChanges!) {
          try {
            const result = await this.processSyncItem(tx, businessId, userId, item);
            if (result.conflictDetected) {
              conflictCount++;
            }
            processedCount++;
            syncLogs.push({
              clientId: item.clientId,
              serverId: result.serverId,
              status: result.status,
              conflictDetected: result.conflictDetected,
              error: result.error || null,
            });
          } catch (err) {
            this.logger.error(`Failed to process sync item [${item.clientId}]: ${err.message}`);
            syncLogs.push({
              clientId: item.clientId,
              serverId: item.serverId || null,
              status: 'FAILED',
              conflictDetected: false,
              error: err.message,
            });
          }
        }
      });
    }

    // 2. Fetch Server Deltas (Delta Synchronization)
    const deltas = await this.getServerDeltas(businessId, dto.lastSyncedAt);

    return {
      success: true,
      syncTimestamp: new Date().toISOString(),
      summary: {
        received: dto.clientChanges?.length || 0,
        processed: processedCount,
        conflicts: conflictCount,
      },
      clientSyncResults: syncLogs,
      deltas,
    };
  }

  /**
   * Processes a single offline queue item with last-write-wins (LWW) conflict resolution logic.
   */
  private async processSyncItem(
    tx: Prisma.TransactionClient,
    businessId: string,
    userId: string,
    item: SyncItemDto,
  ): Promise<{ serverId: string | null; status: 'SYNCED' | 'SKIPPED'; conflictDetected: boolean; error?: string }> {
    const { entityName, action, data, serverId, clientUpdatedAt } = item;
    const clientDate = new Date(clientUpdatedAt);

    if (entityName === 'MilkCollection') {
      if (action === MobileSyncAction.CREATE) {
        // Enforce duplicate check (Zero Calculation / Duplicate Errors)
        const dayStart = new Date(data.collectedAt);
        dayStart.setUTCHours(0, 0, 0, 0);
        const dayEnd = new Date(data.collectedAt);
        dayEnd.setUTCHours(23, 59, 59, 999);

        const existing = await tx.milkCollection.findFirst({
          where: {
            businessId,
            farmerName: data.farmerName,
            shift: data.shift,
            collectedAt: { gte: dayStart, lte: dayEnd },
            deletedAt: null,
          },
        });

        if (existing) {
          // Skip or handle conflict (Skip to prevent duplicate charge / collection)
          return { serverId: existing.id, status: 'SKIPPED', conflictDetected: true, error: 'Duplicate entry detected on server.' };
        }

        // Calculate totals securely (Zero Calculation Errors)
        const quantity = new Prisma.Decimal(data.quantity);
        const fat = new Prisma.Decimal(data.fat);
        const snf = new Prisma.Decimal(data.snf);
        
        // Resolve rate per liter based on standard pricing or default
        const ratePerLiter = new Prisma.Decimal(data.ratePerLiter || 45.00);
        const totalAmount = quantity.mul(ratePerLiter);

        const collection = await tx.milkCollection.create({
          data: {
            businessId,
            farmerName: data.farmerName,
            farmerPhone: data.farmerPhone || null,
            milkType: data.milkType,
            quantity,
            fat,
            snf,
            ratePerLiter,
            totalAmount,
            shift: data.shift,
            collectedAt: new Date(data.collectedAt),
            createdAt: clientDate, // keep tracking client generation
          },
        });

        return { serverId: collection.id, status: 'SYNCED', conflictDetected: false };
      }

      if (action === MobileSyncAction.UPDATE && serverId) {
        const existing = await tx.milkCollection.findUnique({ where: { id: serverId } });
        if (!existing) {
          return { serverId, status: 'SKIPPED', conflictDetected: true, error: 'Record not found on server.' };
        }

        // Conflict Resolution Strategy: Last-Write-Wins (LWW)
        if (existing.updatedAt > clientDate) {
          // Server record is newer, skip update (Server-Wins)
          return { serverId, status: 'SKIPPED', conflictDetected: true };
        }

        const quantity = data.quantity ? new Prisma.Decimal(data.quantity) : existing.quantity;
        const ratePerLiter = data.ratePerLiter ? new Prisma.Decimal(data.ratePerLiter) : existing.ratePerLiter;
        const totalAmount = quantity.mul(ratePerLiter);

        await tx.milkCollection.update({
          where: { id: serverId },
          data: {
            farmerName: data.farmerName,
            farmerPhone: data.farmerPhone,
            milkType: data.milkType,
            quantity,
            fat: data.fat ? new Prisma.Decimal(data.fat) : existing.fat,
            snf: data.snf ? new Prisma.Decimal(data.snf) : existing.snf,
            ratePerLiter,
            totalAmount,
            shift: data.shift,
            collectedAt: data.collectedAt ? new Date(data.collectedAt) : existing.collectedAt,
          },
        });

        return { serverId, status: 'SYNCED', conflictDetected: false };
      }

      if (action === MobileSyncAction.DELETE && serverId) {
        // Soft delete (Zero Data Loss)
        await tx.milkCollection.update({
          where: { id: serverId },
          data: { deletedAt: new Date() },
        });
        return { serverId, status: 'SYNCED', conflictDetected: false };
      }
    }

    if (entityName === 'Customer') {
      if (action === MobileSyncAction.CREATE) {
        const customer = await tx.customer.create({
          data: {
            businessId,
            firstName: data.firstName,
            lastName: data.lastName,
            email: data.email || null,
            phone: data.phone,
          },
        });
        return { serverId: customer.id, status: 'SYNCED', conflictDetected: false };
      }
    }

    // Default return for unsupported entity
    return { serverId: null, status: 'SKIPPED', conflictDetected: false, error: `Entity '${entityName}' is not supported for synchronization.` };
  }

  /**
   * Gathers deltas (all modifications / new creations) from the server databases
   * since the client's last synchronization timestamp.
   */
  private async getServerDeltas(businessId: string, lastSyncedAt?: string) {
    const since = lastSyncedAt ? new Date(lastSyncedAt) : new Date(0); // Default to epoch

    const collections = await this.db.milkCollection.findMany({
      where: {
        businessId,
        updatedAt: { gte: since },
      },
    });

    const customers = await this.db.customer.findMany({
      where: {
        businessId,
        updatedAt: { gte: since },
      },
    });

    const products = await this.db.product.findMany({
      where: {
        businessId,
        updatedAt: { gte: since },
      },
    });

    const routes = await this.db.route.findMany({
      where: {
        businessId,
        updatedAt: { gte: since },
      },
    });

    return {
      milkCollections: collections,
      customers,
      products,
      routes,
    };
  }
}
