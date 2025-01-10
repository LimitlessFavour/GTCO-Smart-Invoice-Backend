import { Controller, Get, Query, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ActivityService } from './activity.service';
import { Activity } from './activity.entity';

@ApiTags('Activities')
@Controller('activities')
export class ActivityController {
  constructor(private readonly activityService: ActivityService) {}

  @Get('company/:companyId')
  @ApiOperation({ summary: 'Get company activities' })
  @ApiResponse({ status: 200, type: [Activity] })
  async getCompanyActivities(
    @Param('companyId') companyId: number,
    @Query('startDate') startDate?: Date,
    @Query('endDate') endDate?: Date,
  ) {
    return this.activityService.findByCompany(companyId, startDate, endDate);
  }

  @Get('company/:companyId/type/:entityType')
  @ApiOperation({ summary: 'Get activities by entity type' })
  @ApiResponse({ status: 200, type: [Activity] })
  async getActivitiesByType(
    @Param('companyId') companyId: number,
    @Param('entityType') entityType: string,
  ) {
    return this.activityService.findByEntityType(companyId, entityType);
  }
}
