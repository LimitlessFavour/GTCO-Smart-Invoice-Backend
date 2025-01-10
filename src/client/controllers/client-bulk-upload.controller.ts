import {
  Controller,
  Post,
  Get,
  Param,
  Body,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  Logger,
  Req,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiConsumes,
  ApiBearerAuth,
  ApiBody,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { ClientBulkUploadService } from '../services/client-bulk-upload.service';
import { BulkClientUploadConfigDto } from '../dto/bulk-client-upload.dto';
import { RequestContext } from '../../common/interfaces/request-context.interface';

@ApiTags('Client')
@Controller('client/bulk-upload')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
export class ClientBulkUploadController {
  private readonly logger = new Logger(ClientBulkUploadController.name);

  constructor(private readonly bulkUploadService: ClientBulkUploadService) {}

  @Post('validate')
  @ApiOperation({ summary: 'Validate client bulk upload file' })
  @ApiResponse({ status: 200, description: 'File validated successfully' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'CSV file containing client data',
        },
      },
    },
  })
  @UseInterceptors(FileInterceptor('file'))
  async validateFile(@UploadedFile() file: Express.Multer.File) {
    this.logger.debug('Validating client bulk upload file');
    return this.bulkUploadService.validateFile(file);
  }

  @Post()
  @ApiOperation({ summary: 'Start client bulk upload process' })
  @ApiResponse({ status: 201, description: 'Bulk upload job created' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['file', 'columnMapping'],
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'CSV file containing client data',
        },
        columnMapping: {
          type: 'object',
          properties: {
            firstName: { type: 'string', example: 'First Name' },
            lastName: { type: 'string', example: 'Last Name' },
            email: { type: 'string', example: 'Email' },
            phoneNumber: { type: 'string', example: 'Phone Number' },
            address: { type: 'string', example: 'Address' },
          },
        },
        defaultValues: {
          type: 'object',
          properties: {},
        },
        batchSize: { type: 'number', example: 100 },
      },
    },
  })
  @UseInterceptors(FileInterceptor('file'))
  async startBulkUpload(
    @UploadedFile() file: Express.Multer.File,
    @Body() config: BulkClientUploadConfigDto,
    @Req() req: Request & { user: RequestContext['user'] },
  ) {
    this.logger.debug(
      `Starting client bulk upload for company: ${req.user.company.id}`,
    );
    const job = await this.bulkUploadService.createBulkUploadJob(
      file,
      config,
      req.user.company.id,
    );

    // Start processing in background
    this.bulkUploadService.processJob(job.id).catch((error) => {
      this.logger.error(
        `Background processing failed for job ${job.id}`,
        error?.stack || 'No stack trace',
        'startBulkUpload',
      );
    });

    return { jobId: job.id };
  }

  @Get(':jobId/status')
  @ApiOperation({ summary: 'Get client bulk upload job status' })
  @ApiResponse({ status: 200, description: 'Returns job status' })
  async getJobStatus(@Param('jobId') jobId: string) {
    this.logger.debug(`Fetching status for client job: ${jobId}`);
    return this.bulkUploadService.getJobStatus(jobId);
  }

  @Get(':jobId/errors')
  @ApiOperation({ summary: 'Get client bulk upload job errors' })
  @ApiResponse({ status: 200, description: 'Returns job errors' })
  async getJobErrors(@Param('jobId') jobId: string) {
    this.logger.debug(`Fetching errors for client job: ${jobId}`);
    return this.bulkUploadService.getJobErrors(jobId);
  }
}
