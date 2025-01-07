import {
  Injectable,
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Invoice } from './invoice.entity';
import { InvoiceItem } from './invoice-item.entity';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { UpdateInvoiceDto } from './dto/update-invoice.dto';
import { EmailService } from 'src/services/email.service';
import { PdfService } from 'src/services/pdf.service';
import { SquadService } from 'src/services/gtco_squad.service';
import { InvoiceStatus } from './enums/invoice-status.enum';

@Injectable()
export class InvoiceService {
  constructor(
    @InjectRepository(Invoice)
    private invoiceRepository: Repository<Invoice>,
    @InjectRepository(InvoiceItem)
    private invoiceItemRepository: Repository<InvoiceItem>,
    private pdfService: PdfService,
    private emailService: EmailService,
    private squadService: SquadService,
  ) {}

  async create(createInvoiceDto: CreateInvoiceDto): Promise<Invoice> {
    try {
      // Create the invoice
      const invoice = this.invoiceRepository.create({
        dueDate: createInvoiceDto.dueDate,
        client: { id: createInvoiceDto.clientId },
        company: { id: createInvoiceDto.companyId },
        invoiceNumber: `INV-${Date.now()}`, // You might want a more sophisticated number generation
        totalAmount: 0, // Will be calculated from items
      });

      // Save the invoice first to get the ID
      const savedInvoice = await this.invoiceRepository.save(invoice);

      // Create and save invoice items
      let totalAmount = 0;
      for (const item of createInvoiceDto.items) {
        const invoiceItem = this.invoiceItemRepository.create({
          invoice: savedInvoice,
          product: { id: item.productId },
          quantity: item.quantity,
          price: item.price,
        });

        await this.invoiceItemRepository.save(invoiceItem);
        totalAmount += item.quantity * item.price;
      }

      // Update invoice with total amount
      savedInvoice.totalAmount = totalAmount;

      // Generate transaction reference
      savedInvoice.transactionRef = `INV-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      // Save updated invoice
      const finalInvoice = await this.invoiceRepository.save(savedInvoice);

      // Generate PDF
      const pdfPath = await this.pdfService.generateInvoicePdf(finalInvoice);

      // Generate payment link
      const paymentLink = await this.squadService.createPaymentLink(
        finalInvoice.totalAmount,
        finalInvoice.client.email,
        finalInvoice.invoiceNumber,
        finalInvoice.transactionRef,
      );

      // Update invoice with payment link
      finalInvoice.paymentLink = paymentLink;
      await this.invoiceRepository.save(finalInvoice);

      // Send email
      await this.emailService.sendInvoiceEmail(
        finalInvoice.client.email,
        finalInvoice.client.firstName,
        pdfPath,
        finalInvoice.paymentLink,
      );

      return this.findOne(finalInvoice.id);
    } catch (error) {
      throw new InternalServerErrorException({
        message: 'Failed to create invoice',
        error: error.message,
        statusCode: 500,
      });
    }
  }

  async findAll(): Promise<Invoice[]> {
    return this.invoiceRepository.find({
      relations: ['items', 'client', 'company'],
    });
  }

  async findOne(id: number): Promise<Invoice> {
    const invoice = await this.invoiceRepository.findOne({
      where: { id },
      relations: ['items', 'client', 'company'],
    });
    if (!invoice) {
      throw new NotFoundException(`Invoice with ID ${id} not found`);
    }
    return invoice;
  }

  async update(
    id: number,
    updateInvoiceDto: UpdateInvoiceDto,
  ): Promise<Invoice> {
    const invoice = await this.findOne(id);
    Object.assign(invoice, updateInvoiceDto);
    await this.invoiceRepository.save(invoice);
    return invoice;
  }

  async updateStatus(id: number, status: InvoiceStatus): Promise<Invoice> {
    const invoice = await this.findOne(id);
    invoice.status = status;
    await this.invoiceRepository.save(invoice);
    return invoice;
  }

  async remove(id: number): Promise<void> {
    const invoice = await this.findOne(id);
    await this.invoiceRepository.remove(invoice);
  }

  async updateInvoiceStatus(
    transactionRef: string,
    status: InvoiceStatus,
    amount: number,
  ): Promise<Invoice> {
    const invoice = await this.invoiceRepository.findOne({
      where: { transactionRef },
      relations: ['client'],
    });

    if (!invoice) {
      throw new NotFoundException(
        `Invoice with transaction reference ${transactionRef} not found`,
      );
    }

    // Verify the amount matches (optional but recommended)
    if (invoice.totalAmount !== amount) {
      throw new Error('Payment amount does not match invoice amount');
    }

    invoice.status = status;
    invoice.paidAt = new Date();

    // Save the updated invoice
    await this.invoiceRepository.save(invoice);

    // Optionally, send a payment confirmation email
    await this.emailService.sendPaymentConfirmationEmail(
      invoice.client.email,
      invoice.client.firstName,
      invoice.invoiceNumber,
      amount,
    );

    return invoice;
  }
}
