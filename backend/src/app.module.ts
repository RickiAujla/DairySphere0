import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { ConfigModule } from './config/config.module';
import { CommonModule, RequestLoggerMiddleware } from './common/common.module';
import { HealthModule } from './health/health.module';
import { DatabaseModule } from './database/database.module';
import { BusinessModule } from './business/business.module';
import { RbacModule } from './rbac/rbac.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { MasterDataModule } from './master-data/master-data.module';
import { MilkCollectionModule } from './milk-collection/milk-collection.module';
import { MobileModule } from './mobile/mobile.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { SchedulerModule } from './scheduler/scheduler.module';
import { IntegrationsModule } from './integrations/integrations.module';

@Module({
  imports: [
    ConfigModule,
    CommonModule,
    DatabaseModule,
    HealthModule,
    BusinessModule,
    RbacModule,
    DashboardModule,
    MasterDataModule,
    MilkCollectionModule,
    MobileModule,
    AnalyticsModule,
    SchedulerModule,
    IntegrationsModule,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    // Bind the request logger middleware globally to all routes
    consumer.apply(RequestLoggerMiddleware).forRoutes('*');
  }
}
