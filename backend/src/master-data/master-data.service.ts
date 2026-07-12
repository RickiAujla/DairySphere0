import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { AppLogger } from '../common/logger/logger.service';
import { 
  CreateProductCategoryDto, 
  UpdateProductCategoryDto, 
  CreateRouteDto, 
  UpdateRouteDto,
  UpdateMasterSettingsDto
} from './dto/master-data.dto';

@Injectable()
export class MasterDataService {
  constructor(
    private readonly db: DatabaseService,
    private readonly logger: AppLogger,
  ) {
    this.logger.setContext('MasterDataService');
  }

  // ==========================================
  // PRODUCT CATEGORIES
  // ==========================================

  async getCategories(businessId: string, search?: string) {
    return await this.db.productCategory.findMany({
      where: {
        businessId,
        deletedAt: null,
        ...(search ? {
          OR: [
            { name: { contains: search, mode: 'insensitive' } },
            { slug: { contains: search, mode: 'insensitive' } },
            { description: { contains: search, mode: 'insensitive' } },
          ]
        } : {})
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  async getCategory(businessId: string, id: string) {
    const category = await this.db.productCategory.findFirst({
      where: { id, businessId, deletedAt: null }
    });
    if (!category) {
      throw new NotFoundException(`Product category with ID ${id} not found.`);
    }
    return category;
  }

  async createCategory(businessId: string, dto: CreateProductCategoryDto, userId: string) {
    const slug = dto.slug.toLowerCase().trim();
    const existing = await this.db.productCategory.findFirst({
      where: { businessId, slug, deletedAt: null }
    });
    if (existing) {
      throw new BadRequestException(`Category with slug '${slug}' already exists.`);
    }

    const category = await this.db.productCategory.create({
      data: {
        businessId,
        name: dto.name,
        slug,
        description: dto.description,
      }
    });

    // Audit Log
    await this.db.auditLog.create({
      data: {
        businessId,
        userId,
        action: 'CREATE_PRODUCT_CATEGORY',
        entityName: 'ProductCategory',
        entityId: category.id,
        newValue: JSON.stringify(category)
      }
    });

    await this.db.activityLog.create({
      data: {
        businessId,
        userId,
        type: 'MASTER_DATA',
        description: `Created product category: ${category.name}`
      }
    });

    return category;
  }

  async updateCategory(businessId: string, id: string, dto: UpdateProductCategoryDto, userId: string) {
    const category = await this.getCategory(businessId, id);
    const oldVal = JSON.stringify(category);

    if (dto.slug) {
      const slug = dto.slug.toLowerCase().trim();
      if (slug !== category.slug) {
        const existing = await this.db.productCategory.findFirst({
          where: { businessId, slug, deletedAt: null }
        });
        if (existing) {
          throw new BadRequestException(`Category with slug '${slug}' already exists.`);
        }
      }
    }

    const updated = await this.db.productCategory.update({
      where: { id },
      data: {
        name: dto.name,
        slug: dto.slug ? dto.slug.toLowerCase().trim() : undefined,
        description: dto.description,
      }
    });

    // Audit Log
    await this.db.auditLog.create({
      data: {
        businessId,
        userId,
        action: 'UPDATE_PRODUCT_CATEGORY',
        entityName: 'ProductCategory',
        entityId: id,
        oldValue: oldVal,
        newValue: JSON.stringify(updated)
      }
    });

    return updated;
  }

  async deleteCategory(businessId: string, id: string, userId: string) {
    const category = await this.getCategory(businessId, id);
    
    // Check if category has active products
    const productsCount = await this.db.product.count({
      where: { categoryId: id, deletedAt: null }
    });
    if (productsCount > 0) {
      throw new BadRequestException(`Cannot delete product category as it is currently associated with ${productsCount} products.`);
    }

    await this.db.productCategory.update({
      where: { id },
      data: { deletedAt: new Date() }
    });

    await this.db.auditLog.create({
      data: {
        businessId,
        userId,
        action: 'DELETE_PRODUCT_CATEGORY',
        entityName: 'ProductCategory',
        entityId: id,
        oldValue: JSON.stringify(category)
      }
    });

    await this.db.activityLog.create({
      data: {
        businessId,
        userId,
        type: 'MASTER_DATA',
        description: `Deleted product category: ${category.name}`
      }
    });

    return { success: true };
  }

  async importCategories(businessId: string, items: any[], userId: string) {
    let successCount = 0;
    let failCount = 0;
    const errors: string[] = [];

    await this.db.runInTransaction(async (tx) => {
      for (const item of items) {
        try {
          if (!item.name || !item.slug) {
            throw new Error('Name and Slug are required properties.');
          }
          const slug = item.slug.toLowerCase().trim();
          const existing = await tx.productCategory.findFirst({
            where: { businessId, slug, deletedAt: null }
          });

          if (existing) {
            // Update
            await tx.productCategory.update({
              where: { id: existing.id },
              data: {
                name: item.name,
                description: item.description || null
              }
            });
          } else {
            // Create
            await tx.productCategory.create({
              data: {
                businessId,
                name: item.name,
                slug,
                description: item.description || null
              }
            });
          }
          successCount++;
        } catch (err) {
          failCount++;
          errors.push(`Row processing failed: ${err instanceof Error ? err.message : String(err)}`);
        }
      }
    });

    await this.db.activityLog.create({
      data: {
        businessId,
        userId,
        type: 'MASTER_DATA',
        description: `Imported product categories list: ${successCount} successfully imported, ${failCount} failed.`
      }
    });

    return { successCount, failCount, errors };
  }

  // ==========================================
  // DELIVERY ROUTES
  // ==========================================

  async getRoutes(businessId: string, search?: string) {
    return await this.db.route.findMany({
      where: {
        businessId,
        deletedAt: null,
        ...(search ? {
          OR: [
            { name: { contains: search, mode: 'insensitive' } },
            { description: { contains: search, mode: 'insensitive' } },
            { startPoint: { contains: search, mode: 'insensitive' } },
            { endPoint: { contains: search, mode: 'insensitive' } },
          ]
        } : {})
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  async getRoute(businessId: string, id: string) {
    const route = await this.db.route.findFirst({
      where: { id, businessId, deletedAt: null }
    });
    if (!route) {
      throw new NotFoundException(`Delivery route with ID ${id} not found.`);
    }
    return route;
  }

  async createRoute(businessId: string, dto: CreateRouteDto, userId: string) {
    const route = await this.db.route.create({
      data: {
        businessId,
        name: dto.name,
        description: dto.description,
        startPoint: dto.startPoint,
        endPoint: dto.endPoint,
      }
    });

    // Audit Log
    await this.db.auditLog.create({
      data: {
        businessId,
        userId,
        action: 'CREATE_DELIVERY_ROUTE',
        entityName: 'Route',
        entityId: route.id,
        newValue: JSON.stringify(route)
      }
    });

    await this.db.activityLog.create({
      data: {
        businessId,
        userId,
        type: 'MASTER_DATA',
        description: `Created delivery route: ${route.name}`
      }
    });

    return route;
  }

  async updateRoute(businessId: string, id: string, dto: UpdateRouteDto, userId: string) {
    const route = await this.getRoute(businessId, id);
    const oldVal = JSON.stringify(route);

    const updated = await this.db.route.update({
      where: { id },
      data: {
        name: dto.name,
        description: dto.description,
        startPoint: dto.startPoint,
        endPoint: dto.endPoint,
      }
    });

    // Audit Log
    await this.db.auditLog.create({
      data: {
        businessId,
        userId,
        action: 'UPDATE_DELIVERY_ROUTE',
        entityName: 'Route',
        entityId: id,
        oldValue: oldVal,
        newValue: JSON.stringify(updated)
      }
    });

    return updated;
  }

  async deleteRoute(businessId: string, id: string, userId: string) {
    const route = await this.getRoute(businessId, id);

    // Hard-delete or soft-delete
    await this.db.route.update({
      where: { id },
      data: { deletedAt: new Date() }
    });

    await this.db.auditLog.create({
      data: {
        businessId,
        userId,
        action: 'DELETE_DELIVERY_ROUTE',
        entityName: 'Route',
        entityId: id,
        oldValue: JSON.stringify(route)
      }
    });

    await this.db.activityLog.create({
      data: {
        businessId,
        userId,
        type: 'MASTER_DATA',
        description: `Deleted delivery route: ${route.name}`
      }
    });

    return { success: true };
  }

  async importRoutes(businessId: string, items: any[], userId: string) {
    let successCount = 0;
    let failCount = 0;
    const errors: string[] = [];

    await this.db.runInTransaction(async (tx) => {
      for (const item of items) {
        try {
          if (!item.name) {
            throw new Error('Route Name is required.');
          }
          await tx.route.create({
            data: {
              businessId,
              name: item.name,
              description: item.description || null,
              startPoint: item.startPoint || null,
              endPoint: item.endPoint || null
            }
          });
          successCount++;
        } catch (err) {
          failCount++;
          errors.push(`Row processing failed: ${err instanceof Error ? err.message : String(err)}`);
        }
      }
    });

    await this.db.activityLog.create({
      data: {
        businessId,
        userId,
        type: 'MASTER_DATA',
        description: `Imported delivery routes list: ${successCount} successfully imported, ${failCount} failed.`
      }
    });

    return { successCount, failCount, errors };
  }

  // ==========================================
  // SETTINGS-BASED MASTER DATA
  // ==========================================

  async getMasterSettings(businessId: string) {
    const settings = await this.db.setting.findMany({
      where: { businessId }
    });

    const settingsMap: Record<string, string> = {};
    for (const s of settings) {
      settingsMap[s.key] = s.value;
    }

    return settingsMap;
  }

  async updateMasterSettings(businessId: string, dto: UpdateMasterSettingsDto, userId: string) {
    const oldSettings = await this.getMasterSettings(businessId);

    await this.db.runInTransaction(async (tx) => {
      for (const [key, value] of Object.entries(dto.settings)) {
        const valStr = typeof value === 'object' ? JSON.stringify(value) : String(value);
        await tx.setting.upsert({
          where: {
            businessId_key: {
              businessId,
              key
            }
          },
          create: {
            businessId,
            key,
            value: valStr
          },
          update: {
            value: valStr
          }
        });
      }
    });

    const newSettings = await this.getMasterSettings(businessId);

    await this.db.auditLog.create({
      data: {
        businessId,
        userId,
        action: 'UPDATE_MASTER_SETTINGS',
        entityName: 'Setting',
        oldValue: JSON.stringify(oldSettings),
        newValue: JSON.stringify(newSettings)
      }
    });

    await this.db.activityLog.create({
      data: {
        businessId,
        userId,
        type: 'MASTER_DATA',
        description: 'Bulk updated cooperative configurations, preferences, or master registers.'
      }
    });

    return newSettings;
  }
}
