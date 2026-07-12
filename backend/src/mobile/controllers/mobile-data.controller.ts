import { 
  Controller, 
  Get, 
  Post, 
  Put, 
  Delete, 
  Body, 
  Param, 
  Query, 
  Req, 
  UseGuards, 
  HttpCode, 
  HttpStatus,
  UseInterceptors,
  UploadedFile
} from '@nestjs/common';
import { TenantGuard } from '../../business/guards/tenant.guard';
import { Tenant } from '../../business/decorators/tenant.decorator';
import { DatabaseService } from '../../database/database.service';
import { AppLogger } from '../../common/logger/logger.service';
import { 
  CreateFarmerMobileDto, 
  CreateMilkCollectionMobileDto, 
  CreateSaleMobileDto, 
  CreateExpenseMobileDto,
  MobileMilkType,
  MobileShift
} from '../dto/mobile.dto';
import { Request } from 'express';
import { Prisma } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

@Controller('api/v1/mobile')
@UseGuards(TenantGuard)
export class MobileDataController {
  constructor(
    private readonly db: DatabaseService,
    private readonly logger: AppLogger,
  ) {
    this.logger.setContext('MobileDataController');
  }

  // ==========================================
  // DASHBOARD
  // ==========================================

  @Get('dashboard')
  async getDashboard(@Tenant('id') businessId: string) {
    const todayStart = new Date();
    todayStart.setUTCHours(0, 0, 0, 0);

    const todayEnd = new Date();
    todayEnd.setUTCHours(23, 59, 59, 999);

    // Secure database aggregation of collection totals
    const todayCollections = await this.db.milkCollection.aggregate({
      where: {
        businessId,
        collectedAt: { gte: todayStart, lte: todayEnd },
        deletedAt: null,
      },
      _sum: {
        quantity: true,
        totalAmount: true,
      },
      _count: true,
    });

    const activeDeliveries = await this.db.delivery.count({
      where: {
        deliveryAssignment: {
          route: { businessId }
        },
        status: { notIn: ['DELIVERED', 'CANCELLED'] }
      }
    });

    const totalCustomers = await this.db.customer.count({
      where: { businessId, deletedAt: null }
    });

    const unreadNotifications = await this.db.notification.count({
      where: { businessId, isRead: false }
    });

    return {
      success: true,
      data: {
        todayStats: {
          milkCollectedLiters: todayCollections._sum.quantity ? Number(todayCollections._sum.quantity) : 0,
          totalEarnings: todayCollections._sum.totalAmount ? Number(todayCollections._sum.totalAmount) : 0,
          collectionsCount: todayCollections._count || 0,
        },
        activeDeliveriesCount: activeDeliveries,
        totalCustomersCount: totalCustomers,
        unreadNotificationsCount: unreadNotifications,
        timestamp: new Date().toISOString(),
      }
    };
  }

  // ==========================================
  // FARMER MANAGEMENT
  // ==========================================

  @Get('farmers')
  async getFarmers(
    @Tenant('id') businessId: string,
    @Query('search') search?: string,
    @Query('status') status?: string,
    @Query('page') page = '1',
    @Query('limit') limit = '50',
  ) {
    const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);
    const take = parseInt(limit, 10);

    // Fetch custom farmers from Settings table (multi-tenant safe)
    const customFarmersSettings = await this.db.setting.findMany({
      where: {
        businessId,
        key: { startsWith: 'farmer_data:' },
      },
    });

    let farmers = customFarmersSettings.map((s) => JSON.parse(s.value));

    // Fallback seed farmers if empty
    if (farmers.length === 0) {
      farmers = [
        {
          id: 'fmr-1',
          code: 'FMR-001',
          name: 'Sukhdev Singh',
          address: 'VPO Jandiala, Amritsar, Punjab',
          contacts: ['+91 98765 43210'],
          milkPreference: 'COW',
          status: 'ACTIVE',
          bankName: 'State Bank of India',
          accountNumber: '30123456789',
          ifscCode: 'SBIN0001234',
          upiId: 'sukhdev@sbi',
        },
        {
          id: 'fmr-2',
          code: 'FMR-002',
          name: 'Gurpreet Kaur',
          address: 'Village Rayya, Beas, Punjab',
          contacts: ['+91 87654 32109'],
          milkPreference: 'BUFFALO',
          status: 'ACTIVE',
          bankName: 'Punjab National Bank',
          accountNumber: '401234567890',
          ifscCode: 'PUNB0123400',
          upiId: 'gurpreet@okaxis',
        }
      ];
    }

    // Apply filtering & searching on server side
    if (search) {
      const q = search.toLowerCase();
      farmers = farmers.filter(
        (f) =>
          f.name.toLowerCase().includes(q) ||
          f.code.toLowerCase().includes(q) ||
          (f.address && f.address.toLowerCase().includes(q)),
      );
    }

