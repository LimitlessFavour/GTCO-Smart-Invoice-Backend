/* eslint-disable @typescript-eslint/no-unused-vars */
import {
  Injectable,
  NotFoundException,
  InternalServerErrorException,
  BadRequestException,
  Logger,
  forwardRef,
  Inject,
  HttpException,
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
import * as crypto from 'crypto';
import { TransactionService } from '../transaction/transaction.service';
import { PaymentType } from '../transaction/transaction.entity';
import { NotificationService } from 'src/notification/notification.service';
import { NotificationType } from 'src/notification/notification.entity';
import { ActivityService } from 'src/activity/activity.service';
import { ActivityType } from 'src/activity/activity.entity';
import { InvoiceStatsDto } from './dto/invoice-stats.dto';
import { MoreThanOrEqual, Not } from 'typeorm';
import { InvoiceListResponseDto } from './dto/response.dto';

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
    @Inject(forwardRef(() => SquadService))
    private squadService: SquadService,
    private readonly transactionService: TransactionService,
    private readonly notificationService: NotificationService,
    private readonly activityService: ActivityService,
  ) {}

  private generateUniqueHash(): string {
    // Generate a random string using crypto instead of nanoid
    return crypto.randomBytes(8).toString('hex');
  }

  async create(
    createInvoiceDto: CreateInvoiceDto,
    isDraft: boolean = false,
  ): Promise<Invoice> {
    try {
      // Load client with email
      const client = await this.clientRepository.findOne({
        where: { id: createInvoiceDto.clientId },
        select: ['id', 'firstName', 'lastName', 'email'], // Make sure email is selected
      });

      if (!client) {
        throw new NotFoundException(
          `Client with ID ${createInvoiceDto.clientId} not found`,
        );
      }

      if (!client.email) {
        this.logger.warn(`Client ${client.id} has no email address`);
      }

      // Load company
      const company = await this.companyRepository.findOne({
        where: { id: createInvoiceDto.companyId },
      });

      if (!company) {
        throw new NotFoundException(
          `Company with ID ${createInvoiceDto.companyId} not found`,
        );
      }

      //veirfy that none of the items have a quantity of 0
      if (createInvoiceDto.items.some((item) => item.quantity === 0)) {
        throw new BadRequestException({
          message: 'Quantity must be greater than 0',
          statusCode: 400,
        });
      }

      // Create the invoice with draft status if specified
      // const hash = this.generateUniqueHash();

      const invoice = this.invoiceRepository.create({
        dueDate: new Date(createInvoiceDto.dueDate),
        client: client, // Pass the full client object
        company: company,
        invoiceNumber: `INV-${Date.now()}`,
        totalAmount: 0,
        status: isDraft ? InvoiceStatus.DRAFT : InvoiceStatus.UNPAID,
        // squadHash: hash,
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

        // Only generate payment link and PDF if not a draft
        if (!isDraft) {
          // First generate payment link
          const paymentLinkData = await this.squadService.createPaymentLink(
            completeInvoice.totalAmount,
            completeInvoice.client.email,
            completeInvoice.invoiceNumber,
            completeInvoice.transactionRef,
          );

          // Update invoice with payment link
          completeInvoice.paymentLink = paymentLinkData.paymentUrl;
          completeInvoice.squadTransactionRef = paymentLinkData.squadRef;
          await this.invoiceRepository.save(completeInvoice);

          // Now generate PDF with updated invoice data
          const pdfPath =
            await this.pdfService.generateInvoicePdf(completeInvoice);

          // Send email with both PDF and payment link
          await this.emailService.sendInvoiceEmail(
            completeInvoice.client.email,
            completeInvoice.client.firstName,
            pdfPath,
            completeInvoice.paymentLink,
            completeInvoice.invoiceNumber,
            completeInvoice.dueDate?.toLocaleDateString('en-NG', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            }),
          );

          await this.activityService.create({
            type: ActivityType.INVOICE_CREATED,
            entityType: 'INVOICE',
            entityId: savedInvoice.id,
            companyId: savedInvoice.company.id,
            metadata: {
              invoiceNumber: savedInvoice.invoiceNumber,
              amount: savedInvoice.totalAmount,
              clientId: savedInvoice.client.id,
            },
          });
        }

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

  async findAll(): Promise<InvoiceListResponseDto> {
    const [invoices, total] = await this.invoiceRepository.findAndCount({
      relations: ['items', 'client', 'company', 'items.product'],
    });

    // Check each invoice for overdue status
    await Promise.all(
      invoices.map(async (invoice) => {
        await this.checkOverdueStatus(invoice);
      }),
    );

    // Calculate stats
    const stats = await this.calculateInvoiceStats();

    return {
      data: invoices,
      total,
      page: 1, // TODO: Add pagination parameters
      limit: 10, // TODO: Add pagination parameters
      stats,
    };
  }

  async findOne(id: number): Promise<Invoice> {
    const invoice = await this.invoiceRepository.findOne({
      where: { id },
      relations: ['items', 'items.product', 'client', 'company'],
    });

    if (!invoice) {
      throw new NotFoundException(`Invoice with ID ${id} not found`);
    }

    await this.checkOverdueStatus(invoice);
    return invoice;
  }

  async update(
    id: number,
    updateInvoiceDto: UpdateInvoiceDto,
  ): Promise<Invoice> {
    const invoice = await this.findOne(id);

    if (invoice.status !== InvoiceStatus.DRAFT) {
      throw new BadRequestException({
        message: 'Only draft invoices can be updated',
        statusCode: 400,
        details: `Invoice ${invoice.invoiceNumber} is in ${invoice.status} status`,
      });
    }

    Object.assign(invoice, updateInvoiceDto);
    return this.invoiceRepository.save(invoice);
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
      where: [{ transactionRef }, { squadTransactionRef: transactionRef }],
      relations: ['client'],
    });

    if (!invoice) {
      throw new NotFoundException(
        `Invoice with transaction reference ${transactionRef} not found`,
      );
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

  // New method to finalize a draft invoice
  async finalizeDraft(id: number): Promise<Invoice> {
    const invoice = await this.findOne(id);

    if (invoice.status !== InvoiceStatus.DRAFT) {
      throw new BadRequestException({
        message: 'Only draft invoices can be finalized',
        statusCode: 400,
      });
    }

    // First generate payment link
    const paymentData = await this.squadService.createPaymentLink(
      invoice.totalAmount,
      invoice.client.email,
      invoice.invoiceNumber,
      invoice.transactionRef,
    );

    // Update invoice status and payment link
    invoice.status = InvoiceStatus.UNPAID;
    invoice.paymentLink = paymentData.paymentUrl;
    invoice.squadTransactionRef = paymentData.squadRef;
    await this.invoiceRepository.save(invoice);

    // Now generate PDF with updated invoice data
    const pdfPath = await this.pdfService.generateInvoicePdf(invoice);

    // Send email
    await this.emailService.sendInvoiceEmail(
      invoice.client.email,
      invoice.client.firstName,
      pdfPath,
      invoice.paymentLink,
      invoice.invoiceNumber,
      invoice.dueDate?.toLocaleDateString('en-NG', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }),
    );

    await this.activityService.create({
      type: ActivityType.INVOICE_FINALIZED,
      entityType: 'INVOICE',
      entityId: invoice.id.toString(),
      companyId: invoice.company.id.toString(),
      metadata: {
        invoiceNumber: invoice.invoiceNumber,
        amount: invoice.totalAmount,
        clientId: invoice.client.id,
      },
    });

    return invoice;
  }

  async updateSquadTransactionRef(
    originalRef: string,
    squadRef: string,
  ): Promise<void> {
    const invoice = await this.invoiceRepository.findOne({
      where: { transactionRef: originalRef },
    });

    if (invoice) {
      invoice.squadTransactionRef = squadRef;
      await this.invoiceRepository.save(invoice);
    }
  }

  async findByTransactionRef(transactionRef: string): Promise<Invoice> {
    this.logger.debug('Finding invoice by transaction ref:', {
      transactionRef,
    });

    const invoice = await this.invoiceRepository.findOne({
      where: [{ transactionRef }, { squadTransactionRef: transactionRef }],
      relations: ['client', 'company'], // Ensure both relations are loaded
    });

    if (!invoice) {
      this.logger.error(
        `Invoice not found for transaction ref: ${transactionRef}`,
      );
      throw new NotFoundException(
        `Invoice with transaction reference ${transactionRef} not found`,
      );
    }

    this.logger.debug('Found invoice by transaction ref:', {
      invoiceId: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
      hasClient: !!invoice.client,
      hasCompany: !!invoice.company,
      clientId: invoice.client?.id,
      companyId: invoice.company?.id,
    });

    return invoice;
  }

  async markAsPaid(
    id: number,
    isGatewayPayment: boolean = false,
  ): Promise<Invoice> {
    const invoice = await this.findOne(id);

    if (invoice.status === InvoiceStatus.PAID) {
      throw new BadRequestException('Invoice is already paid');
    }

    // Ensure amount is a number
    const amount = Number(invoice.totalAmount);

    if (isNaN(amount)) {
      throw new Error(`Invalid invoice amount: ${invoice.totalAmount}`);
    }

    // Create transaction record
    await this.transactionService.create({
      amount, // Pass as number
      invoiceId: invoice.id,
      clientId: invoice.client.id,
      companyId: invoice.company.id,
      paymentType: isGatewayPayment ? PaymentType.GATEWAY : PaymentType.MANUAL,
      paymentReference: isGatewayPayment
        ? invoice.squadTransactionRef
        : undefined,
    });

    // Update invoice status
    invoice.status = InvoiceStatus.PAID;
    invoice.paidAt = new Date();
    await this.invoiceRepository.save(invoice);

    // Send confirmation email
    await this.emailService.sendPaymentConfirmationEmail(
      invoice.client.email,
      invoice.client.firstName,
      invoice.invoiceNumber,
      invoice.totalAmount,
    );

    return invoice;
  }

  async checkOverdueStatus(invoice: Invoice): Promise<void> {
    if (
      invoice.status === InvoiceStatus.UNPAID &&
      invoice.dueDate &&
      new Date() > new Date(invoice.dueDate)
    ) {
      invoice.status = InvoiceStatus.OVERDUE;
      await this.invoiceRepository.save(invoice);

      // Format the date properly for the email
      const dueDateObj = new Date(invoice.dueDate);
      // const formattedDueDate = dueDateObj.toLocaleDateString('en-NG', {
      //   weekday: 'long',
      //   year: 'numeric',
      //   month: 'long',
      //   day: 'numeric',
      // });

      // Send overdue notification
      await this.notificationService.createNotification(
        NotificationType.INVOICE_OVERDUE,
        invoice.company.id,
        'Invoice Overdue',
        `Invoice ${invoice.invoiceNumber} for ${invoice.client.firstName} ${invoice.client.lastName} is now overdue`,
        {
          invoiceId: invoice.id,
          dueDate: dueDateObj.toISOString(),
          amount: invoice.totalAmount,
          clientId: invoice.client.id,
        },
      );

      // await this.emailService.sendOverdueInvoiceEmail(
      //   invoice.client.email,
      //   invoice.client.firstName,
      //   invoice.invoiceNumber,
      //   invoice.totalAmount,
      //   formattedDueDate,
      //   invoice.paymentLink,
      // );
    }
  }

  private async calculateInvoiceStats(): Promise<InvoiceStatsDto> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Get overdue amount
    const overdueInvoices = await this.invoiceRepository.find({
      where: { status: InvoiceStatus.OVERDUE },
    });
    const overdue_amount = overdueInvoices.reduce(
      (sum, invoice) => sum + Number(invoice.totalAmount),
      0,
    );

    // Get drafted amount
    const draftedInvoices = await this.invoiceRepository.find({
      where: { status: InvoiceStatus.DRAFT },
    });
    const total_drafted_amount = draftedInvoices.reduce(
      (sum, invoice) => sum + Number(invoice.totalAmount),
      0,
    );

    // Get unpaid amount
    const unpaidInvoices = await this.invoiceRepository.find({
      where: { status: InvoiceStatus.UNPAID },
    });
    const unpaid_total = unpaidInvoices.reduce(
      (sum, invoice) => sum + Number(invoice.totalAmount),
      0,
    );

    // Calculate average payment time
    const paidInvoices = await this.invoiceRepository.find({
      where: { status: InvoiceStatus.PAID },
      select: ['createdAt', 'paidAt'],
    });

    let average_paid_time = 0;
    if (paidInvoices.length > 0) {
      const totalDays = paidInvoices.reduce((sum, invoice) => {
        const createdDate = new Date(invoice.createdAt);
        const paidDate = new Date(invoice.paidAt);
        const diffTime = Math.abs(paidDate.getTime() - createdDate.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return sum + diffDays;
      }, 0);
      average_paid_time = totalDays / paidInvoices.length;
    }

    // Get invoices sent today
    const total_invoices_sent_today = await this.invoiceRepository.count({
      where: {
        createdAt: MoreThanOrEqual(today),
        status: Not(InvoiceStatus.DRAFT),
      },
    });

    return {
      overdue_amount,
      total_drafted_amount,
      average_paid_time,
      unpaid_total,
      total_invoices_sent_today,
    };
  }
}
