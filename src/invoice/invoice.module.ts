import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InvoiceService } from './invoice.service';
import { InvoiceController } from './invoice.controller';
import { Invoice } from './invoice.entity';
import { InvoiceItem } from './invoice-item.entity';
import { PdfService } from '../services/pdf.service';
import { EmailService } from '../services/email.service';
import { SquadService } from '../services/gtco_squad.service';

@Module({
  imports: [TypeOrmModule.forFeature([Invoice, InvoiceItem])],
  providers: [InvoiceService, PdfService, EmailService, SquadService],
  controllers: [InvoiceController],
})
export class InvoiceModule {}
