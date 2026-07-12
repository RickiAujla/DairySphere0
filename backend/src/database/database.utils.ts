import { Prisma } from '@prisma/client';
import { BadRequestException, InternalServerErrorException } from '@nestjs/common';

export class DatabaseUtils {
  /**
   * Safely formats query pagination parameters for database calls.
   */
  static getPaginationParams(page = 1, limit = 10) {
    const take = Math.max(1, Math.min(100, limit));
    const skip = Math.max(0, (page - 1) * take);
    return { skip, take };
  }

  /**
   * Maps common database/Prisma errors to standard NestJS Exceptions.
   */
  static handlePrismaError(error: any): never {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      switch (error.code) {
        case 'P2002': {
          const targets = (error.meta?.target as string[]) || [];
          throw new BadRequestException({
            code: 'DUPLICATE_RECORD',
            message: `A record already exists with the unique field(s): ${targets.join(', ')}`,
          });
        }
        case 'P2025':
          throw new BadRequestException({
            code: 'RECORD_NOT_FOUND',
            message: error.meta?.cause || 'The requested database record does not exist',
          });
        case 'P2003':
          throw new BadRequestException({
            code: 'FOREIGN_KEY_VIOLATION',
            message: 'Database relational integrity validation failed on reference key constraint',
          });
        default:
          throw new BadRequestException({
            code: 'DATABASE_KNOWN_ERROR',
            message: `Database operation failed: ${error.message}`,
            details: error.code,
          });
      }
    }

    if (error instanceof Prisma.PrismaClientValidationError) {
      throw new BadRequestException({
        code: 'DATABASE_VALIDATION_ERROR',
        message: 'Database query schema structure mismatch or validation failed',
      });
    }

    throw new InternalServerErrorException({
      code: 'DATABASE_UNKNOWN_ERROR',
      message: 'An unexpected database transactional fault occurred',
    });
  }
}
