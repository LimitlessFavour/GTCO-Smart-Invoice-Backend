import { Controller, Get, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AnalyticsService } from './analytics.service';
import { DashboardAnalyticsDto } from './dto/dashboard-analytics.dto';

@ApiTags('Analytics')
@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('dashboard/:companyId')
  @ApiOperation({ summary: 'Get dashboard analytics' })
  @ApiResponse({
    status: 200,
    description: 'Dashboard analytics data',
    type: DashboardAnalyticsDto,
  })
  async getDashboardAnalytics(
    @Param('companyId') companyId: number,
  ): Promise<DashboardAnalyticsDto> {
    return this.analyticsService.getDashboardAnalytics(companyId);
  }
}
