import { Module } from '@nestjs/common';
import { MobileAuthController } from './controllers/mobile-auth.controller';
import { MobileSyncController } from './controllers/mobile-sync.controller';
import { MobileDataController } from './controllers/mobile-data.controller';
import { MobileAuthService } from './services/mobile-auth.service';
import { MobileSyncService } from './services/mobile-sync.service';
import { DatabaseModule } from '../database/database.module';
import { CommonModule } from '../common/common.module';

@Module({
  imports: [
    DatabaseModule,
    CommonModule,
  ],
  controllers: [
    MobileAuthController,
    MobileSyncController,
    MobileDataController,
  ],
  providers: [
    MobileAuthService,
    MobileSyncService,
  ],
  exports: [
    MobileAuthService,
    MobileSyncService,
  ],
})
export class MobileModule {}
