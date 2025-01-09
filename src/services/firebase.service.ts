import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as admin from 'firebase-admin';

@Injectable()
export class FirebaseService implements OnModuleInit {
  private readonly logger = new Logger(FirebaseService.name);

  constructor(private configService: ConfigService) {}

  onModuleInit() {
    try {
      const serviceAccount = this.configService.get('FIREBASE_SERVICE_ACCOUNT');

      if (!serviceAccount) {
        this.logger.warn(
          'Firebase service account not configured - notifications will be disabled',
        );
        return;
      }

      if (!admin.apps.length) {
        let parsedServiceAccount;
        try {
          parsedServiceAccount = JSON.parse(serviceAccount);
        } catch (error) {
          this.logger.error(
            'Failed to parse Firebase service account JSON',
            error,
          );
          return;
        }

        admin.initializeApp({
          credential: admin.credential.cert(parsedServiceAccount),
        });
        this.logger.log('Firebase initialized successfully');
      }
    } catch (error) {
      this.logger.error('Failed to initialize Firebase', error);
    }
  }

  async sendMulticastNotification(
    tokens: string[],
    title: string,
    body: string,
    data?: Record<string, string>,
  ) {
    if (!tokens.length || !admin.apps.length) return;

    try {
      const message: admin.messaging.MulticastMessage = {
        tokens,
        notification: {
          title,
          body,
        },
        data: data ? this.stringifyData(data) : undefined,
      };

      return await admin.messaging().sendEachForMulticast(message);
    } catch (error) {
      this.logger.error('Failed to send notification', error);
    }
  }

  private stringifyData(data: Record<string, any>): Record<string, string> {
    return Object.entries(data).reduce(
      (acc, [key, value]) => {
        acc[key] = typeof value === 'string' ? value : JSON.stringify(value);
        return acc;
      },
      {} as Record<string, string>,
    );
  }
}
