import {
  Injectable,
  InternalServerErrorException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import * as crypto from 'crypto';

@Injectable()
export class SquadService {
  private squadBaseUrl: string;
  private squadPaymentUrl: string;
  private squadSecretKey: string;
  private squadPublicKey: string;

  private readonly logger = new Logger(SquadService.name);

  constructor(private configService: ConfigService) {
    this.squadBaseUrl = 'https://sandbox-api-d.squadco.com';
    this.squadPaymentUrl = 'https://sandbox-pay.squadco.com';
    this.squadSecretKey = this.configService.get<string>('SQUAD_SECRET_KEY');
    this.squadPublicKey = this.configService.get<string>('SQUAD_PUBLIC_KEY');
  }

  private generateUniqueHash(): string {
    // Generate a random string using crypto instead of nanoid
    return crypto.randomBytes(8).toString('hex');
  }

  async createPaymentLink(
    amount: number,
    email: string,
    description: string,
    transactionRef?: string,
  ): Promise<string> {
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

      const hash = this.generateUniqueHash();

      const payload = {
        name: 'Invoice Payment',
        hash: hash,
        link_status: 1,
        expire_by: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        amounts: [
          {
            amount: Math.round(amount * 100),
            currency_id: 'NGN',
          },
        ],
        description: description,
        redirect_link: this.configService.get('SQUAD_RETURN_URL'),
        return_msg: 'Payment Successful',
      };

      this.logger.debug('Squad API request payload:', payload);
      this.logger.debug('Squad API configuration:', {
        baseUrl: this.squadBaseUrl,
        hasSecretKey: !!this.squadSecretKey,
        returnUrl: this.configService.get('SQUAD_RETURN_URL'),
      });

      const response = await axios.post(
        `${this.squadBaseUrl}/payment_link/otp`,
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

      if (!response.data?.success) {
        throw new Error('Failed to create payment link');
      }

      const paymentUrl = `${this.squadPaymentUrl}/${hash}`;
      return paymentUrl;
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
