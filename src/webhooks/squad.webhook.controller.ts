import {
  Controller,
  Post,
  Body,
  Headers,
  UnauthorizedException,
  InternalServerErrorException,
} from '@nestjs/common';
import { SquadService } from '../services/gtco_squad.service';
import { InvoiceService } from '../invoice/invoice.service';
import { InvoiceStatus } from 'src/invoice/enums/invoice-status.enum';

@Controller('webhooks/squad')
export class SquadWebhookController {
  constructor(
    private readonly squadService: SquadService,
    private readonly invoiceService: InvoiceService,
  ) {}

  @Post()
  async handleWebhook(
    @Headers('x-squad-signature') signature: string,
    @Body() payload: any,
  ) {
    // Verify webhook signature
    if (!this.squadService.verifyWebhookSignature(payload, signature)) {
      throw new UnauthorizedException('Invalid webhook signature');
    }

    try {
      // Handle successful payment
      if (payload.Event === 'charge_successful') {
        const { transaction_ref, transaction_status, amount } = payload.Body;

        if (transaction_status === 'Success') {
          // Update invoice status
          await this.invoiceService.updateInvoiceStatus(
            transaction_ref,
            InvoiceStatus.PAID,
            amount / 100, // Convert from kobo back to naira
          );
        }
      }

      return { received: true };
    } catch (error) {
      console.error('Error processing webhook:', error);
      throw new InternalServerErrorException('Failed to process webhook');
    }
  }
}
