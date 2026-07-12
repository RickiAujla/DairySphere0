import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient, Prisma } from '@prisma/client';
import { AppLogger } from '../common/common.module';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class DatabaseService
  extends PrismaClient<Prisma.PrismaClientOptions, 'query' | 'info' | 'warn' | 'error'>
  implements OnModuleInit, OnModuleDestroy
{
  constructor(
    private readonly logger: AppLogger,
    private readonly configService: ConfigService,
  ) {
    const dbUrl = configService.get<string>('database.url');
    
    super({
      datasources: {
        db: {
          url: dbUrl,
        },
      },
      log: [
        { emit: 'event', level: 'query' },
        { emit: 'event', level: 'info' },
        { emit: 'event', level: 'warn' },
        { emit: 'event', level: 'error' },
      ],
    });

    this.logger.setContext('DatabaseService');
  }

  async onModuleInit() {
    // Set up custom logger listeners for Prisma Events
    this.$on('query', (e: Prisma.QueryEvent) => {
      this.logger.debug(`Query: ${e.query} - Params: ${e.params} - Duration: ${e.duration}ms`);
    });

    this.$on('info', (e: Prisma.LogEvent) => {
      this.logger.log(e.message);
    });

    this.$on('warn', (e: Prisma.LogEvent) => {
      this.logger.warn(e.message);
    });

    this.$on('error', (e: Prisma.LogEvent) => {
      this.logger.error(e.message);
    });

    await this.connectWithRetry();
  }

  private async connectWithRetry(retries = 5, delayMs = 2000) {
    for (let i = 1; i <= retries; i++) {
      try {
        await this.$connect();
        this.logger.log('Successfully connected to the PostgreSQL database via Prisma');
        return;
      } catch (error) {
        this.logger.warn(
          `Database connection attempt ${i}/${retries} failed. Retrying in ${delayMs}ms... Error: ${
            error instanceof Error ? error.message : String(error)
          }`,
        );
        if (i === retries) {
          this.logger.error('Could not connect to database after maximum retries. Application may be unstable.');
          throw error;
        }
        await new Promise((resolve) => setTimeout(resolve, delayMs));
        delayMs *= 2; // Exponential backoff
      }
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
    this.logger.log('Disconnected cleanly from PostgreSQL database');
  }

  /**
   * Health check query to verify database connection viability.
   */
  async isHealthy(): Promise<boolean> {
    try {
      // Direct raw database ping
      await this.$executeRawUnsafe('SELECT 1');
      return true;
    } catch (error) {
      this.logger.error('Database connection health check failed', error instanceof Error ? error.stack : String(error));
      return false;
    }
  }

  /**
   * Wraps operation in a highly reliable transaction with automatic rollback.
   */
  async runInTransaction<T>(
    operation: (tx: Prisma.TransactionClient) => Promise<T>,
    options?: { maxWait?: number; timeout?: number; isolationLevel?: Prisma.TransactionIsolationLevel },
  ): Promise<T> {
    try {
      return await this.$transaction(operation, options);
    } catch (error) {
      this.logger.error('Transaction failed and was rolled back', error instanceof Error ? error.stack : String(error));
      throw error;
    }
  }
}
