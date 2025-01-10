import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification, NotificationType } from './notification.entity';
import { DeviceToken } from './device-token.entity';
import { RegisterDeviceDto } from './dto/register-device.dto';
import { FirebaseService } from '../services/firebase.service';

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);

  constructor(
    @InjectRepository(Notification)
    private notificationRepository: Repository<Notification>,
    @InjectRepository(DeviceToken)
    private deviceTokenRepository: Repository<DeviceToken>,
    private firebaseService: FirebaseService,
  ) {}

  async registerDevice(
    companyId: number,
    registerDeviceDto: RegisterDeviceDto,
  ): Promise<DeviceToken> {
    const deviceToken = this.deviceTokenRepository.create({
      ...registerDeviceDto,
      companyId,
    });
    return this.deviceTokenRepository.save(deviceToken);
  }

  async removeDevice(companyId: number, token: string): Promise<void> {
    await this.deviceTokenRepository.delete({
      companyId,
      token,
    });
  }

  async getDeviceTokens(companyId: number): Promise<DeviceToken[]> {
    return this.deviceTokenRepository.find({
      where: { companyId },
    });
  }

  async createNotification(
    type: NotificationType,
    companyId: number,
    title: string,
    message: string,
    metadata?: Record<string, any>,
  ): Promise<void> {
    // Create notification record
    const notification = this.notificationRepository.create({
      type,
      companyId,
      title,
      message,
      metadata,
    });
    await this.notificationRepository.save(notification);

    // Get company's device tokens
    const deviceTokens = await this.getDeviceTokens(companyId);
    const tokens = deviceTokens.map((dt) => dt.token);

    if (tokens.length > 0) {
      try {
        await this.firebaseService.sendMulticastNotification(
          tokens,
          title,
          message,
          {
            type,
            ...metadata,
          },
        );
      } catch (error) {
        this.logger.error(`Failed to send push notification: ${error.message}`);
        // Consider implementing a retry mechanism here
      }
    }
  }

  async markAsRead(notificationId: number): Promise<void> {
    await this.notificationRepository.update(notificationId, { isRead: true });
  }

  async getUnreadNotifications(companyId: number): Promise<Notification[]> {
    return this.notificationRepository.find({
      where: {
        companyId,
        isRead: false,
      },
      order: {
        createdAt: 'DESC',
      },
    });
  }
}
