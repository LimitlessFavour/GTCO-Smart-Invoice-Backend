import {
  Controller,
  Post,
  Delete,
  Get,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { NotificationService } from './notification.service';
import { RegisterDeviceDto } from './dto/register-device.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('Notifications')
@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @Post('devices')
  @ApiOperation({ summary: 'Register a device for notifications' })
  @ApiResponse({ status: 201, description: 'Device registered successfully' })
  async registerDevice(
    @Request() req,
    @Body() registerDeviceDto: RegisterDeviceDto,
  ) {
    return this.notificationService.registerDevice(
      req.user.companyId,
      registerDeviceDto,
    );
  }

  @Delete('devices/:token')
  @ApiOperation({ summary: 'Remove a device registration' })
  @ApiResponse({ status: 200, description: 'Device removed successfully' })
  async removeDevice(@Request() req, @Param('token') token: string) {
    await this.notificationService.removeDevice(req.user.companyId, token);
    return { message: 'Device removed successfully' };
  }

  @Get('devices')
  @ApiOperation({ summary: 'Get all registered devices' })
  @ApiResponse({ status: 200, description: 'List of registered devices' })
  async getDevices(@Request() req) {
    return this.notificationService.getDeviceTokens(req.user.companyId);
  }

  @Get('unread')
  @ApiOperation({ summary: 'Get unread notifications' })
  @ApiResponse({ status: 200, description: 'List of unread notifications' })
  async getUnreadNotifications(@Request() req) {
    return this.notificationService.getUnreadNotifications(req.user.companyId);
  }

  @Post(':id/read')
  @ApiOperation({ summary: 'Mark notification as read' })
  @ApiResponse({ status: 200, description: 'Notification marked as read' })
  async markAsRead(@Param('id') id: number) {
    await this.notificationService.markAsRead(id);
    return { message: 'Notification marked as read' };
  }
}
