import { Controller, Post, Delete } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { MockDataService } from './mock-data.service';

@ApiTags('mock-data')
@Controller('mock-data')
export class MockDataController {
  constructor(private readonly mockDataService: MockDataService) {}

  @Post('generate')
  @ApiOperation({ summary: 'Generate mock data for testing' })
  @ApiResponse({
    status: 201,
    description: 'Mock data generated successfully',
  })
  async generateMockData() {
    return this.mockDataService.generateMockData();
  }

  @Delete('clear')
  @ApiOperation({ summary: 'Clear all mock data' })
  @ApiResponse({
    status: 200,
    description: 'Mock data cleared successfully',
  })
  async clearMockData() {
    return this.mockDataService.clearMockData();
  }
}
