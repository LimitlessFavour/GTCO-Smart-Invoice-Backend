import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';

// Controllers
import { SquadWebhookController } from './squad.webhook.controller';

// Services
import { SquadService } from '../services/gtco_squad.service';
import { InvoiceService } from '../invoice/invoice.service';
import { EmailService } from '../services/email.service';
import { PdfService } from '../services/pdf.service';

// Entities
import { Invoice } from '../invoice/invoice.entity';
import { InvoiceItem } from '../invoice/invoice-item.entity';
import { Product } from '../product/entities/product.entity';
import { Client } from 'src/client/client.entity';
import { Company } from 'src/company/company.entity';

@Module({
  imports: [
    ConfigModule, // For environment variables
    TypeOrmModule.forFeature([Invoice, InvoiceItem, Client, Company, Product]),
  ],
  controllers: [SquadWebhookController],
  providers: [SquadService, InvoiceService, EmailService, PdfService],
})
export class WebhookModule {}
