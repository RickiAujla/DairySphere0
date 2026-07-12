import { Controller, Post, Body, UseGuards, Req, HttpCode, HttpStatus, Get } from '@nestjs/common';
import { MobileAuthService } from '../services/mobile-auth.service';
import { MobileLoginDto, MobileRefreshTokenDto, DeviceRegisterDto } from '../dto/mobile.dto';
import { TenantGuard } from '../../business/guards/tenant.guard';
import { BypassTenant, Tenant } from '../../business/decorators/tenant.decorator';
import { Request } from 'express';

@Controller('api/v1/mobile/auth')
@UseGuards(TenantGuard)
export class MobileAuthController {
  constructor(private readonly authService: MobileAuthService) {}

  @Post('login')
  @BypassTenant()
  @HttpCode(HttpStatus.OK)
  async login(@Body() dto: MobileLoginDto) {
    return await this.authService.login(dto);
  }

  @Post('refresh')
  @BypassTenant()
  @HttpCode(HttpStatus.OK)
  async refresh(@Body() dto: MobileRefreshTokenDto) {
    return await this.authService.refresh(dto);
  }

  @Post('logout')
  @BypassTenant()
  @HttpCode(HttpStatus.OK)
  async logout(@Body() dto: MobileRefreshTokenDto) {
    return await this.authService.logout(dto.refreshToken);
  }

  @Post('device')
  @HttpCode(HttpStatus.CREATED)
  async registerDevice(
    @Tenant('id') businessId: string,
    @Req() req: Request,
    @Body() dto: DeviceRegisterDto,
  ) {
    const userId = req.user?.userId || 'system-admin';
    return await this.authService.registerDevice(businessId, userId, dto);
  }

  @Get('devices')
  async listDevices(@Tenant('id') businessId: string) {
    const data = await this.authService.listDevices(businessId);
    return { success: true, data };
  }
}
