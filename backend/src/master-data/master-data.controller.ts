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
import { MasterDataService } from './master-data.service';
import { 
  CreateProductCategoryDto, 
  UpdateProductCategoryDto, 
  CreateRouteDto, 
  UpdateRouteDto,
  UpdateMasterSettingsDto
} from './dto/master-data.dto';
import { TenantGuard } from '../business/guards/tenant.guard';
import { Tenant } from '../business/decorators/tenant.decorator';
import { Request } from 'express';

@Controller('api/master-data')
@UseGuards(TenantGuard)
export class MasterDataController {
  constructor(private readonly masterDataService: MasterDataService) {}

  // ==========================================
  // PRODUCT CATEGORIES
  // ==========================================

  @Get('categories')
  async getCategories(
    @Tenant('id') businessId: string,
    @Query('search') search?: string,
  ) {
    const data = await this.masterDataService.getCategories(businessId, search);
    return { success: true, data };
  }

  @Get('categories/:id')
  async getCategory(
    @Tenant('id') businessId: string,
    @Param('id') id: string,
  ) {
    const data = await this.masterDataService.getCategory(businessId, id);
    return { success: true, data };
  }

  @Post('categories')
  @HttpCode(HttpStatus.CREATED)
  async createCategory(
    @Tenant('id') businessId: string,
    @Body() dto: CreateProductCategoryDto,
    @Req() req: Request,
  ) {
    const userId = req.user?.userId || 'system-admin';
    const data = await this.masterDataService.createCategory(businessId, dto, userId);
    return { success: true, message: 'Product category created successfully.', data };
  }

  @Put('categories/:id')
  async updateCategory(
    @Tenant('id') businessId: string,
    @Param('id') id: string,
    @Body() dto: UpdateProductCategoryDto,
    @Req() req: Request,
  ) {
    const userId = req.user?.userId || 'system-admin';
    const data = await this.masterDataService.updateCategory(businessId, id, dto, userId);
    return { success: true, message: 'Product category updated successfully.', data };
  }

  @Delete('categories/:id')
  async deleteCategory(
    @Tenant('id') businessId: string,
    @Param('id') id: string,
    @Req() req: Request,
  ) {
    const userId = req.user?.userId || 'system-admin';
    const data = await this.masterDataService.deleteCategory(businessId, id, userId);
    return { success: true, message: 'Product category deleted successfully.', data };
  }

  @Post('categories/import')
  async importCategories(
    @Tenant('id') businessId: string,
    @Body('items') items: any[],
    @Req() req: Request,
  ) {
    const userId = req.user?.userId || 'system-admin';
    if (!Array.isArray(items)) {
      throw new Error('Items must be a JSON array of category records.');
    }
    const result = await this.masterDataService.importCategories(businessId, items, userId);
    return { success: true, message: 'Product categories imported successfully.', data: result };
  }

  // ==========================================
  // DELIVERY ROUTES
  // ==========================================

  @Get('routes')
  async getRoutes(
    @Tenant('id') businessId: string,
    @Query('search') search?: string,
  ) {
    const data = await this.masterDataService.getRoutes(businessId, search);
    return { success: true, data };
  }

  @Get('routes/:id')
  async getRoute(
    @Tenant('id') businessId: string,
    @Param('id') id: string,
  ) {
    const data = await this.masterDataService.getRoute(businessId, id);
    return { success: true, data };
  }

  @Post('routes')
  @HttpCode(HttpStatus.CREATED)
  async createRoute(
    @Tenant('id') businessId: string,
    @Body() dto: CreateRouteDto,
    @Req() req: Request,
  ) {
    const userId = req.user?.userId || 'system-admin';
    const data = await this.masterDataService.createRoute(businessId, dto, userId);
    return { success: true, message: 'Delivery route created successfully.', data };
  }

  @Put('routes/:id')
  async updateRoute(
    @Tenant('id') businessId: string,
    @Param('id') id: string,
    @Body() dto: UpdateRouteDto,
    @Req() req: Request,
  ) {
    const userId = req.user?.userId || 'system-admin';
    const data = await this.masterDataService.updateRoute(businessId, id, dto, userId);
    return { success: true, message: 'Delivery route updated successfully.', data };
  }

  @Delete('routes/:id')
  async deleteRoute(
    @Tenant('id') businessId: string,
    @Param('id') id: string,
    @Req() req: Request,
  ) {
    const userId = req.user?.userId || 'system-admin';
    const data = await this.masterDataService.deleteRoute(businessId, id, userId);
    return { success: true, message: 'Delivery route deleted successfully.', data };
  }

  @Post('routes/import')
  async importRoutes(
    @Tenant('id') businessId: string,
    @Body('items') items: any[],
    @Req() req: Request,
  ) {
    const userId = req.user?.userId || 'system-admin';
    if (!Array.isArray(items)) {
      throw new Error('Items must be a JSON array of route records.');
    }
    const result = await this.masterDataService.importRoutes(businessId, items, userId);
    return { success: true, message: 'Delivery routes imported successfully.', data: result };
  }

  // ==========================================
  // CONFIGURATIONS & MASTER REGISTER SETTINGS
  // ==========================================

  @Get('settings')
  async getMasterSettings(@Tenant('id') businessId: string) {
    const settings = await this.masterDataService.getMasterSettings(businessId);
    return { success: true, data: settings };
  }

  @Put('settings')
  async updateMasterSettings(
    @Tenant('id') businessId: string,
    @Body() dto: UpdateMasterSettingsDto,
    @Req() req: Request,
  ) {
    const userId = req.user?.userId || 'system-admin';
    const settings = await this.masterDataService.updateMasterSettings(businessId, dto, userId);
    return { success: true, message: 'Master registers updated successfully.', data: settings };
  }
}
