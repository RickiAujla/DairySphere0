import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { RbacService } from './rbac.service';
import { CreateUserDto, UpdateUserDto } from './dto/user.dto';
import { CreateRoleDto, UpdateRoleDto } from './dto/role.dto';
import { TenantGuard } from '../business/guards/tenant.guard';
import { PermissionsGuard } from './guards/permissions.guard';
import { Tenant } from '../business/decorators/tenant.decorator';
import { RequirePermissions } from './decorators/permissions.decorator';
import { Request } from 'express';

@Controller('api/rbac')
@UseGuards(TenantGuard, PermissionsGuard)
export class RbacController {
  constructor(private readonly rbacService: RbacService) {}

  // ==========================================
  // USERS ENDPOINTS
  // ==========================================

  @Get('users')
  @RequirePermissions('users:read')
  async getUsers(
    @Tenant('id') businessId: string,
    @Query('search') search?: string,
    @Query('roleId') roleId?: string,
    @Query('status') status?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const data = await this.rbacService.listUsers(businessId, {
      search,
      roleId,
      status,
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
    });
    return {
      success: true,
      data,
    };
  }

  @Post('users')
  @RequirePermissions('users:write')
  @HttpCode(HttpStatus.CREATED)
  async createUser(
    @Tenant('id') businessId: string,
    @Body() dto: CreateUserDto,
    @Req() req: Request,
  ) {
    const actorId = req.user?.userId || 'system-admin';
    const data = await this.rbacService.createUser(businessId, dto, actorId);
    return {
      success: true,
      message: 'Cooperative user profile provisioned successfully.',
      data,
    };
  }

  @Put('users/:id')
  @RequirePermissions('users:write')
  async updateUser(
    @Tenant('id') businessId: string,
    @Param('id') id: string,
    @Body() dto: UpdateUserDto,
    @Req() req: Request,
  ) {
    const actorId = req.user?.userId || 'system-admin';
    const data = await this.rbacService.updateUser(businessId, id, dto, actorId);
    return {
      success: true,
      message: 'User credentials and configurations updated.',
      data,
    };
  }

  @Delete('users/:id')
  @RequirePermissions('users:delete')
  async deleteUser(
    @Tenant('id') businessId: string,
    @Param('id') id: string,
    @Req() req: Request,
  ) {
    const actorId = req.user?.userId || 'system-admin';
    await this.rbacService.deleteUser(businessId, id, actorId);
    return {
      success: true,
      message: 'User account successfully deactivated.',
    };
  }

  // ==========================================
  // ROLES & PERMISSIONS ENDPOINTS
  // ==========================================

  @Get('roles')
  @RequirePermissions('roles:read')
  async getRoles(@Tenant('id') businessId: string) {
    const data = await this.rbacService.listRoles(businessId);
    return {
      success: true,
      data,
    };
  }

  @Post('roles')
  @RequirePermissions('roles:write')
  @HttpCode(HttpStatus.CREATED)
  async createRole(
    @Tenant('id') businessId: string,
    @Body() dto: CreateRoleDto,
    @Req() req: Request,
  ) {
    const actorId = req.user?.userId || 'system-admin';
    const data = await this.rbacService.createRole(businessId, dto, actorId);
    return {
      success: true,
      message: 'Custom role created with specified permission vectors.',
      data,
    };
  }

  @Put('roles/:id')
  @RequirePermissions('roles:write')
  async updateRole(
    @Tenant('id') businessId: string,
    @Param('id') id: string,
    @Body() dto: UpdateRoleDto,
    @Req() req: Request,
  ) {
    const actorId = req.user?.userId || 'system-admin';
    const data = await this.rbacService.updateRole(businessId, id, dto, actorId);
    return {
      success: true,
      message: 'Role permissions refreshed and synchronized.',
      data,
    };
  }

  @Delete('roles/:id')
  @RequirePermissions('roles:write')
  async deleteRole(
    @Tenant('id') businessId: string,
    @Param('id') id: string,
    @Req() req: Request,
  ) {
    const actorId = req.user?.userId || 'system-admin';
    await this.rbacService.deleteRole(businessId, id, actorId);
    return {
      success: true,
      message: 'Custom role permanently deleted from records.',
    };
  }

  @Get('permissions')
  @RequirePermissions('roles:read')
  async getPermissions() {
    const data = await this.rbacService.listPermissions();
    return {
      success: true,
      data,
    };
  }
}
