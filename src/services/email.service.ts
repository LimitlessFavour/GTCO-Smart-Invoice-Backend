/* eslint-disable @typescript-eslint/no-unused-vars */
import {
  Injectable,
  Logger,
  UnprocessableEntityException,
  InternalServerErrorException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import {
  paymentTemplates,
  invoiceTemplates,
  authTemplates,
} from './email-templates/index';

@Injectable()
export class EmailService {
  private transporter: nodemailer.Transporter;
  private readonly companyName: string;
  private readonly logger = new Logger(EmailService.name);

  constructor(private configService: ConfigService) {
    this.initializeTransporter();

    // Verify connection configuration
    this.transporter.verify((error, success) => {
      if (error) {
        this.logger.error('SMTP Connection Error:', error);
      } else {
        this.logger.log('Server is ready to take our messages');
        this.logger.log('SMTP Connection Success:', success);
      }
    });

    this.companyName = this.configService.get(
      'COMPANY_NAME',
      'GTCO SmartInvoice',
    );
  }

  private async initializeTransporter() {
    try {
      this.transporter = nodemailer.createTransport({
        host: this.configService.get('SMTP_HOST'),
        port: this.configService.get('SMTP_PORT'),
        secure: false,
        auth: {
          user: this.configService.get('SMTP_USER'),
          pass: this.configService.get('SMTP_PASSWORD'),
        },
        tls: {
          rejectUnauthorized: false,
          ciphers: 'SSLv3',
        },
        pool: true,
        maxConnections: 3,
        maxMessages: 50,
        rateDelta: 1000,
        rateLimit: 3,
        // Add reconnect settings
        reconnectOnError: (err) => {
          this.logger.error('SMTP Connection Error:', err);
          return true;
        },
      });

      // Test the connection
      await this.transporter.verify();
      this.logger.log('SMTP Connection established successfully');
    } catch (error) {
      this.logger.error('Failed to initialize email transporter:', error);
      // Attempt to reinitialize after 5 seconds
      setTimeout(() => this.initializeTransporter(), 5000);
    }
  }

  async sendWelcomeEmail(to: string, name: string): Promise<void> {
    const mailOptions = {
      from: `"${this.companyName}" <${this.configService.get('SMTP_USER')}>`,
      to,
      subject: 'Welcome to GTCO SmartInvoice',
      html: authTemplates.welcome({ name, companyName: this.companyName }),
    };

    await this.transporter.sendMail(mailOptions);
  }

  async sendInvoiceEmail(
    to: string,
    name: string,
    pdfPath: string,
    paymentLink: string,
    invoiceNumber: string,
    dueDate?: string,
  ): Promise<void> {
    const mailOptions = {
      from: `"${this.companyName}" <${this.configService.get('SMTP_USER')}>`,
      to,
      subject: `Invoice #${invoiceNumber} from ${this.companyName}`,
      html: invoiceTemplates.invoiceCreated({
        name,
        paymentLink,
        companyName: this.companyName,
        invoiceNumber,
        dueDate,
      }),
      attachments: [
        {
          filename: `invoice-${invoiceNumber}.pdf`,
          path: pdfPath,
        },
      ],
    };

    try {
      await this.transporter.sendMail(mailOptions);
    } catch (error) {
      if (error.message?.includes('recipient is suppressed')) {
        throw new UnprocessableEntityException(
          'Unable to send invoice email: recipient email address is blocked or invalid',
        );
      }
      throw new InternalServerErrorException(
        'Failed to send invoice email: ' + error.message,
      );
    }
  }

  async sendPaymentConfirmationEmail(
    to: string,
    name: string,
    invoiceNumber: string,
    amount: number,
  ): Promise<void> {
    const mailOptions = {
      from: `"${this.companyName}" <${this.configService.get('SMTP_USER')}>`,
      to,
      subject: `Payment Confirmed - Invoice #${invoiceNumber}`,
      html: paymentTemplates.paymentConfirmation({
        name,
        invoiceNumber,
        amount,
        date: new Date().toLocaleDateString('en-NG', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        }),
        companyName: this.companyName,
      }),
    };

    try {
      await this.transporter.sendMail(mailOptions);
    } catch (error) {
      console.error('Error sending payment confirmation email:', error);
      throw new Error('Failed to send payment confirmation email');
    }
  }

  async sendOverdueInvoiceEmail(
    to: string,
    name: string,
    invoiceNumber: string,
    amount: number,
    dueDate: string,
    paymentLink: string,
  ): Promise<void> {
    const mailOptions = {
      from: `"${this.companyName}" <${this.configService.get('SMTP_USER')}>`,
      to,
      subject: `Invoice #${invoiceNumber} Overdue`,
      html: invoiceTemplates.overdueInvoice({
        name,
        invoiceNumber,
        amount,
        dueDate,
        paymentLink,
        companyName: this.companyName,
      }),
    };

    await this.transporter.sendMail(mailOptions);
  }

  async sendPasswordResetEmail(
    to: string,
    name: string,
    resetLink: string,
  ): Promise<void> {
    const mailOptions = {
      from: `"${this.companyName}" <${this.configService.get('SMTP_USER')}>`,
      to,
      subject: 'Reset Your Password - GTCO SmartInvoice',
      html: authTemplates.resetPassword({ name, resetLink }),
    };

    try {
      await this.transporter.sendMail(mailOptions);
    } catch (error) {
      this.logger.error('Error sending password reset email:', error);
      throw new Error('Failed to send password reset email');
    }
  }

  // Helper method to format currency
  private formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
    }).format(amount);
  }
}
