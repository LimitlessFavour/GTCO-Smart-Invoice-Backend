import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InvoiceService } from './invoice.service';
import { InvoiceController } from './invoice.controller';
import { Invoice } from './invoice.entity';
import { InvoiceItem } from './invoice-item.entity';
import { PdfService } from '../services/pdf.service';
import { EmailService } from '../services/email.service';
import { Client } from '../client/client.entity';
import { Company } from '../company/company.entity';
import { Product } from '../product/entities/product.entity';
import { SquadService } from 'src/services/gtco_squad.service';
import { TransactionModule } from '../transaction/transaction.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Invoice, InvoiceItem, Client, Company, Product]),
    TransactionModule,
  ],
  providers: [InvoiceService, PdfService, EmailService, SquadService],
  controllers: [InvoiceController],
  exports: [InvoiceService],
})
export class InvoiceModule {}
