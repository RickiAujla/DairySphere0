import { Injectable, Optional } from '@nestjs/common';
import { SYSTEM_METADATA } from '../common/constants';
import { DatabaseService } from '../database/database.service';

export interface HealthCheckResult {
  status: string;
  uptimeSeconds: number;
  timestamp: string;
  database: {
    connected: boolean;
    status: 'UP' | 'DOWN';
  };
  system: {
    memory: {
      rss: string;
      heapTotal: string;
      heapUsed: string;
    };
    nodeVersion: string;
  };
  metadata: {
    appName: string;
    version: string;
    stage: string;
  };
}

@Injectable()
export class HealthService {
  private readonly startTime = Date.now();

  constructor(
    @Optional() private readonly databaseService?: DatabaseService,
  ) {}

  async getHealthInfo(): Promise<HealthCheckResult> {
    const memory = process.memoryUsage();
    
    let isDbHealthy = false;
    if (this.databaseService) {
      try {
        isDbHealthy = await this.databaseService.isHealthy();
      } catch {
        isDbHealthy = false;
      }
    }

    return {
      status: isDbHealthy ? 'UP' : 'DEGRADED',
      uptimeSeconds: Math.floor((Date.now() - this.startTime) / 1000),
      timestamp: new Date().toISOString(),
      database: {
        connected: isDbHealthy,
        status: isDbHealthy ? 'UP' : 'DOWN',
      },
      system: {
        memory: {
          rss: `${(memory.rss / 1024 / 1024).toFixed(2)} MB`,
          heapTotal: `${(memory.heapTotal / 1024 / 1024).toFixed(2)} MB`,
          heapUsed: `${(memory.heapUsed / 1024 / 1024).toFixed(2)} MB`,
        },
        nodeVersion: process.version,
      },
      metadata: {
        appName: SYSTEM_METADATA.appName,
        version: SYSTEM_METADATA.version,
        stage: SYSTEM_METADATA.stage,
      },
    };
  }
}
