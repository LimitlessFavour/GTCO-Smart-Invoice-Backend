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
    this.logger.debug('Received Squad webhook payload:', {
      fullPayload: payload,
      signature: signature?.substring(0, 10) + '...', // Log partial signature for security
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

        this.logger.debug('Processing successful charge:', {
          transaction_ref,
          transaction_status,
          merchant_amount,
        });

        if (transaction_status.toLowerCase() === 'success') {
          try {
            // Get invoice details
            const invoice =
              await this.invoiceService.findByTransactionRef(transaction_ref);

            this.logger.debug('Found invoice:', {
              invoiceId: invoice?.id,
              invoiceNumber: invoice?.invoiceNumber,
              clientId: invoice?.client?.id,
              companyId: invoice?.company?.id,
              hasClient: !!invoice?.client,
              hasCompany: !!invoice?.company,
            });

            if (!invoice) {
              throw new Error(
                `Invoice not found for transaction ref: ${transaction_ref}`,
              );
            }

            if (!invoice.company) {
              throw new Error(
                `Company relation not loaded for invoice: ${invoice.id}`,
              );
            }

            if (!invoice.client) {
              throw new Error(
                `Client relation not loaded for invoice: ${invoice.id}`,
              );
            }

            // Convert amount from kobo to naira and ensure it's a valid number
            // const amountInNaira = (merchant_amount / 100).toFixed(2);
            // eslint-disable-next-line prefer-const
            const amountInNaira = Number((merchant_amount / 100).toFixed(2));

            this.logger.debug('Processing payment amount:', {
              originalAmount: merchant_amount,
              convertedAmount: amountInNaira,
              type: typeof amountInNaira,
            });

            if (isNaN(amountInNaira)) {
              throw new Error(`Invalid amount received: ${merchant_amount}`);
            }

            // Create transaction record with properly formatted amount
            const transaction = await this.transactionService.create({
              amount: amountInNaira, // Pass the numeric value directly
              invoiceId: invoice.id,
              clientId: invoice.client.id,
              companyId: invoice.company.id,
              paymentType: PaymentType.GATEWAY,
              paymentReference: transaction_ref,
            });

            this.logger.debug('Created transaction record:', {
              transactionId: transaction.id,
              amount: amountInNaira,
            });

            // Update invoice status
            const updatedInvoice = await this.invoiceService.markAsPaid(
              invoice.id,
              true,
            );

            this.logger.debug('Updated invoice status:', {
              invoiceId: updatedInvoice.id,
              newStatus: updatedInvoice.status,
            });

            // Record activity
            await this.activityService.create({
              type: ActivityType.PAYMENT_RECEIVED,
              entityId: invoice.id.toString(),
              entityType: 'INVOICE',
              companyId: invoice.company.id.toString(),
              metadata: {
                amount: amountInNaira,
                // amount: numericAmount,
                transactionRef: transaction_ref,
                paymentType: 'GATEWAY',
              },
            });

            // Send notification
            await this.notificationService.createNotification(
              NotificationType.PAYMENT_RECEIVED,
              invoice.company.id,
              'Payment Received',
              `Payment of ₦${amountInNaira.toLocaleString('en-NG')} received for invoice ${invoice.invoiceNumber}`,
              {
                invoiceId: invoice.id,
                amount: amountInNaira,
                transactionRef: transaction_ref,
              },
            );
          } catch (error) {
            this.logger.error('Error processing successful payment:', {
              error: error.message,
              stack: error.stack,
              transaction_ref,
              fullError: error,
            });
            throw error;
          }
        }
      }

      return { received: true };
    } catch (error) {
      this.logger.error('Error processing webhook:', {
        error: error.message,
        stack: error.stack,
        payload: payload,
      });
      throw new InternalServerErrorException(
        'Failed to process webhook: ' + error.message,
      );
    }
  }
}
