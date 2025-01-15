/* eslint-disable @typescript-eslint/no-unused-vars */
import {
  Controller,
  Post,
  Body,
  Headers,
  UnauthorizedException,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { SquadService } from '../services/gtco_squad.service';
import { InvoiceService } from '../invoice/invoice.service';
import { InvoiceStatus } from 'src/invoice/enums/invoice-status.enum';
import { EmailService } from 'src/services/email.service';
import { TransactionService } from '../transaction/transaction.service';
import { PaymentType } from '../transaction/transaction.entity';
import { ActivityService } from '../activity/activity.service';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ActivityType } from 'src/activity/activity.entity';
import { NotificationService } from '../notification/notification.service';
import { NotificationType } from '../notification/notification.entity';

@ApiTags('Webhooks')
@Controller('webhooks/squad')
export class SquadWebhookController {
  private readonly logger = new Logger(SquadWebhookController.name);

  constructor(
    private readonly squadService: SquadService,
    private readonly invoiceService: InvoiceService,
    private readonly emailService: EmailService,
    private readonly transactionService: TransactionService,
    private readonly activityService: ActivityService,
    private readonly notificationService: NotificationService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Handle Squad payment webhook' })
  @ApiResponse({ status: 200, description: 'Webhook processed successfully' })
  @ApiResponse({ status: 401, description: 'Invalid or missing signature' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async handleWebhook(
    @Headers('x-squad-encrypted-body') signature: string,
    @Body() payload: any,
  ) {
    this.logger.debug('Received Squad webhook:', {
      event: payload?.Event,
      transactionRef: payload?.TransactionRef,
      hasSignature: !!signature,
    });

    if (!signature) {
      this.logger.warn('Webhook received without signature');
      throw new UnauthorizedException('Missing webhook signature');
    }

    const isValidSignature = this.squadService.verifyWebhookSignature(
      payload,
      signature,
    );
    this.logger.debug('Webhook signature verification:', {
      isValid: isValidSignature,
    });

    if (!isValidSignature) {
      this.logger.warn('Invalid webhook signature received', {
        event: payload?.Event,
        transactionRef: payload?.TransactionRef,
      });
      throw new UnauthorizedException('Invalid webhook signature');
    }

    try {
      if (payload.Event === 'charge_successful' && payload.Body) {
        const { transaction_ref, transaction_status, merchant_amount } =
          payload.Body;

        if (transaction_status.toLowerCase() === 'success') {
          // Get invoice details
          const invoice =
            await this.invoiceService.findByTransactionRef(transaction_ref);

          // Create transaction record
          await this.transactionService.create({
            amount: merchant_amount / 100, // Convert from kobo to naira
            invoiceId: invoice.id,
            clientId: invoice.client.id,
            companyId: invoice.company.id,
            paymentType: PaymentType.GATEWAY,
            paymentReference: transaction_ref,
          });

          // Update invoice status
          await this.invoiceService.markAsPaid(invoice.id, true);

          // Record activity
          await this.activityService.create({
            type: ActivityType.PAYMENT_RECEIVED,
            entityId: invoice.id.toString(),
            entityType: 'INVOICE',
            companyId: invoice.company.id.toString(),
            metadata: {
              amount: merchant_amount / 100,
              transactionRef: transaction_ref,
              paymentType: 'GATEWAY',
            },
          });

          // Send notification
          await this.notificationService.createNotification(
            NotificationType.PAYMENT_RECEIVED,
            invoice.company.id,
            'Payment Received',
            `Payment of ₦${(merchant_amount / 100).toLocaleString('en-NG')} received for invoice ${invoice.invoiceNumber}`,
            {
              invoiceId: invoice.id,
              amount: merchant_amount / 100,
              transactionRef: transaction_ref,
            },
          );
        }
      }

      return { received: true };
    } catch (error) {
      this.logger.error('Error processing webhook:', error);
      throw new InternalServerErrorException('Failed to process webhook');
    }
  }
}
