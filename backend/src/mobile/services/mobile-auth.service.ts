import { Injectable, UnauthorizedException, BadRequestException, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';
import { AppLogger } from '../../common/logger/logger.service';
import { MobileLoginDto, MobileRefreshTokenDto, DeviceRegisterDto, MobileDeviceType } from '../dto/mobile.dto';
import * as bcrypt from 'bcrypt';
import * as jwt from 'jsonwebtoken';
import * as crypto from 'crypto';

@Injectable()
export class MobileAuthService {
  private readonly jwtSecret: string;
  private readonly saltRounds = 10;

  constructor(
    private readonly db: DatabaseService,
    private readonly logger: AppLogger,
  ) {
    this.logger.setContext('MobileAuthService');
    this.jwtSecret = process.env.JWT_SECRET || 'dairysphere_fallback_secret_key_change_me_in_prod';
  }

  /**
   * Performs authentication for mobile clients and issues dual tokens (Access + Refresh).
   * Also registers the device details dynamically.
   */
  async login(dto: MobileLoginDto) {
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
      throw new UnauthorizedException('Invalid mobile credentials.');
    }

    const isPasswordValid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid mobile credentials.');
    }

    if (user.business.deletedAt) {
      throw new UnauthorizedException('This cooperative business is suspended.');
    }

    const roleName = user.userRoles[0]?.role?.name || 'USER';

    // Generate Short-lived Access Token for mobile (1h expiration)
    const accessToken = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        name: user.name,
        businessId: user.business.id,
        businessSlug: user.business.slug,
        role: roleName,
      },
      this.jwtSecret,
      { expiresIn: '1h' },
    );

    // Generate Secure Random Refresh Token
    const refreshRawToken = crypto.randomBytes(40).toString('hex');
    const refreshExpiresAt = new Date();
    refreshExpiresAt.setDate(refreshExpiresAt.getDate() + 30); // 30 Days expiration

    // Save refresh token to database
    await this.db.refreshToken.create({
      data: {
        userId: user.id,
        token: refreshRawToken,
        expiresAt: refreshExpiresAt,
      },
    });

    // Register/update device info if supplied
    if (dto.deviceId) {
      await this.registerDevice(user.business.id, user.id, {
        deviceId: dto.deviceId,
        deviceName: dto.deviceName || 'Unknown Mobile Device',
        deviceType: dto.deviceType || MobileDeviceType.ANDROID,
        pushToken: dto.pushToken,
      });
    }

    // Log Activity for Audit Trail
    await this.db.activityLog.create({
      data: {
        businessId: user.business.id,
        userId: user.id,
        type: 'AUTHENTICATION',
        description: `Mobile session initialized on device: ${dto.deviceName || 'Generic'}.`,
      },
    });

    return {
      success: true,
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
      tokens: {
        accessToken,
        refreshToken: refreshRawToken,
        expiresIn: 3600, // 1 hour
      },
    };
  }

  /**
   * Refreshes access token securely using database-stored refresh tokens (token rotation).
   */
  async refresh(dto: MobileRefreshTokenDto) {
    const storedToken = await this.db.refreshToken.findUnique({
      where: { token: dto.refreshToken },
      include: {
        user: {
          include: {
            business: true,
            userRoles: {
              include: {
                role: true,
              },
            },
          },
        },
      },
    });

    if (!storedToken || storedToken.isRevoked || storedToken.expiresAt < new Date()) {
      throw new UnauthorizedException('Refresh token is invalid or has expired.');
    }

    const user = storedToken.user;
    if (user.business.deletedAt) {
      throw new UnauthorizedException('This cooperative business is suspended.');
    }

    const roleName = user.userRoles[0]?.role?.name || 'USER';

    // Rotate Refresh Token (revoke old, create new to prevent reuse attacks)
    await this.db.refreshToken.update({
      where: { id: storedToken.id },
      data: { isRevoked: true },
    });

    const newRefreshRawToken = crypto.randomBytes(40).toString('hex');
    const newRefreshExpiresAt = new Date();
    newRefreshExpiresAt.setDate(newRefreshExpiresAt.getDate() + 30);

    await this.db.refreshToken.create({
      data: {
        userId: user.id,
        token: newRefreshRawToken,
        expiresAt: newRefreshExpiresAt,
      },
    });

    // Generate new Access Token
    const accessToken = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        name: user.name,
        businessId: user.business.id,
        businessSlug: user.business.slug,
        role: roleName,
      },
      this.jwtSecret,
      { expiresIn: '1h' },
    );

    return {
      success: true,
      tokens: {
        accessToken,
        refreshToken: newRefreshRawToken,
        expiresIn: 3600,
      },
    };
  }

  /**
   * Revokes a refresh token to cleanly end a mobile session.
   */
  async logout(refreshToken: string) {
    const storedToken = await this.db.refreshToken.findUnique({
      where: { token: refreshToken },
    });

    if (storedToken) {
      await this.db.refreshToken.update({
        where: { id: storedToken.id },
        data: { isRevoked: true },
      });
    }

    return { success: true, message: 'Logged out successfully.' };
  }

  /**
   * Register or update mobile device metadata (including Push Tokens) within persistent Settings.
   */
  async registerDevice(businessId: string, userId: string, dto: DeviceRegisterDto) {
    const deviceKey = `device_registration:${userId}:${dto.deviceId}`;
    const deviceValue = JSON.stringify({
      deviceId: dto.deviceId,
      deviceName: dto.deviceName,
      deviceType: dto.deviceType,
      pushToken: dto.pushToken || null,
      registeredAt: new Date().toISOString(),
    });

    // Upsert registration into Setting to bypass schema lock while preserving multi-tenant safety
    await this.db.setting.upsert({
      where: {
        businessId_key: {
          businessId,
          key: deviceKey,
        },
      },
      create: {
        businessId,
        key: deviceKey,
        value: deviceValue,
      },
      update: {
        value: deviceValue,
      },
    });

    this.logger.log(`Registered device [${dto.deviceName}] for user [${userId}]`);
    return { success: true, message: 'Device registered and subscribed for push notifications.' };
  }

  /**
   * Retrieves all registered devices for a tenant.
   */
  async listDevices(businessId: string) {
    const settings = await this.db.setting.findMany({
      where: {
        businessId,
        key: {
          startsWith: 'device_registration:',
        },
      },
    });

    return settings.map((s) => {
      const parts = s.key.split(':');
      const userId = parts[1];
      const payload = JSON.parse(s.value);
      return {
        userId,
        ...payload,
      };
    });
  }
}
