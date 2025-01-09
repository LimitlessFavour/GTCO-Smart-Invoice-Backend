/* eslint-disable @typescript-eslint/no-unused-vars */
import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
// import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AnalyticsService } from './analytics.service';
import {
  DashboardAnalyticsDto,
  TimelineFilter,
} from './dto/dashboard-analytics.dto';

@ApiTags('Analytics')
@ApiBearerAuth()
// @UseGuards(JwtAuthGuard)
@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('dashboard/:companyId')
  @ApiOperation({
    summary: 'Get dashboard analytics',
    description:
      'Retrieves comprehensive dashboard analytics including payment timeline, invoice statistics, top paying clients, and top selling products',
  })
  @ApiParam({
    name: 'companyId',
    type: 'number',
    description: 'ID of the company to get analytics for',
    required: true,
  })
  @ApiQuery({
    name: 'timeline',
    enum: TimelineFilter,
    required: false,
    description: 'Time period for analytics data (defaults to LAST_MONTH)',
  })
  @ApiResponse({
    status: 200,
    description: 'Dashboard analytics data retrieved successfully',
    type: DashboardAnalyticsDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - JWT token is missing or invalid',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - User does not have access to this company',
  })
  async getDashboardAnalytics(
    @Param('companyId') companyId: number,
    @Query('timeline') timeline?: TimelineFilter,
  ): Promise<DashboardAnalyticsDto> {
    return this.analyticsService.getDashboardAnalytics(companyId, timeline);
  }
}
