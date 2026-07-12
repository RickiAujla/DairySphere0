import { Controller, Get, Post, Body, Query, UseGuards } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { AnalyticsQueryDto, ScheduleReportDto } from './dto/analytics-query.dto';
import { TenantGuard } from '../business/guards/tenant.guard';
import { PermissionsGuard } from '../rbac/guards/permissions.guard';
import { Tenant } from '../business/decorators/tenant.decorator';
import { RequirePermissions } from '../rbac/decorators/permissions.decorator';

@Controller('api/analytics')
@UseGuards(TenantGuard, PermissionsGuard)
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('summary')
  @RequirePermissions('finance:read')
  async getExecutiveSummary(
    @Tenant('id') businessId: string,
    @Query() query: AnalyticsQueryDto,
  ) {
    const data = await this.analyticsService.getExecutiveSummary(businessId, query);
    return {
      success: true,
      data,
    };
  }

  @Get('trends')
  @RequirePermissions('finance:read')
  async getTrends(
    @Tenant('id') businessId: string,
    @Query() query: AnalyticsQueryDto,
  ) {
    const data = await this.analyticsService.getTrends(businessId, query);
    return {
      success: true,
      data,
    };
  }

  @Get('forecast')
  @RequirePermissions('finance:read')
  async getForecast(
    @Tenant('id') businessId: string,
    @Query() query: AnalyticsQueryDto,
  ) {
    const data = await this.analyticsService.getForecast(businessId, query);
    return {
      success: true,
      data,
    };
  }

  @Get('comparison')
  @RequirePermissions('finance:read')
  async getComparison(
    @Tenant('id') businessId: string,
    @Query() query: AnalyticsQueryDto,
  ) {
    const data = await this.analyticsService.getComparison(businessId, query);
    return {
      success: true,
      data,
    };
  }

  @Get('heatmap')
  @RequirePermissions('finance:read')
  async getHeatmap(
    @Tenant('id') businessId: string,
  ) {
    const data = await this.analyticsService.getHeatmap(businessId);
    return {
      success: true,
      data,
    };
  }

  @Post('schedule')
  @RequirePermissions('finance:write')
  async scheduleReport(
    @Tenant('id') businessId: string,
    @Body() dto: ScheduleReportDto,
  ) {
    return this.analyticsService.scheduleReport(businessId, dto);
  }

  @Get('schedule')
  @RequirePermissions('finance:read')
  async getScheduledReports(
    @Tenant('id') businessId: string,
  ) {
    const data = await this.analyticsService.getScheduledReports(businessId);
    return {
      success: true,
      data,
    };
  }
}
