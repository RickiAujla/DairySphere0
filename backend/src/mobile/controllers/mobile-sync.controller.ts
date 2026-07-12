import { Controller, Post, Body, UseGuards, Req, HttpCode, HttpStatus } from '@nestjs/common';
import { MobileSyncService } from '../services/mobile-sync.service';
import { SyncRequestDto } from '../dto/mobile.dto';
import { TenantGuard } from '../../business/guards/tenant.guard';
import { Tenant } from '../../business/decorators/tenant.decorator';
import { Request } from 'express';

@Controller('api/v1/mobile/sync')
@UseGuards(TenantGuard)
export class MobileSyncController {
  constructor(private readonly syncService: MobileSyncService) {}

  @Post()
  @HttpCode(HttpStatus.OK)
  async synchronize(
    @Tenant('id') businessId: string,
    @Req() req: Request,
    @Body() dto: SyncRequestDto,
  ) {
    const userId = req.user?.userId || 'system-admin';
    return await this.syncService.synchronize(businessId, userId, dto);
  }
}
