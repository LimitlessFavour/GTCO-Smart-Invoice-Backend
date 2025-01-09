import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';

// Controllers
import { SquadWebhookController } from './squad.webhook.controller';

// Services
import { EmailService } from '../services/email.service';
import { PdfService } from '../services/pdf.service';

// Entities
import { Invoice } from '../invoice/invoice.entity';
import { InvoiceItem } from '../invoice/invoice-item.entity';
import { Product } from '../product/entities/product.entity';
import { Client } from 'src/client/client.entity';
import { Company } from 'src/company/company.entity';
import { InvoiceModule } from '../invoice/invoice.module';
import { SquadService } from 'src/services/gtco_squad.service';

@Module({
  imports: [
    ConfigModule,
    TypeOrmModule.forFeature([Invoice, InvoiceItem, Client, Company, Product]),
    InvoiceModule,
  ],
  controllers: [SquadWebhookController],
  providers: [EmailService, PdfService, SquadService],
})
export class WebhookModule {}
