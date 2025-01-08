import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { emailTemplates } from './email-templates';

@Injectable()
export class EmailService {
  private transporter: nodemailer.Transporter;
  private readonly companyName: string;
  private readonly logger = new Logger(EmailService.name);

  constructor(private configService: ConfigService) {
    this.transporter = nodemailer.createTransport({
      host: this.configService.get('EMAIL_HOST'),
      port: this.configService.get('EMAIL_PORT'),
      secure: false, // upgrade later with STARTTLS
      auth: {
        user: this.configService.get('EMAIL_USER'),
        pass: this.configService.get('EMAIL_PASSWORD'),
      },
    });

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

  async sendWelcomeEmail(to: string, name: string): Promise<void> {
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to,
      subject: 'Welcome to GTCO SmartInvoice',
      text: `Hi ${name},\n\nWelcome to GTCO SmartInvoice! We're excited to have you on board.\n\nBest regards,\nThe GTCO Team`,
    };

    await this.transporter.sendMail(mailOptions);
  }

  async sendInvoiceEmail(
    to: string,
    name: string,
    pdfPath: string,
    paymentLink: string,
  ): Promise<void> {
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to,
      subject: 'Your Invoice from GTCO SmartInvoice',
      text: `Hi ${name},\n\nPlease find your invoice attached. You can complete your payment here: ${paymentLink}.\n\nBest regards,\nThe GTCO Team`,
      attachments: [
        {
          filename: 'invoice.pdf',
          path: pdfPath,
        },
      ],
    };

    await this.transporter.sendMail(mailOptions);
  }

  async sendPaymentConfirmationEmail(
    to: string,
    name: string,
    invoiceNumber: string,
    amount: number,
  ): Promise<void> {
    const mailOptions = {
      from: `"${this.companyName}" <${this.configService.get('EMAIL_USER')}>`,
      to,
      subject: `Payment Confirmed - Invoice #${invoiceNumber}`,
      html: emailTemplates.paymentConfirmation({
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

  // Helper method to format currency
  private formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
    }).format(amount);
  }
}
