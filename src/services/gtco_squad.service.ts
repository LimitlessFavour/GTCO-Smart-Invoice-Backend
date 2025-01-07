import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import * as crypto from 'crypto';

@Injectable()
export class SquadService {
  private squadBaseUrl: string;
  private squadSecretKey: string;
  private squadPublicKey: string;

  constructor(private configService: ConfigService) {
    // Use sandbox URL for development, api-d.squadco.com for production
    this.squadBaseUrl = 'https://sandbox-api-d.squadco.com';
    this.squadSecretKey = this.configService.get<string>('SQUAD_SECRET_KEY');
    this.squadPublicKey = this.configService.get<string>('SQUAD_PUBLIC_KEY');

    if (!this.squadSecretKey || !this.squadPublicKey) {
      throw new Error('Squad API keys not configured.');
    }
  }

  async createPaymentLink(
    amount: number,
    email: string,
    description: string,
    transactionRef?: string,
  ): Promise<string> {
    try {
      const response = await axios.post(
        `${this.squadBaseUrl}/payment/initiate`,
        {
          amount: amount * 100, // Convert to kobo
          email,
          currency: 'NGN',
          initiate_type: 'inline',
          transaction_ref: transactionRef,
          callback_url: this.configService.get('SQUAD_WEBHOOK_URL'),
          metadata: {
            description,
          },
        },
        {
          headers: {
            Authorization: `Bearer ${this.squadSecretKey}`,
            'Content-Type': 'application/json',
          },
        },
      );

      return response.data.data.checkout_url;
    } catch (error) {
      console.error('Error creating payment link:', error);
      throw new InternalServerErrorException('Failed to create payment link.');
    }
  }

  verifyWebhookSignature(payload: any, signature: string): boolean {
    try {
      const hash = crypto
        .createHmac('sha512', this.squadSecretKey)
        .update(JSON.stringify(payload))
        .digest('hex');

      return hash === signature;
    } catch (error) {
      console.error('Error verifying webhook signature:', error);
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
