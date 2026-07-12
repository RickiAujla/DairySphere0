import { Injectable, NestMiddleware, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { DatabaseService } from '../../database/database.service';
import { AppLogger } from '../../common/logger/logger.service';
import * as jwt from 'jsonwebtoken';

// Extend Express Request interface to include business context
declare global {
  namespace Express {
    interface Request {
      business?: any;
      businessId?: string;
      user?: any;
    }
  }
}

@Injectable()
export class TenantMiddleware implements NestMiddleware {
  private readonly jwtSecret: string;

  constructor(
    private readonly db: DatabaseService,
    private readonly logger: AppLogger,
  ) {
    this.logger.setContext('TenantMiddleware');
    this.jwtSecret = process.env.JWT_SECRET || 'dairysphere_fallback_secret_key_change_me_in_prod';
  }

  async use(req: Request, res: Response, next: NextFunction) {
    let resolvedBusinessId: string | null = null;
    let resolvedBusinessSlug: string | null = null;

    // 1. Check for Tenant Identifier Headers
    const headerBusinessId = req.headers['x-tenant-id'] || req.headers['x-business-id'];
    const headerBusinessSlug = req.headers['x-business-slug'];

    if (headerBusinessId && typeof headerBusinessId === 'string') {
      resolvedBusinessId = headerBusinessId;
    } else if (headerBusinessSlug && typeof headerBusinessSlug === 'string') {
      resolvedBusinessSlug = headerBusinessSlug;
    }

    // 2. Check for Query Parameters
    const queryBusinessId = req.query.businessId || req.query.tenantId;
    const queryBusinessSlug = req.query.businessSlug || req.query.tenantSlug;

    if (queryBusinessId && typeof queryBusinessId === 'string') {
      resolvedBusinessId = queryBusinessId;
    } else if (queryBusinessSlug && typeof queryBusinessSlug === 'string') {
      resolvedBusinessSlug = queryBusinessSlug;
    }

    // 3. Resolve from authenticated JWT Token (if present)
    const authHeader = req.headers['authorization'];
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      try {
        const decoded = jwt.verify(token, this.jwtSecret) as any;
        if (decoded && decoded.businessId) {
          resolvedBusinessId = decoded.businessId;
          req.user = decoded; // Cache decoded user info on request
        }
      } catch (err) {
        // Token might be expired or invalid, let specific AuthGuards throw if needed,
        // but log the debug information
        this.logger.debug(`Token verification failed during tenant resolution: ${err.message}`);
      }
    }

    // 4. Resolve the tenant business object from the database
    if (resolvedBusinessId) {
      const business = await this.db.business.findUnique({
        where: { id: resolvedBusinessId },
      });

      if (business) {
        if (business.deletedAt) {
          throw new UnauthorizedException('Resolved business tenant has been suspended or deleted');
        }
        req.business = business;
        req.businessId = business.id;
      }
    } else if (resolvedBusinessSlug) {
      const business = await this.db.business.findUnique({
        where: { slug: resolvedBusinessSlug },
      });

      if (business) {
        if (business.deletedAt) {
          throw new UnauthorizedException('Resolved business tenant has been suspended or deleted');
        }
        req.business = business;
        req.businessId = business.id;
      }
    }

    next();
  }
}
