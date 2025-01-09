import { Module } from '@nestjs/common';
import { SquadWebhookController } from './squad.webhook.controller';
import { SquadService } from '../services/gtco_squad.service';
import { InvoiceService } from '../invoice/invoice.service';
import { EmailService } from '../services/email.service';
import { TransactionModule } from '../transaction/transaction.module';
import { ActivityModule } from '../activity/activity.module';
import { NotificationModule } from '../notification/notification.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Invoice } from '../invoice/invoice.entity';
import { InvoiceItem } from '../invoice/invoice-item.entity';
import { Client } from '../client/client.entity';
import { Company } from '../company/company.entity';
import { Product } from '../product/entities/product.entity';
import { Activity } from '../activity/activity.entity';
import { PdfService } from '../services/pdf.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Invoice,
      InvoiceItem,
      Client,
      Company,
      Product,
      Activity,
    ]),
    TransactionModule,
    ActivityModule,
    NotificationModule,
  ],
  controllers: [SquadWebhookController],
  providers: [SquadService, InvoiceService, EmailService, PdfService],
})
export class WebhookModule {}
