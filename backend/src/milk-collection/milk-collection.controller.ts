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
  HttpStatus 
} from '@nestjs/common';
import { MilkCollectionService } from './milk-collection.service';
import { CreateMilkCollectionDto, UpdateMilkCollectionDto, MilkType, Shift } from './dto/milk-collection.dto';
import { TenantGuard } from '../business/guards/tenant.guard';
import { Tenant } from '../business/decorators/tenant.decorator';
import { Request } from 'express';

@Controller('api/milk-collection')
@UseGuards(TenantGuard)
export class MilkCollectionController {
  constructor(private readonly milkCollectionService: MilkCollectionService) {}

  @Get('collections')
  async getCollections(
    @Tenant('id') businessId: string,
    @Query('search') search?: string,
    @Query('shift') shift?: Shift,
    @Query('milkType') milkType?: MilkType,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('farmerId') farmerId?: string,
  ) {
    const data = await this.milkCollectionService.getCollections(businessId, {
      search,
      shift,
      milkType,
      startDate,
      endDate,
      farmerId,
    });
    return { success: true, data };
  }

  @Post('collections')
  @HttpCode(HttpStatus.CREATED)
  async createCollection(
    @Tenant('id') businessId: string,
    @Body() dto: CreateMilkCollectionDto,
    @Req() req: any,
  ) {
    const userId = req.user?.userId || 'system-admin';
    const data = await this.milkCollectionService.createCollection(businessId, dto, userId);
    return { success: true, message: 'Milk collection log registered successfully.', data };
  }

  @Put('collections/:id')
  async updateCollection(
    @Tenant('id') businessId: string,
    @Param('id') id: string,
    @Body() dto: UpdateMilkCollectionDto,
    @Req() req: any,
  ) {
    const userId = req.user?.userId || 'system-admin';
    const data = await this.milkCollectionService.updateCollection(businessId, id, dto, userId);
    return { success: true, message: 'Milk collection log updated successfully.', data };
  }

  @Delete('collections/:id')
  async deleteCollection(
    @Tenant('id') businessId: string,
    @Param('id') id: string,
    @Req() req: any,
  ) {
    const userId = req.user?.userId || 'system-admin';
    const data = await this.milkCollectionService.deleteCollection(businessId, id, userId);
    return { success: true, message: 'Milk collection log deleted successfully.', data };
  }

  @Get('analytics')
  async getAnalytics(
    @Tenant('id') businessId: string,
    @Query('days') days?: string,
  ) {
    const totalDays = days ? parseInt(days, 10) : 30;
    const data = await this.milkCollectionService.getAnalytics(businessId, totalDays);
    return { success: true, data };
  }
}
