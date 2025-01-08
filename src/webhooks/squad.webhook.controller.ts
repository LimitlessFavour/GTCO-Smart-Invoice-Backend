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

@Controller('webhooks/squad')
export class SquadWebhookController {
  private readonly logger = new Logger(SquadWebhookController.name);

  constructor(
    private readonly squadService: SquadService,
    private readonly invoiceService: InvoiceService,
    private readonly emailService: EmailService,
  ) {}

  @Post()
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
      throw new UnauthorizedException('Missing webhook signature');
    }

    if (!this.squadService.verifyWebhookSignature(payload, signature)) {
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
        error?.stack,
        'handleWebhook',
      );
      throw new InternalServerErrorException('Failed to process webhook');
    }
  }
}
