import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { DashboardQueryDto } from './dto/dashboard-query.dto';
import { TenantGuard } from '../business/guards/tenant.guard';
import { PermissionsGuard } from '../rbac/guards/permissions.guard';
import { Tenant } from '../business/decorators/tenant.decorator';
import { RequirePermissions } from '../rbac/decorators/permissions.decorator';

@Controller('api/dashboard')
@UseGuards(TenantGuard, PermissionsGuard)
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  // ==========================================
  // ANALYTICS & STATS ENDPOINTS
  // ==========================================

  @Get('stats/kpi')
  @RequirePermissions('finance:read')
  async getKpiStats(
    @Tenant('id') businessId: string,
    @Query() query: DashboardQueryDto,
  ) {
    const data = await this.dashboardService.getKpiStats(businessId, query);
    return {
      success: true,
      data,
    };
  }

  @Get('stats/revenue')
  @RequirePermissions('finance:read')
  async getRevenueStats(
    @Tenant('id') businessId: string,
    @Query() query: DashboardQueryDto,
  ) {
    const data = await this.dashboardService.getRevenueStats(businessId, query);
    return {
      success: true,
      data,
    };
  }

  @Get('stats/customers')
  @RequirePermissions('users:read')
  async getCustomerStats(
    @Tenant('id') businessId: string,
    @Query() query: DashboardQueryDto,
  ) {
    const data = await this.dashboardService.getCustomerStats(businessId, query);
    return {
      success: true,
      data,
    };
  }

  @Get('stats/products')
  @RequirePermissions('finance:read')
  async getProductStats(
    @Tenant('id') businessId: string,
    @Query() query: DashboardQueryDto,
  ) {
    const data = await this.dashboardService.getProductStats(businessId, query);
    return {
      success: true,
      data,
    };
  }

  @Get('stats/orders')
  @RequirePermissions('finance:read')
  async getOrderStats(
    @Tenant('id') businessId: string,
    @Query() query: DashboardQueryDto,
  ) {
    const data = await this.dashboardService.getOrderStats(businessId, query);
    return {
      success: true,
      data,
    };
  }

  @Get('stats/deliveries')
  @RequirePermissions('milk-sales:read')
  async getDeliveryStats(
    @Tenant('id') businessId: string,
    @Query() query: DashboardQueryDto,
  ) {
    const data = await this.dashboardService.getDeliveryStats(businessId, query);
    return {
      success: true,
      data,
    };
  }

  @Get('stats/employees')
  @RequirePermissions('employees:read')
  async getEmployeeStats(
    @Tenant('id') businessId: string,
    @Query() query: DashboardQueryDto,
  ) {
    const data = await this.dashboardService.getEmployeeStats(businessId, query);
    return {
      success: true,
      data,
    };
  }

  @Get('stats/milk-collection')
  @RequirePermissions('milk-collection:read')
  async getMilkCollectionStats(
    @Tenant('id') businessId: string,
    @Query() query: DashboardQueryDto,
  ) {
    const data = await this.dashboardService.getMilkCollectionStats(businessId, query);
    return {
      success: true,
      data,
    };
  }

  @Get('stats/inventory')
  @RequirePermissions('finance:read')
  async getInventoryStats(
    @Tenant('id') businessId: string,
    @Query() query: DashboardQueryDto,
  ) {
    const data = await this.dashboardService.getInventoryStats(businessId, query);
    return {
      success: true,
      data,
    };
  }

  // ==========================================
  // CHARTS ENDPOINTS
  // ==========================================

  @Get('charts/revenue')
  @RequirePermissions('finance:read')
  async getRevenueChart(
    @Tenant('id') businessId: string,
    @Query() query: DashboardQueryDto,
  ) {
    const data = await this.dashboardService.getRevenueChart(businessId, query);
    return {
      success: true,
      data,
    };
  }

  @Get('charts/sales-trend')
  @RequirePermissions('finance:read')
  async getSalesTrend(
    @Tenant('id') businessId: string,
    @Query() query: DashboardQueryDto,
  ) {
    const data = await this.dashboardService.getSalesTrend(businessId, query);
    return {
      success: true,
      data,
    };
  }

  @Get('charts/customer-growth')
  @RequirePermissions('users:read')
  async getCustomerGrowth(
    @Tenant('id') businessId: string,
    @Query() query: DashboardQueryDto,
  ) {
    const data = await this.dashboardService.getCustomerGrowth(businessId, query);
    return {
      success: true,
      data,
    };
  }

  @Get('charts/product-distribution')
  @RequirePermissions('finance:read')
  async getProductDistribution(
    @Tenant('id') businessId: string,
    @Query() query: DashboardQueryDto,
  ) {
    const data = await this.dashboardService.getProductDistribution(businessId, query);
    return {
      success: true,
      data,
    };
  }

  @Get('charts/order-trend')
  @RequirePermissions('finance:read')
  async getOrderTrend(
    @Tenant('id') businessId: string,
    @Query() query: DashboardQueryDto,
  ) {
    const data = await this.dashboardService.getOrderTrend(businessId, query);
    return {
      success: true,
      data,
    };
  }

  @Get('charts/payment-trend')
  @RequirePermissions('finance:read')
  async getPaymentTrend(
    @Tenant('id') businessId: string,
    @Query() query: DashboardQueryDto,
  ) {
    const data = await this.dashboardService.getPaymentTrend(businessId, query);
    return {
      success: true,
      data,
    };
  }

  // ==========================================
  // WIDGETS ENDPOINTS
  // ==========================================

  @Get('widgets/recent-activity')
  @RequirePermissions('users:read')
  async getRecentActivity(
    @Tenant('id') businessId: string,
    @Query() query: DashboardQueryDto,
  ) {
    const data = await this.dashboardService.getRecentActivity(businessId, query);
    return {
      success: true,
      data,
    };
  }

  @Get('widgets/pending-tasks')
  @RequirePermissions('finance:read')
  async getPendingTasks(
    @Tenant('id') businessId: string,
  ) {
    const data = await this.dashboardService.getPendingTasks(businessId);
    return {
      success: true,
      data,
    };
  }

  @Get('widgets/notifications-summary')
  @RequirePermissions('users:read')
  async getNotificationsSummary(
    @Tenant('id') businessId: string,
  ) {
    const data = await this.dashboardService.getNotificationsSummary(businessId);
    return {
      success: true,
      data,
    };
  }

  @Get('widgets/today-summary')
  @RequirePermissions('finance:read')
  async getTodaySummary(
    @Tenant('id') businessId: string,
  ) {
    const data = await this.dashboardService.getTodaySummary(businessId);
    return {
      success: true,
      data,
    };
  }
}
