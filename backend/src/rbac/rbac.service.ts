import { Injectable, BadRequestException, NotFoundException, ConflictException, OnModuleInit } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { AppLogger } from '../common/logger/logger.service';
import { CreateUserDto, UpdateUserDto } from './dto/user.dto';
import { CreateRoleDto, UpdateRoleDto, CreatePermissionDto } from './dto/role.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class RbacService implements OnModuleInit {
  private readonly saltRounds = 10;

  constructor(
    private readonly db: DatabaseService,
    private readonly logger: AppLogger,
  ) {
    this.logger.setContext('RbacService');
  }

  /**
   * Seed standard system permissions during startup.
   */
  async onModuleInit() {
    this.logger.log('Starting System Permissions seeding...');
    const defaultPermissions = [
      // Users Management
      { name: 'users:read', description: 'View user list, search, and profiles', group: 'Users Management' },
      { name: 'users:write', description: 'Create and edit users', group: 'Users Management' },
      { name: 'users:delete', description: 'Deactivate and delete users', group: 'Users Management' },
      
      // Roles & Permissions
      { name: 'roles:read', description: 'View role profiles and permission mapping', group: 'Roles & Permissions' },
      { name: 'roles:write', description: 'Create, update, and edit roles and permission mappings', group: 'Roles & Permissions' },
      
      // Milk cooperative services
      { name: 'milk-collection:read', description: 'View dairy collections', group: 'Milk Cooperative Services' },
      { name: 'milk-collection:write', description: 'Record daily milk collection', group: 'Milk Cooperative Services' },
      { name: 'milk-sales:read', description: 'View bulk and retail milk sales', group: 'Milk Cooperative Services' },
      { name: 'milk-sales:write', description: 'Log milk transactions', group: 'Milk Cooperative Services' },
      
      // Rates
      { name: 'rates:read', description: 'View milk rate cards', group: 'Milk Cooperative Services' },
      { name: 'rates:write', description: 'Edit base rates, premium configurations', group: 'Milk Cooperative Services' },

      // Employees
      { name: 'employees:read', description: 'View staff details and payroll', group: 'Employees & HR' },
      { name: 'employees:write', description: 'Manage employee directories and pay scales', group: 'Employees & HR' },
      
      // Finance
      { name: 'finance:read', description: 'View ledgers, transactions, and settings', group: 'Financials & Billing' },
      { name: 'finance:write', description: 'Process invoices, expenses, payments', group: 'Financials & Billing' },
    ];

    try {
      for (const perm of defaultPermissions) {
        // Upsert to ensure we don't duplicate on restarts
        await this.db.permission.upsert({
          where: { name: perm.name },
          update: { description: perm.description },
          create: {
            name: perm.name,
            description: perm.description,
          },
        });
      }
      this.logger.log(`Successfully seeded ${defaultPermissions.length} core permissions.`);
    } catch (err: any) {
      this.logger.error(`Failed to seed default permissions: ${err.message}`);
    }
  }

  // ==========================================
  // USERS MANAGEMENT
  // ==========================================

  async listUsers(
    businessId: string,
    options: {
      search?: string;
      roleId?: string;
      status?: string; // 'active' | 'inactive'
      page?: number;
      limit?: number;
    },
  ) {
    const page = options.page || 1;
    const limit = options.limit || 10;
    const skip = (page - 1) * limit;

    const where: any = {
      businessId,
    };

    if (options.status) {
      if (options.status === 'active') {
        where.deletedAt = null;
      } else if (options.status === 'inactive') {
        where.deletedAt = { not: null };
      }
    }

    if (options.roleId) {
      where.userRoles = {
        some: {
          roleId: options.roleId,
        },
      };
    }

    if (options.search) {
      where.OR = [
        { name: { contains: options.search, mode: 'insensitive' } },
        { email: { contains: options.search, mode: 'insensitive' } },
      ];
    }

    const [users, total] = await Promise.all([
      this.db.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          userRoles: {
            include: {
              role: true,
            },
          },
        },
      }),
      this.db.user.count({ where }),
    ]);

    // Format for easier consumption on frontend
    const formattedUsers = users.map(user => {
      const activeRole = user.userRoles[0]?.role || null;
      return {
        id: user.id,
        name: user.name,
        email: user.email,
        isActive: !user.deletedAt,
        createdAt: user.createdAt,
        role: activeRole ? { id: activeRole.id, name: activeRole.name } : null,
      };
    });

    return {
      users: formattedUsers,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async createUser(businessId: string, dto: CreateUserDto, actorId: string) {
    // Check if email already registered system-wide (or inside this tenant depending on context)
    const existingUser = await this.db.user.findUnique({
      where: { email: dto.email.toLowerCase() },
    });

    if (existingUser) {
      throw new ConflictException(`Email address '${dto.email}' is already registered.`);
    }

    // Verify role exists and belongs to the business (or is global/shared)
    const role = await this.db.role.findFirst({
      where: {
        id: dto.roleId,
        OR: [
          { businessId },
          { businessId: null }, // Global/Shared Roles if any
        ],
      },
    });

    if (!role) {
      throw new NotFoundException(`Selected role is invalid or unauthorized.`);
    }

    const hashedPassword = await bcrypt.hash(dto.password, this.saltRounds);

    return await this.db.runInTransaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          name: dto.name,
          email: dto.email.toLowerCase(),
          passwordHash: hashedPassword,
          businessId,
        },
      });

      await tx.userRole.create({
        data: {
          userId: user.id,
          roleId: role.id,
        },
      });

      // Audit Logging
      await tx.auditLog.create({
        data: {
          businessId,
          userId: actorId,
          action: 'USER_CREATED',
          entityName: 'User',
          entityId: user.id,
          newValue: JSON.stringify({ name: user.name, email: user.email, role: role.name }),
        },
      });

      await tx.activityLog.create({
        data: {
          businessId,
          userId: actorId,
          type: 'USER_MANAGEMENT',
          description: `Created user account: ${user.name} (${role.name}).`,
        },
      });

      return {
        id: user.id,
        name: user.name,
        email: user.email,
        role: { id: role.id, name: role.name },
        isActive: true,
        createdAt: user.createdAt,
      };
    });
  }

  async updateUser(businessId: string, id: string, dto: UpdateUserDto, actorId: string) {
    const user = await this.db.user.findFirst({
      where: { id, businessId },
      include: {
        userRoles: {
          include: {
            role: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('User profile not found in this tenant context.');
    }

    const updateData: any = {};
    if (dto.name) updateData.name = dto.name;
    if (dto.email) {
      const emailLower = dto.email.toLowerCase();
      if (emailLower !== user.email) {
        const emailCheck = await this.db.user.findUnique({ where: { email: emailLower } });
        if (emailCheck) {
          throw new ConflictException(`Email address '${dto.email}' is already in use.`);
        }
        updateData.email = emailLower;
      }
    }
    if (dto.password) {
      updateData.passwordHash = await bcrypt.hash(dto.password, this.saltRounds);
    }

    // Handle Active / Inactive changes
    if (dto.isActive !== undefined) {
      if (dto.isActive) {
        updateData.deletedAt = null; // Activate
      } else {
        // Enforce guard: Prevent deactivating the last administrative user of this tenant
        const activeAdminsCount = await this.db.userRole.count({
          where: {
            role: { name: 'ADMIN', businessId },
            user: { deletedAt: null },
          },
        });

        const isUserAdmin = user.userRoles.some(ur => ur.role.name === 'ADMIN');
        if (isUserAdmin && activeAdminsCount <= 1 && !dto.isActive) {
          throw new BadRequestException('Security safeguard violated: Cannot deactivate the last remaining administrator.');
        }
        updateData.deletedAt = new Date(); // Soft delete/Deactivate
      }
    }

    return await this.db.runInTransaction(async (tx) => {
      const updatedUser = await tx.user.update({
        where: { id },
        data: updateData,
      });

      let updatedRole = user.userRoles[0]?.role || null;

      if (dto.roleId && (!user.userRoles[0] || user.userRoles[0].roleId !== dto.roleId)) {
        // Enforce guard: Cannot change own administrative role to something lower if they are last admin
        const activeAdminsCount = await this.db.userRole.count({
          where: {
            role: { name: 'ADMIN', businessId },
            user: { deletedAt: null },
          },
        });

        const wasAdmin = user.userRoles.some(ur => ur.role.name === 'ADMIN');
        if (wasAdmin && activeAdminsCount <= 1) {
          const targetRole = await tx.role.findFirst({ where: { id: dto.roleId, businessId } });
          if (targetRole && targetRole.name !== 'ADMIN') {
            throw new BadRequestException('Security safeguard: Cannot demote the last remaining administrator.');
          }
        }

        // Remove old roles
        await tx.userRole.deleteMany({
          where: { userId: id },
        });

        // Add new role
        const newRole = await tx.role.findFirst({
          where: {
            id: dto.roleId,
            OR: [
              { businessId },
              { businessId: null },
            ],
          },
        });

        if (!newRole) {
          throw new NotFoundException('Selected role does not exist.');
        }

        await tx.userRole.create({
          data: {
            userId: id,
            roleId: newRole.id,
          },
        });

        updatedRole = newRole;

        // Audit role change
        await tx.auditLog.create({
          data: {
            businessId,
            userId: actorId,
            action: 'USER_ROLE_CHANGED',
            entityName: 'UserRole',
            entityId: id,
            oldValue: user.userRoles[0]?.role?.name || 'NONE',
            newValue: newRole.name,
          },
        });
      }

      // Log update action
      await tx.auditLog.create({
        data: {
          businessId,
          userId: actorId,
          action: 'USER_UPDATED',
          entityName: 'User',
          entityId: id,
          oldValue: JSON.stringify({ name: user.name, email: user.email, isActive: !user.deletedAt }),
          newValue: JSON.stringify({ name: updatedUser.name, email: updatedUser.email, isActive: !updatedUser.deletedAt }),
        },
      });

      await tx.activityLog.create({
        data: {
          businessId,
          userId: actorId,
          type: 'USER_MANAGEMENT',
          description: `Updated profile properties for ${updatedUser.name}.`,
        },
      });

      return {
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        isActive: !updatedUser.deletedAt,
        role: updatedRole ? { id: updatedRole.id, name: updatedRole.name } : null,
      };
    });
  }

  async deleteUser(businessId: string, id: string, actorId: string) {
    const user = await this.db.user.findFirst({
      where: { id, businessId },
      include: {
        userRoles: {
          include: {
            role: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('User not found.');
    }

    // Safety checks
    if (user.id === actorId) {
      throw new BadRequestException('Suicide protection guard: You cannot delete your own session account.');
    }

    const isAdmin = user.userRoles.some(ur => ur.role.name === 'ADMIN');
    if (isAdmin) {
      const adminCount = await this.db.userRole.count({
        where: {
          role: { name: 'ADMIN', businessId },
          user: { deletedAt: null },
        },
      });
      if (adminCount <= 1) {
        throw new BadRequestException('Security safeguard: Cannot delete the last remaining administrator.');
      }
    }

    await this.db.runInTransaction(async (tx) => {
      // Soft-delete user
      await tx.user.update({
        where: { id },
        data: { deletedAt: new Date() },
      });

      // Audit Logs
      await tx.auditLog.create({
        data: {
          businessId,
          userId: actorId,
          action: 'USER_DELETED',
          entityName: 'User',
          entityId: id,
        },
      });

      await tx.activityLog.create({
        data: {
          businessId,
          userId: actorId,
          type: 'USER_MANAGEMENT',
          description: `Deactivated and archived user: ${user.name}.`,
        },
      });
    });

    return { success: true };
  }

  // ==========================================
  // ROLES & PERMISSIONS MANAGEMENT
  // ==========================================

  async listRoles(businessId: string) {
    return await this.db.role.findMany({
      where: {
        OR: [
          { businessId },
          { businessId: null }, // System global roles if any
        ],
      },
      orderBy: { name: 'asc' },
      include: {
        rolePermissions: {
          include: {
            permission: true,
          },
        },
        _count: {
          select: { userRoles: true },
        },
      },
    });
  }

  async listPermissions() {
    return await this.db.permission.findMany({
      orderBy: { name: 'asc' },
    });
  }

  async createRole(businessId: string, dto: CreateRoleDto, actorId: string) {
    const existing = await this.db.role.findFirst({
      where: {
        name: dto.name.toUpperCase(),
        businessId,
      },
    });

    if (existing) {
      throw new ConflictException(`A role named '${dto.name}' already exists in this cooperative.`);
    }

    return await this.db.runInTransaction(async (tx) => {
      const role = await tx.role.create({
        data: {
          name: dto.name.toUpperCase(),
          description: dto.description || '',
          businessId,
        },
      });

      // Assign requested permissions mapping
      if (dto.permissionIds && dto.permissionIds.length > 0) {
        for (const permId of dto.permissionIds) {
          await tx.rolePermission.create({
            data: {
              roleId: role.id,
              permissionId: permId,
            },
          });
        }
      }

      // Fetch newly created role with loaded permissions for auditing
      const fullRole = await tx.role.findUnique({
        where: { id: role.id },
        include: {
          rolePermissions: {
            include: {
              permission: true,
            },
          },
        },
      });

      // Audit Trail
      await tx.auditLog.create({
        data: {
          businessId,
          userId: actorId,
          action: 'ROLE_CREATED',
          entityName: 'Role',
          entityId: role.id,
          newValue: JSON.stringify({
            name: role.name,
            description: role.description,
            permissions: fullRole?.rolePermissions.map(rp => rp.permission.name) || [],
          }),
        },
      });

      await tx.activityLog.create({
        data: {
          businessId,
          userId: actorId,
          type: 'SECURITY_INTEGRITY',
          description: `Created new custom role: ${role.name}.`,
        },
      });

      return fullRole;
    });
  }

  async updateRole(businessId: string, id: string, dto: UpdateRoleDto, actorId: string) {
    const role = await this.db.role.findFirst({
      where: { id, businessId },
      include: {
        rolePermissions: {
          include: {
            permission: true,
          },
        },
      },
    });

    if (!role) {
      throw new NotFoundException('Role does not exist or is protected under system configs.');
    }

    // System guard: ADMIN role cannot be edited or renamed to keep credentials intact
    if (role.name === 'ADMIN') {
      throw new BadRequestException('Security protection: The sovereign ADMIN role cannot be modified or deleted.');
    }

    const updateData: any = {};
    if (dto.name) {
      const nameUpper = dto.name.toUpperCase();
      if (nameUpper !== role.name) {
        const check = await this.db.role.findFirst({ where: { name: nameUpper, businessId } });
        if (check) {
          throw new ConflictException(`Role with name '${dto.name}' already exists.`);
        }
        updateData.name = nameUpper;
      }
    }
    if (dto.description !== undefined) {
      updateData.description = dto.description;
    }

    return await this.db.runInTransaction(async (tx) => {
      const updated = await tx.role.update({
        where: { id },
        data: updateData,
      });

      if (dto.permissionIds !== undefined) {
        // Clear previous mapped mappings
        await tx.rolePermission.deleteMany({
          where: { roleId: id },
        });

        // Add new mapped permissions
        for (const permId of dto.permissionIds) {
          await tx.rolePermission.create({
            data: {
              roleId: id,
              permissionId: permId,
            },
          });
        }
      }

      const fullUpdated = await tx.role.findUnique({
        where: { id },
        include: {
          rolePermissions: {
            include: {
              permission: true,
            },
          },
        },
      });

      // Audit logs
      await tx.auditLog.create({
        data: {
          businessId,
          userId: actorId,
          action: 'ROLE_UPDATED',
          entityName: 'Role',
          entityId: id,
          oldValue: JSON.stringify({
            name: role.name,
            description: role.description,
            permissions: role.rolePermissions.map(rp => rp.permission.name),
          }),
          newValue: JSON.stringify({
            name: fullUpdated?.name,
            description: fullUpdated?.description,
            permissions: fullUpdated?.rolePermissions.map(rp => rp.permission.name) || [],
          }),
        },
      });

      await tx.activityLog.create({
        data: {
          businessId,
          userId: actorId,
          type: 'SECURITY_INTEGRITY',
          description: `Updated role permissions mapping for: ${updated.name}.`,
        },
      });

      return fullUpdated;
    });
  }

  async deleteRole(businessId: string, id: string, actorId: string) {
    const role = await this.db.role.findFirst({
      where: { id, businessId },
    });

    if (!role) {
      throw new NotFoundException('Role does not exist or is protected under global system config.');
    }

    if (role.name === 'ADMIN') {
      throw new BadRequestException('Security safeguard: Sovereign ADMIN role cannot be deleted.');
    }

    // Safety: check if role is currently assigned to active users
    const usersCount = await this.db.userRole.count({
      where: { roleId: id },
    });

    if (usersCount > 0) {
      throw new BadRequestException(`Role cannot be deleted while assigned to ${usersCount} active users.`);
    }

    await this.db.runInTransaction(async (tx) => {
      // Cascade delete relations
      await tx.rolePermission.deleteMany({ where: { roleId: id } });
      await tx.role.delete({ where: { id } });

      // Auditing
      await tx.auditLog.create({
        data: {
          businessId,
          userId: actorId,
          action: 'ROLE_DELETED',
          entityName: 'Role',
          entityId: id,
        },
      });

      await tx.activityLog.create({
        data: {
          businessId,
          userId: actorId,
          type: 'SECURITY_INTEGRITY',
          description: `Permanently removed custom role: ${role.name}.`,
        },
      });
    });

    return { success: true };
  }
}
