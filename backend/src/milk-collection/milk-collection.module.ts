import { Module } from '@nestjs/common';
import { MilkCollectionService } from './milk-collection.service';
import { MilkCollectionController } from './milk-collection.controller';
import { DatabaseModule } from '../database/database.module';
import { CommonModule } from '../common/common.module';

@Module({
  imports: [DatabaseModule, CommonModule],
  controllers: [MilkCollectionController],
  providers: [MilkCollectionService],
  exports: [MilkCollectionService],
})
export class MilkCollectionModule {}
