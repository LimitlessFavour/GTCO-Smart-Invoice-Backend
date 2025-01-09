import {
  Injectable,
  InternalServerErrorException,
  BadRequestException,
  Logger,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import * as crypto from 'crypto';
import { InvoiceService } from 'src/invoice/invoice.service';

@Injectable()
export class SquadService {
  private squadBaseUrl: string;
  private squadPaymentUrl: string;
  private squadSecretKey: string;
  private squadPublicKey: string;

  private readonly logger = new Logger(SquadService.name);

  constructor(
    private configService: ConfigService,
    @Inject(forwardRef(() => InvoiceService))
    private invoiceService: InvoiceService,
  ) {
    this.squadBaseUrl = this.configService.get('SQUAD_BASE_URL');
    this.squadPaymentUrl = this.configService.get('SQUAD_PAYMENT_URL');
    this.squadSecretKey = this.configService.get<string>('SQUAD_SECRET_KEY');
    this.squadPublicKey = this.configService.get<string>('SQUAD_PUBLIC_KEY');
  }

  async createPaymentLink(
    amount: number,
    email: string,
    description: string,
    transactionRef: string,
  ): Promise<{ paymentUrl: string; squadRef: string }> {
    try {
      this.logger.debug('Creating payment link with data:', {
        amount,
        email,
        description,
        transactionRef,
      });

      if (amount <= 0) {
        throw new BadRequestException('Amount must be greater than 0');
      }

      const payload = {
        amount: Math.round(amount * 100), // Convert to kobo
        email: email,
        currency: 'NGN',
        initiate_type: 'inline',
        transaction_ref: transactionRef,
        callback_url: this.configService.get('SQUAD_RETURN_URL'),
      };

      this.logger.debug('Squad API request payload:', payload);

      const response = await axios.post(
        `${this.squadBaseUrl}/transaction/initiate`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${this.squadSecretKey}`,
            'Content-Type': 'application/json',
          },
        },
      );

      this.logger.debug('Squad API response:', {
        status: response.status,
        data: response.data,
      });

      if (response.data?.status !== 200) {
        throw new Error('Failed to create payment link');
      }

      const squadRef = response.data?.data?.transaction_ref;
      const paymentUrl = response.data?.data?.checkout_url;

      if (!squadRef || !paymentUrl) {
        throw new Error('Invalid response from Squad API');
      }

      await this.invoiceService.updateSquadTransactionRef(
        transactionRef,
        squadRef,
      );

      return {
        paymentUrl,
        squadRef,
      };
    } catch (error) {
      this.logger.error(
        `Error creating payment link:`,
        {
          error: error.response?.data || error.message,
          status: error.response?.status,
          config: {
            url: error.config?.url,
            method: error.config?.method,
            headers: error.config?.headers,
          },
        },
        'createPaymentLink',
      );

      if (axios.isAxiosError(error)) {
        throw new InternalServerErrorException(
          `Payment provider error: ${error.response?.data?.message || error.message}`,
        );
      }
      throw error;
    }
  }

  verifyWebhookSignature(payload: any, signature: string): boolean {
    try {
      this.logger.debug('Verifying webhook signature:', {
        hasPayload: !!payload,
        hasSignature: !!signature,
      });

      const hash = crypto
        .createHmac('sha512', this.squadSecretKey)
        .update(JSON.stringify(payload))
        .digest('hex')
        .toUpperCase();

      const isValid = hash === signature;
      this.logger.debug('Webhook signature verification:', {
        isValid,
        computedHash: hash,
        receivedSignature: signature,
      });

      return isValid;
    } catch (error) {
      this.logger.error(
        'Error verifying webhook signature:',
        error?.stack,
        'verifyWebhookSignature',
      );
      return false;
    }
  }

  async verifyTransaction(transactionRef: string) {
    try {
      const response = await axios.get(
        `${this.squadBaseUrl}/transaction/verify/${transactionRef}`,
        {
          headers: {
            Authorization: `Bearer ${this.squadSecretKey}`,
          },
        },
      );

      return response.data;
    } catch (error) {
      console.error('Error verifying transaction:', error);
      throw new InternalServerErrorException('Failed to verify transaction.');
    }
  }
}
