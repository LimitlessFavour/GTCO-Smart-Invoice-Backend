import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NotificationService } from './notification.service';
import { NotificationController } from './notification.controller';
import { Notification } from './notification.entity';
import { DeviceToken } from './device-token.entity';
import { ConfigModule } from '@nestjs/config';
import { FirebaseService } from '../services/firebase.service';

@Module({
  imports: [
    ConfigModule,
    TypeOrmModule.forFeature([Notification, DeviceToken]),
  ],
  controllers: [NotificationController],
  providers: [NotificationService, FirebaseService],
  exports: [NotificationService],
})
export class NotificationModule {}
