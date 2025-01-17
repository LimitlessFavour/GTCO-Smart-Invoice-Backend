import { Module, Logger } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AnalyticsController } from './analytics.controller';
import { AnalyticsService } from './analytics.service';
import { Transaction } from '../transaction/transaction.entity';
import { Invoice } from '../invoice/invoice.entity';
import { Product } from '../product/entities/product.entity';
import { Activity } from '../activity/activity.entity';
import { UserModule } from '../user/user.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Transaction, Invoice, Product, Activity]),
    UserModule,
  ],
  controllers: [AnalyticsController],
  providers: [AnalyticsService, Logger],
  exports: [AnalyticsService],
})
export class AnalyticsModule {}
