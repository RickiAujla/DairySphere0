import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { BusinessController } from './business.controller';
import { BusinessService } from './business.service';
import { TenantMiddleware } from './middleware/tenant.middleware';

@Module({
  controllers: [BusinessController],
  providers: [BusinessService],
  exports: [BusinessService],
})
export class BusinessModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    // Inject the multi-tenant resolution middleware to intercept all routes
    consumer.apply(TenantMiddleware).forRoutes('*');
  }
}
