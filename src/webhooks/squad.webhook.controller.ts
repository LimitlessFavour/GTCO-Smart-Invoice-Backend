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
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('Webhooks')
@Controller('webhooks/squad')
export class SquadWebhookController {
  private readonly logger = new Logger(SquadWebhookController.name);

  constructor(
    private readonly squadService: SquadService,
    private readonly invoiceService: InvoiceService,
    private readonly emailService: EmailService,
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
        const {
          transaction_ref,
          transaction_status,
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          amount,
          email,
          merchant_amount,
          transaction_type,
        } = payload.Body;

        this.logger.debug('Processing successful payment:', {
          transactionRef: transaction_ref,
          status: transaction_status,
          amount: merchant_amount,
          type: transaction_type,
        });

        if (transaction_status === 'Success') {
          // Update invoice status
          const invoice = await this.invoiceService.updateInvoiceStatus(
            transaction_ref,
            InvoiceStatus.PAID,
            merchant_amount / 100, // Convert from kobo to naira
          );

          // Send payment confirmation email
          if (invoice) {
            await this.emailService.sendPaymentConfirmationEmail(
              email,
              invoice.client.firstName,
              invoice.invoiceNumber,
              merchant_amount / 100,
            );
          }
        }
      }

      return { received: true };
    } catch (error) {
      this.logger.error(
        'Error processing webhook:',
        {
          error: error?.message,
          stack: error?.stack,
          event: payload?.Event,
          transactionRef: payload?.TransactionRef,
        },
        'handleWebhook',
      );
      throw new InternalServerErrorException('Failed to process webhook');
    }
  }
}
