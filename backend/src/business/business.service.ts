import { Injectable, BadRequestException, UnauthorizedException, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { AppLogger } from '../common/logger/logger.service';
import { CreateBusinessDto, LoginDto } from './dto/create-business.dto';
import { UpdateBusinessDto } from './dto/update-business.dto';
import { UpdateSettingsDto, UpdatePreferencesDto } from './dto/business-settings.dto';
import * as bcrypt from 'bcrypt';
import * as jwt from 'jsonwebtoken';

@Injectable()
export class BusinessService {
  private readonly jwtSecret: string;
  private readonly saltRounds = 10;

  constructor(
    private readonly db: DatabaseService,
    private readonly logger: AppLogger,
  ) {
    this.logger.setContext('BusinessService');
    this.jwtSecret = process.env.JWT_SECRET || 'dairysphere_fallback_secret_key_change_me_in_prod';
  }

  /**
   * Registers a brand-new multi-tenant business, initializes its admin user,
   * configures default settings, logs the event, and returns a session JWT.
   */
  async register(dto: CreateBusinessDto) {
    const existingBusiness = await this.db.business.findUnique({
      where: { slug: dto.slug.toLowerCase() },
    });

    if (existingBusiness) {
      throw new BadRequestException(`Business slug '${dto.slug}' is already taken. Please try another.`);
    }

    const existingUser = await this.db.user.findUnique({
      where: { email: dto.adminEmail.toLowerCase() },
    });

    if (existingUser) {
      throw new BadRequestException(`Email '${dto.adminEmail}' is already registered in the system.`);
    }

    // Hash the password securely
    const hashedPassword = await bcrypt.hash(dto.adminPassword, this.saltRounds);

    return await this.db.runInTransaction(async (tx) => {
      // 1. Create the Business
      const business = await tx.business.create({
        data: {
          name: dto.name,
          slug: dto.slug.toLowerCase(),
        },
      });

      // 2. Create the Admin User
      const user = await tx.user.create({
        data: {
          name: dto.adminName,
          email: dto.adminEmail.toLowerCase(),
          passwordHash: hashedPassword,
          businessId: business.id,
        },
      });

      // 3. Create or resolve the default ADMIN Role for the tenant
      const role = await tx.role.create({
        data: {
          name: 'ADMIN',
          description: 'Sovereign Administrator of the Business tenant',
          businessId: business.id,
        },
      });

      // 4. Map the User to the ADMIN Role
      await tx.userRole.create({
        data: {
          userId: user.id,
          roleId: role.id,
        },
      });

      // 5. Create Default Tenant Settings
      const defaultSettings = [
        { key: 'currency', value: 'INR' },
        { key: 'theme', value: 'light' },
        { key: 'language', value: 'en' },
        { key: 'timezone', value: 'Asia/Kolkata' },
        { key: 'subscription_plan', value: 'ENTERPRISE_GROWTH' },
        { key: 'tax_rate_percent', value: '0.00' },
      ];

      for (const setting of defaultSettings) {
        await tx.setting.create({
          data: {
            businessId: business.id,
            key: setting.key,
            value: setting.value,
          },
        });
      }

      // 6. Create matching Employee Record for administrative personnel tracking
      await tx.employee.create({
        data: {
          businessId: business.id,
          userId: user.id,
          firstName: dto.adminName.split(' ')[0] || dto.adminName,
          lastName: dto.adminName.split(' ').slice(1).join(' ') || 'Administrator',
          phone: '0000000000', // Default placeholder to pass DB validation
          roleName: 'Sovereign Administrator',
          salaryAmount: 0.00,
          hireDate: new Date(),
          isActive: true,
        },
      });

      // 7. Log Audit Event for transparency
      await tx.auditLog.create({
        data: {
          businessId: business.id,
          userId: user.id,
          action: 'BUSINESS_REGISTERED',
          entityName: 'Business',
          entityId: business.id,
          newValue: JSON.stringify({ name: business.name, slug: business.slug, adminEmail: user.email }),
        },
      });

      // 8. Log High-Level User Activity Feed
      await tx.activityLog.create({
        data: {
          businessId: business.id,
          userId: user.id,
          type: 'SYSTEM',
          description: `Registered business tenant ${business.name} (${business.slug}) with admin ${user.name}.`,
        },
      });

      // 9. Generate Authentication JWT
      const token = jwt.sign(
        {
          userId: user.id,
          email: user.email,
          name: user.name,
          businessId: business.id,
          businessSlug: business.slug,
          role: 'ADMIN',
        },
        this.jwtSecret,
        { expiresIn: '24h' },
      );

      return {
        business: {
          id: business.id,
          name: business.name,
          slug: business.slug,
          createdAt: business.createdAt,
        },
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
        },
        token,
      };
    });
  }

  /**
   * Authenticates an administrative user, verifies credentials, checks multi-tenant state,
   * and yields a fresh bearer session token.
   */
  async login(dto: LoginDto) {
    const user = await this.db.user.findUnique({
      where: { email: dto.email.toLowerCase() },
      include: {
        business: true,
        userRoles: {
          include: {
            role: true,
          },
        },
      },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid email or password combination.');
    }

    const isPasswordValid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid email or password combination.');
    }

    if (user.business.deletedAt) {
      throw new UnauthorizedException('This business tenant account has been suspended or deleted.');
    }

    const roleName = user.userRoles[0]?.role?.name || 'USER';

    // Generate token
    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        name: user.name,
        businessId: user.business.id,
        businessSlug: user.business.slug,
        role: roleName,
      },
      this.jwtSecret,
      { expiresIn: '24h' },
    );

    // Audit login activity
    await this.db.auditLog.create({
      data: {
        businessId: user.businessId,
        userId: user.id,
        action: 'USER_LOGIN',
        entityName: 'User',
        entityId: user.id,
      },
    });

    await this.db.activityLog.create({
      data: {
        businessId: user.businessId,
        userId: user.id,
        type: 'AUTHENTICATION',
        description: `User ${user.name} logged in successfully.`,
      },
    });

    return {
      business: {
        id: user.business.id,
        name: user.business.name,
        slug: user.business.slug,
      },
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: roleName,
      },
      token,
    };
  }

  /**
   * Retrieves the comprehensive business profile by tenant ID.
   */
  async getProfile(businessId: string) {
    const business = await this.db.business.findUnique({
      where: { id: businessId },
    });

    if (!business) {
      throw new NotFoundException('Business profile not found.');
    }

    return business;
  }

  /**
   * Updates core business details like business name.
   */
  async updateProfile(businessId: string, dto: UpdateBusinessDto, userId: string) {
    const business = await this.getProfile(businessId);

    const updated = await this.db.business.update({
      where: { id: businessId },
      data: {
        name: dto.name || business.name,
      },
    });

    // Save customized profile properties like logos directly inside Settings for durability
    if (dto.logoUrl) {
      await this.db.setting.upsert({
        where: {
          businessId_key: {
            businessId,
            key: 'logo_url',
          },
        },
        create: {
          businessId,
          key: 'logo_url',
          value: dto.logoUrl,
        },
        update: {
          value: dto.logoUrl,
        },
      });
    }

    // Log the operation
    await this.db.auditLog.create({
      data: {
        businessId,
        userId,
        action: 'BUSINESS_PROFILE_UPDATED',
        entityName: 'Business',
        entityId: businessId,
        oldValue: JSON.stringify({ name: business.name }),
        newValue: JSON.stringify({ name: updated.name, logoUrl: dto.logoUrl }),
      },
    });

    await this.db.activityLog.create({
      data: {
        businessId,
        userId,
        type: 'MANAGEMENT',
        description: `Updated business profile details for ${updated.name}.`,
      },
    });

    return updated;
  }

  /**
   * Retrieves all Key-Value settings configured for a given business tenant.
   */
  async getSettings(businessId: string) {
    const settings = await this.db.setting.findMany({
      where: { businessId },
    });

    // Format array of records into a clean client-friendly Key-Value JSON object
    const settingsMap: Record<string, string> = {};
    for (const record of settings) {
      settingsMap[record.key] = record.value;
    }

    return settingsMap;
  }

  /**
   * Bulk updates settings for a business tenant using multi-record database transactions.
   */
  async updateSettings(businessId: string, dto: UpdateSettingsDto, userId: string) {
    const oldSettings = await this.getSettings(businessId);

    await this.db.runInTransaction(async (tx) => {
      for (const [key, value] of Object.entries(dto.settings)) {
        await tx.setting.upsert({
          where: {
            businessId_key: {
              businessId,
              key,
            },
          },
          create: {
            businessId,
            key,
            value: String(value),
          },
          update: {
            value: String(value),
          },
        });
      }
    });

    const newSettings = await this.getSettings(businessId);

    // Audit Trail
    await this.db.auditLog.create({
      data: {
        businessId,
        userId,
        action: 'BUSINESS_SETTINGS_UPDATED',
        entityName: 'Setting',
        oldValue: JSON.stringify(oldSettings),
        newValue: JSON.stringify(newSettings),
      },
    });

    await this.db.activityLog.create({
      data: {
        businessId,
        userId,
        type: 'MANAGEMENT',
        description: 'Updated system-level settings and business configurations.',
      },
    });

    return newSettings;
  }

  /**
   * Specifically saves regional or UI preferences (theme, language, currency) for the tenant.
   */
  async updatePreferences(businessId: string, dto: UpdatePreferencesDto, userId: string) {
    await this.db.runInTransaction(async (tx) => {
      const preferences = [
        { key: 'theme', value: dto.theme },
        { key: 'currency', value: dto.currency },
        { key: 'language', value: dto.language },
        ...(dto.timezone ? [{ key: 'timezone', value: dto.timezone }] : []),
      ];

      for (const pref of preferences) {
        await tx.setting.upsert({
          where: {
            businessId_key: {
              businessId,
              key: pref.key,
            },
          },
          create: {
            businessId,
            key: pref.key,
            value: pref.value,
          },
          update: {
            value: pref.value,
          },
        });
      }
    });

    const currentPreferences = await this.getSettings(businessId);

    await this.db.activityLog.create({
      data: {
        businessId,
        userId,
        type: 'MANAGEMENT',
        description: `Updated regional preferences: Theme: ${dto.theme}, Currency: ${dto.currency}, Language: ${dto.language}.`,
      },
    });

    return {
      theme: currentPreferences['theme'],
      currency: currentPreferences['currency'],
      language: currentPreferences['language'],
      timezone: currentPreferences['timezone'],
    };
  }

  /**
   * Fetches the complete sequence of audit trails associated with a business.
   */
  async getAuditLogs(businessId: string) {
    return await this.db.auditLog.findMany({
      where: { businessId },
      orderBy: { createdAt: 'desc' },
      take: 100, // Safe page limit
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });
  }

  /**
   * Fetches high-level activity feeds for user-facing audit UI.
   */
  async getActivityLogs(businessId: string) {
    return await this.db.activityLog.findMany({
      where: { businessId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }
}
