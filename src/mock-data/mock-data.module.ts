import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../user/user.entity';
import { Company } from '../company/company.entity';
import { Client } from '../client/client.entity';
import { Product } from '../product/entities/product.entity';
import { Invoice } from '../invoice/invoice.entity';
import { InvoiceItem } from '../invoice/invoice-item.entity';
import { Transaction } from '../transaction/transaction.entity';
import { Activity } from '../activity/activity.entity';
import { MockDataController } from './mock-data.controller';
import { MockDataService } from './mock-data.service';
import { ActivityService } from '../activity/activity.service';
import { ActivityModule } from '../activity/activity.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      Company,
      Client,
      Product,
      Invoice,
      InvoiceItem,
      Transaction,
      Activity,
    ]),
    ActivityModule,
  ],
  providers: [MockDataService, ActivityService],
  controllers: [MockDataController],
})
export class MockDataModule {}
