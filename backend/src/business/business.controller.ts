import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  UseGuards,
  Req,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { BusinessService } from './business.service';
import { CreateBusinessDto, LoginDto } from './dto/create-business.dto';
import { UpdateBusinessDto } from './dto/update-business.dto';
import { UpdateSettingsDto, UpdatePreferencesDto } from './dto/business-settings.dto';
import { TenantGuard } from './guards/tenant.guard';
import { BypassTenant, Tenant } from './decorators/tenant.decorator';
import { Request } from 'express';

@Controller('api/business')
@UseGuards(TenantGuard)
export class BusinessController {
  constructor(private readonly businessService: BusinessService) {}

  @Post('register')
  @BypassTenant()
  @HttpCode(HttpStatus.CREATED)
  async register(@Body() dto: CreateBusinessDto) {
    const data = await this.businessService.register(dto);
    return {
      success: true,
      message: 'Business tenant registered successfully and initialized.',
      data,
    };
  }

  @Post('login')
  @BypassTenant()
  @HttpCode(HttpStatus.OK)
  async login(@Body() dto: LoginDto) {
    const data = await this.businessService.login(dto);
    return {
      success: true,
      message: 'Logged in successfully.',
      data,
    };
  }

  @Get('profile')
  async getProfile(@Tenant() business: any) {
    return {
      success: true,
      data: business,
    };
  }

  @Put('profile')
  async updateProfile(
    @Tenant('id') businessId: string,
    @Body() dto: UpdateBusinessDto,
    @Req() req: Request,
  ) {
    const userId = req.user?.userId || 'system-admin';
    const data = await this.businessService.updateProfile(businessId, dto, userId);
    return {
      success: true,
      message: 'Business profile updated successfully.',
      data,
    };
  }

  @Get('settings')
  async getSettings(@Tenant('id') businessId: string) {
    const data = await this.businessService.getSettings(businessId);
    return {
      success: true,
      data,
    };
  }

  @Put('settings')
  async updateSettings(
    @Tenant('id') businessId: string,
    @Body() dto: UpdateSettingsDto,
    @Req() req: Request,
  ) {
    const userId = req.user?.userId || 'system-admin';
    const data = await this.businessService.updateSettings(businessId, dto, userId);
    return {
      success: true,
      message: 'Business configurations updated successfully.',
      data,
    };
  }

  @Put('preferences')
  async updatePreferences(
    @Tenant('id') businessId: string,
    @Body() dto: UpdatePreferencesDto,
    @Req() req: Request,
  ) {
    const userId = req.user?.userId || 'system-admin';
    const data = await this.businessService.updatePreferences(businessId, dto, userId);
    return {
      success: true,
      message: 'Regional preferences updated successfully.',
      data,
    };
  }

  @Get('audit-logs')
  async getAuditLogs(@Tenant('id') businessId: string) {
    const data = await this.businessService.getAuditLogs(businessId);
    return {
      success: true,
      data,
    };
  }

  @Get('activity-logs')
  async getActivityLogs(@Tenant('id') businessId: string) {
    const data = await this.businessService.getActivityLogs(businessId);
    return {
      success: true,
      data,
    };
  }
}
