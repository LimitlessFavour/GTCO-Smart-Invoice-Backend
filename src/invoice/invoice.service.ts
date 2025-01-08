import {
  Injectable,
  NotFoundException,
  InternalServerErrorException,
  BadRequestException,
  Logger,
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
import { Client } from 'src/client/client.entity';
import { Company } from 'src/company/company.entity';
import { Product } from 'src/product/entities/product.entity';

@Injectable()
export class InvoiceService {
  private readonly logger = new Logger(InvoiceService.name);

  constructor(
    @InjectRepository(Invoice)
    private invoiceRepository: Repository<Invoice>,
    @InjectRepository(InvoiceItem)
    private invoiceItemRepository: Repository<InvoiceItem>,
    @InjectRepository(Client)
    private clientRepository: Repository<Client>,
    @InjectRepository(Company)
    private companyRepository: Repository<Company>,
    @InjectRepository(Product)
    private productRepository: Repository<Product>,
    private pdfService: PdfService,
    private emailService: EmailService,
    private squadService: SquadService,
  ) {}

  async create(createInvoiceDto: CreateInvoiceDto): Promise<Invoice> {
    try {
      // First verify that client and company exist
      const client = await this.clientRepository.findOne({
        where: { id: createInvoiceDto.clientId },
      });
      if (!client) {
        throw new BadRequestException({
          message: `Client with ID ${createInvoiceDto.clientId} not found`,
          statusCode: 400,
        });
      }

      const company = await this.companyRepository.findOne({
        where: { id: createInvoiceDto.companyId },
      });
      if (!company) {
        throw new BadRequestException({
          message: `Company with ID ${createInvoiceDto.companyId} not found`,
          statusCode: 400,
        });
      }

      //veirfy that none of the items have a quantity of 0
      if (createInvoiceDto.items.some((item) => item.quantity === 0)) {
        throw new BadRequestException({
          message: 'Quantity must be greater than 0',
          statusCode: 400,
        });
      }

      // Create the invoice
      const invoice = this.invoiceRepository.create({
        dueDate: createInvoiceDto.dueDate,
        client: { id: createInvoiceDto.clientId },
        company: { id: createInvoiceDto.companyId },
        invoiceNumber: `INV-${Date.now()}`,
        totalAmount: 0,
      });

      // Save the invoice first to get the ID
      let savedInvoice;
      try {
        savedInvoice = await this.invoiceRepository.save(invoice);
      } catch (dbError) {
        this.logger.error(
          `Failed to save invoice. Error: ${dbError.message}`,
          dbError?.stack,
          'create',
        );
        throw new BadRequestException({
          message: 'Failed to create invoice: ' + dbError.message,
          statusCode: 400,
        });
      }

      // Create and save invoice items
      let totalAmount = 0;
      try {
        for (const item of createInvoiceDto.items) {
          // Verify product exists
          const product = await this.productRepository.findOne({
            where: { id: item.productId },
          });

          if (!product) {
            this.logger.error(
              `Product with ID ${item.productId} not found`,
              null,
              'create',
            );
            // Cleanup the partially created invoice using delete instead of remove
            if (savedInvoice?.id) {
              await this.invoiceRepository.delete(savedInvoice.id);
            }
            throw new BadRequestException({
              message: `Product with ID ${item.productId} not found`,
              statusCode: 400,
            });
          }

          const invoiceItem = this.invoiceItemRepository.create({
            invoice: savedInvoice,
            product: product,
            quantity: item.quantity,
            price: product.price, // Use product price from database
          });

          await this.invoiceItemRepository.save(invoiceItem);
          totalAmount += item.quantity * product.price;
        }
      } catch (itemError) {
        this.logger.error(
          `Failed to create invoice items. Error: ${itemError.message}`,
          itemError?.stack,
          'create',
        );
        // Cleanup using delete instead of remove
        if (savedInvoice?.id) {
          await this.invoiceRepository.delete(savedInvoice.id);
        }
        throw new BadRequestException({
          message:
            itemError instanceof BadRequestException
              ? itemError.message
              : 'Failed to create invoice items: ' + itemError.message,
          statusCode: 400,
        });
      }

      // Update invoice with total amount
      this.logger.debug('Calculating total amount:', {
        items: savedInvoice.items?.map((item) => ({
          quantity: item.quantity,
          price: item.price,
          subtotal: item.quantity * item.price,
        })),
        totalAmount,
      });

      savedInvoice.totalAmount = totalAmount;
      savedInvoice.transactionRef = `INV-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      try {
        const finalInvoice = await this.invoiceRepository.save(savedInvoice);

        // Load complete invoice with all needed relations for PDF
        const completeInvoice = await this.invoiceRepository.findOne({
          where: { id: finalInvoice.id },
          relations: ['items', 'items.product', 'client', 'company'],
        });

        if (!completeInvoice) {
          throw new NotFoundException(
            `Invoice with ID ${finalInvoice.id} not found`,
          );
        }

        // Generate PDF and payment link
        const [pdfPath, paymentLink] = await Promise.all([
          this.pdfService.generateInvoicePdf(completeInvoice),
          this.squadService.createPaymentLink(
            completeInvoice.totalAmount,
            completeInvoice.client.email,
            completeInvoice.invoiceNumber,
            completeInvoice.transactionRef,
          ),
        ]);

        // Update invoice with payment link
        completeInvoice.paymentLink = paymentLink;
        await this.invoiceRepository.save(completeInvoice);

        // Send email
        await this.emailService.sendInvoiceEmail(
          completeInvoice.client.email,
          completeInvoice.client.firstName,
          pdfPath,
          completeInvoice.paymentLink,
        );

        return this.findOne(completeInvoice.id);
      } catch (error) {
        this.logger.error(
          `Failed in final invoice processing. Error: ${error.message}`,
          error?.stack,
          'create',
        );
        throw new InternalServerErrorException({
          message: 'Failed to process invoice: ' + error.message,
          statusCode: 500,
        });
      }
    } catch (error) {
      // Log the error if it hasn't been logged already
      if (
        !(
          error instanceof BadRequestException ||
          error instanceof InternalServerErrorException
        )
      ) {
        this.logger.error(
          `Unexpected error creating invoice: ${error.message}`,
          error?.stack,
          'create',
        );
      }
      throw error;
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