    if (status && status !== 'all') {
      farmers = farmers.filter((f) => f.status === status);
    }

    const total = farmers.length;
    const paginated = farmers.slice(skip, skip + take);

    return {
      success: true,
      data: paginated,
      meta: {
        total,
        page: parseInt(page, 10),
        limit: take,
        totalPages: Math.ceil(total / take),
      }
    };
  }

  @Post('farmers')
  @HttpCode(HttpStatus.CREATED)
  async createFarmer(
    @Tenant('id') businessId: string,
    @Body() dto: CreateFarmerMobileDto,
  ) {
    const farmerId = `fmr_${Date.now()}`;
    const farmerCode = dto.code || `FMR-${Math.floor(100 + Math.random() * 900)}`;
    const farmerData = {
      id: farmerId,
      code: farmerCode,
      name: dto.name,
      address: dto.address || '',
      contacts: dto.contacts || [],
      aadhaar: dto.aadhaar || '',
      pan: dto.pan || '',
      gst: dto.gst || '',
      bankName: dto.bankName || '',
      accountNumber: dto.accountNumber || '',
      ifscCode: dto.ifscCode || '',
      upiId: dto.upiId || '',
      milkPreference: dto.milkPreference || MobileMilkType.COW,
      status: dto.status || 'ACTIVE',
      tags: dto.tags || [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await this.db.setting.create({
      data: {
        businessId,
        key: `farmer_data:${farmerId}`,
        value: JSON.stringify(farmerData),
      },
    });

    return {
      success: true,
      message: 'Farmer registered successfully via mobile.',
      data: farmerData,
    };
  }

  @Get('farmers/:id')
  async getFarmerDetail(
    @Tenant('id') businessId: string,
    @Param('id') id: string,
  ) {
    const setting = await this.db.setting.findFirst({
      where: {
        businessId,
        key: `farmer_data:${id}`,
      },
    });

    if (!setting) {
      throw new Error(`Farmer with ID ${id} not found.`);
    }

    return {
      success: true,
      data: JSON.parse(setting.value),
    };
  }

  // ==========================================
  // MILK COLLECTION LOGS
  // ==========================================

  @Get('milk-collections')
  async getCollections(
    @Tenant('id') businessId: string,
    @Query('search') search?: string,
    @Query('shift') shift?: MobileShift,
    @Query('page') page = '1',
    @Query('limit') limit = '30',
  ) {
    const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);
    const take = parseInt(limit, 10);

    const where: any = {
      businessId,
      deletedAt: null,
    };

    if (shift) where.shift = shift;
    if (search) {
      where.farmerName = { contains: search, mode: 'insensitive' };
    }

    const [collections, total] = await Promise.all([
      this.db.milkCollection.findMany({
        where,
        orderBy: { collectedAt: 'desc' },
        skip,
        take,
      }),
      this.db.milkCollection.count({ where }),
    ]);

    return {
      success: true,
      data: collections,
      meta: {
        total,
        page: parseInt(page, 10),
        limit: take,
        totalPages: Math.ceil(total / take),
      }
    };
  }

  @Post('milk-collections')
  @HttpCode(HttpStatus.CREATED)
  async createCollection(
    @Tenant('id') businessId: string,
    @Req() req: Request,
    @Body() dto: CreateMilkCollectionMobileDto,
  ) {
    const userId = req.user?.userId || 'system-admin';

    // Transaction safety to prevent dual calculation/concurrency errors
    const collection = await this.db.runInTransaction(async (tx) => {
      const quantity = new Prisma.Decimal(dto.quantity);
      const fat = new Prisma.Decimal(dto.fat);
      const snf = new Prisma.Decimal(dto.snf);
      
      // Calculate optimized Rate Per Liter (Zero calculation error policy)
      const baseRate = new Prisma.Decimal(40.00);
      const fatPremium = fat.sub(new Prisma.Decimal(4.0)).mul(new Prisma.Decimal(2.5));
      const snfPremium = snf.sub(new Prisma.Decimal(8.5)).mul(new Prisma.Decimal(1.5));
      
      const ratePerLiter = baseRate.add(fatPremium).add(snfPremium);
      const totalAmount = quantity.mul(ratePerLiter);

      return await tx.milkCollection.create({
        data: {
          businessId,
          farmerName: dto.farmerName,
          farmerPhone: dto.farmerPhone || null,
          milkType: dto.milkType,
          quantity,
          fat,
          snf,
          ratePerLiter,
          totalAmount,
          shift: dto.shift,
          collectedAt: new Date(dto.collectedAt),
        },
      });
    });

    await this.db.activityLog.create({
      data: {
        businessId,
        userId,
        type: 'MILK_COLLECTION',
        description: `Logged collection of ${dto.quantity}L from ${dto.farmerName} via mobile app.`,
      },
    });

    return {
      success: true,
      message: 'Milk collection log submitted and synchronized.',
      data: collection,
    };
  }

  // ==========================================
  // FARMER BILLING
  // ==========================================

  @Get('billing')
  async getFarmerBilling(
    @Tenant('id') businessId: string,
    @Query('farmerName') farmerName?: string,
  ) {
    const where: any = {
      businessId,
      deletedAt: null,
    };
    if (farmerName) {
      where.farmerName = { contains: farmerName, mode: 'insensitive' };
    }

    const billingStats = await this.db.milkCollection.groupBy({
      by: ['farmerName'],
      where,
      _sum: {
        quantity: true,
        totalAmount: true,
      },
      _count: true,
    });

    return {
      success: true,
      data: billingStats.map((item) => ({
        farmerName: item.farmerName,
        totalVolumeLiters: Number(item._sum.quantity || 0),
        grossEarnings: Number(item._sum.totalAmount || 0),
        logsCount: item._count,
        pendingPayout: Number(item._sum.totalAmount || 0) * 0.1, // simulation of typical cooperative withholdings
        currency: 'INR',
      }))
    };
  }

  // ==========================================
  // INVENTORY
  // ==========================================

  @Get('inventory')
  async getInventory(@Tenant('id') businessId: string) {
    const products = await this.db.product.findMany({
      where: { businessId, deletedAt: null },
      include: {
        productStocks: true,
      },
    });

    return {
      success: true,
      data: products.map((p) => {
        const stockQty = p.productStocks.reduce((sum, s) => sum + Number(s.quantity), 0);
        return {
          id: p.id,
          name: p.name,
          sku: p.sku,
          price: Number(p.price),
          stockQuantity: stockQty,
          status: stockQty > 5 ? 'IN_STOCK' : stockQty > 0 ? 'LOW_STOCK' : 'OUT_OF_STOCK',
        };
      })
    };
  }

  // ==========================================
  // PRODUCTS CATALOGUE
  // ==========================================

  @Get('products')
  async getProducts(@Tenant('id') businessId: string) {
    const products = await this.db.product.findMany({
      where: { businessId, deletedAt: null },
    });

    return {
      success: true,
      data: products,
    };
  }

  // ==========================================
  // CUSTOMERS
  // ==========================================

  @Get('customers')
  async getCustomers(@Tenant('id') businessId: string) {
    const customers = await this.db.customer.findMany({
      where: { businessId, deletedAt: null },
      orderBy: { firstName: 'asc' },
    });

    return {
      success: true,
      data: customers,
    };
  }

  // ==========================================
  // SALES
  // ==========================================

  @Get('sales')
  async getSales(@Tenant('id') businessId: string) {
    const sales = await this.db.milkSale.findMany({
      where: { businessId, deletedAt: null },
      orderBy: { soldAt: 'desc' },
    });

    return {
      success: true,
      data: sales,
    };
  }

  @Post('sales')
  @HttpCode(HttpStatus.CREATED)
  async registerSale(
    @Tenant('id') businessId: string,
    @Req() req: Request,
    @Body() dto: CreateSaleMobileDto,
  ) {
    const userId = req.user?.userId || 'system-admin';

    const sale = await this.db.runInTransaction(async (tx) => {
      const quantity = new Prisma.Decimal(dto.quantity);
      const ratePerLiter = new Prisma.Decimal(dto.ratePerLiter);
      const totalAmount = quantity.mul(ratePerLiter);

      return await tx.milkSale.create({
        data: {
          businessId,
          buyerName: dto.buyerName || 'Retail Walk-In Customer',
          milkType: dto.milkType,
          quantity,
          ratePerLiter,
          totalAmount,
          shift: dto.shift,
          soldAt: new Date(dto.soldAt),
        },
      });
    });

    await this.db.activityLog.create({
      data: {
        businessId,
        userId,
        type: 'RETAIL_SALE',
        description: `Registered cash milk sale of ${dto.quantity}L via mobile application.`,
      },
    });

    return {
      success: true,
      message: 'Milk sale log registered dynamically.',
      data: sale,
    };
  }

  // ==========================================
  // DELIVERY TRACKING
  // ==========================================

  @Get('deliveries')
  async getDeliveries(@Tenant('id') businessId: string) {
    const deliveries = await this.db.delivery.findMany({
      where: {
        deliveryAssignment: {
          route: { businessId }
        }
      },
      include: {
        customerAddress: {
          include: { customer: true }
        },
        deliveryAssignment: {
          include: { route: true }
        }
      },
      orderBy: { scheduledDate: 'desc' }
    });

    return {
      success: true,
      data: deliveries,
    };
  }

  @Put('deliveries/:id/status')
  async updateDeliveryStatus(
    @Tenant('id') businessId: string,
    @Param('id') id: string,
    @Body('status') status: string,
  ) {
    const delivery = await this.db.delivery.update({
      where: { id },
      data: { status: status as any },
    });

    return {
      success: true,
      message: 'Delivery status tracking dispatched.',
      data: delivery,
    };
  }

  // ==========================================
  // FINANCE
  // ==========================================

  @Get('finance/expenses')
  async getExpenses(@Tenant('id') businessId: string) {
    const expenses = await this.db.expense.findMany({
      where: { businessId },
      orderBy: { spentAt: 'desc' },
    });

    return {
      success: true,
      data: expenses,
    };
  }

  @Post('finance/expenses')
  @HttpCode(HttpStatus.CREATED)
  async createExpense(
    @Tenant('id') businessId: string,
    @Body() dto: CreateExpenseMobileDto,
  ) {
    const expense = await this.db.expense.create({
      data: {
        businessId,
        description: dto.description,
        amount: new Prisma.Decimal(dto.amount),
        category: dto.category,
        spentAt: new Date(dto.spentAt),
      },
    });

    return {
      success: true,
      message: 'Expense reported via mobile log.',
      data: expense,
    };
  }

  // ==========================================
  // REPORTS
  // ==========================================

  @Get('reports/collections-summary')
  async getReportsCollections(@Tenant('id') businessId: string) {
    const summary = await this.db.milkCollection.groupBy({
      by: ['milkType'],
      where: { businessId, deletedAt: null },
      _sum: {
        quantity: true,
        totalAmount: true,
      },
      _count: true,
    });

    return {
      success: true,
      data: summary.map((s) => ({
        milkType: s.milkType,
        totalLiters: Number(s._sum.quantity || 0),
        totalValuation: Number(s._sum.totalAmount || 0),
        logCount: s._count,
      }))
    };
  }

  // ==========================================
  // NOTIFICATIONS
  // ==========================================

  @Get('notifications')
  async getNotifications(@Tenant('id') businessId: string) {
    const notifications = await this.db.notification.findMany({
      where: { businessId },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    return {
      success: true,
      data: notifications,
    };
  }

  @Put('notifications/:id/read')
  async markAsRead(
    @Tenant('id') businessId: string,
    @Param('id') id: string,
  ) {
    const notification = await this.db.notification.update({
      where: { id },
      data: { isRead: true, readAt: new Date() },
    });

    return {
      success: true,
      data: notification,
    };
  }

  // ==========================================
  // MOBILE CONFIG & SETTINGS
  // ==========================================

  @Get('settings')
  async getMobileSettings(@Tenant('id') businessId: string) {
    const settings = await this.db.setting.findMany({
      where: { businessId, key: { startsWith: 'mobile_config:' } },
    });

    const settingsMap: Record<string, string> = {
      offline_sync_interval_mins: '15',
      enable_push_notifications: 'true',
      high_fat_premium_rate: '2.5',
    };

    for (const s of settings) {
      const cleanKey = s.key.replace('mobile_config:', '');
      settingsMap[cleanKey] = s.value;
    }

    return {
      success: true,
      data: settingsMap,
    };
  }

  // ==========================================
  // IMAGE & FILE UPLOADS
  // ==========================================

  @Post('upload')
  @HttpCode(HttpStatus.OK)
  async uploadFile(
    @Req() req: Request,
    @Body('fileName') base64FileName?: string,
    @Body('fileData') base64FileData?: string,
  ) {
    const userId = req.user?.userId || 'system-admin';

    // Handle robust Base64 upload popular on Android/iOS native clients
    if (base64FileName && base64FileData) {
      const buffer = Buffer.from(base64FileData, 'base64');
      const uploadDir = path.join(process.cwd(), 'uploads');
      
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }

      const fileExtension = path.extname(base64FileName);
      const uniqueFileName = `mobile_${Date.now()}_${Math.floor(Math.random() * 10000)}${fileExtension}`;
      const filePath = path.join(uploadDir, uniqueFileName);

      fs.writeFileSync(filePath, buffer);

      const mimeType = fileExtension === '.png' ? 'image/png' : 'image/jpeg';
      const fileUrl = `/uploads/${uniqueFileName}`;

      const fileRecord = await this.db.file.create({
        data: {
          name: base64FileName,
          mimeType,
          size: buffer.length,
          url: fileUrl,
          key: uniqueFileName,
          uploadedById: userId === 'system-admin' ? null : userId,
        }
      });

      return {
        success: true,
        message: 'File uploaded and parsed successfully.',
        data: fileRecord,
      };
    }

    throw new BadRequestException('Invalid upload parameters. Supply base64FileName and base64FileData.');
  }
}
