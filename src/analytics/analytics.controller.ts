/* eslint-disable @typescript-eslint/no-unused-vars */
import { Controller, Get, Query, UseGuards, Req } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import {
  DashboardAnalyticsDto,
  TimelineFilter,
} from './dto/dashboard-analytics.dto';
import { Request } from 'express';
import { UserService } from '../user/user.service';
import { RequestContext } from 'src/common/interfaces/request-context.interface';
import { AnalyticsService } from './analytics.service';

@ApiTags('Analytics')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('analytics')
export class AnalyticsController {
  constructor(
    private readonly analyticsService: AnalyticsService,
    private readonly userService: UserService,
  ) {}

  @Get('dashboard')
  @ApiOperation({
    summary: 'Get dashboard analytics',
    description: 'Retrieves comprehensive dashboard analytics',
  })
  @ApiQuery({
    name: 'paymentsTimeline',
    enum: TimelineFilter,
    required: false,
    description: 'Time period for payments data',
  })
  @ApiQuery({
    name: 'invoicesTimeline',
    enum: TimelineFilter,
    required: false,
    description: 'Time period for invoices data',
  })
  async getDashboardAnalytics(
    // @Req() request: Request,
    @Req() request: Request & { user: RequestContext['user'] },
    @Query('paymentsTimeline') paymentsTimeline?: TimelineFilter,
    @Query('invoicesTimeline') invoicesTimeline?: TimelineFilter,
  ): Promise<DashboardAnalyticsDto> {
    const user = request.user as any;
    const company = await this.userService.getCompanyDetails(user.sub);

    return this.analyticsService.getDashboardAnalytics(
      company.id,
      paymentsTimeline,
      invoicesTimeline,
    );
  }
}
