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
import { BulkUploadService } from '../services/bulk-upload.service';
import { BulkUploadConfigDto } from '../dto/bulk-upload.dto';
import { RequestContext } from '../../common/interfaces/request-context.interface';
import { ProductCategory } from '../enums/product-category.enum';
import { VatCategory } from '../enums/vat-category.enum';

@ApiTags('Product')
@Controller('product/bulk-upload')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
export class BulkUploadController {
  private readonly logger = new Logger(BulkUploadController.name);

  constructor(private readonly bulkUploadService: BulkUploadService) {}

  @Post('validate')
  @ApiOperation({ summary: 'Validate bulk upload file' })
  @ApiResponse({ status: 200, description: 'File validated successfully' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'CSV file containing product data',
        },
      },
    },
  })
  @UseInterceptors(FileInterceptor('file'))
  async validateFile(@UploadedFile() file: Express.Multer.File) {
    this.logger.debug('Validating bulk upload file');
    return this.bulkUploadService.validateFile(file);
  }

  @Post()
  @ApiOperation({ summary: 'Start bulk upload process' })
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
          description: 'CSV file containing product data',
        },
        columnMapping: {
          type: 'object',
          properties: {
            productName: { type: 'string', example: 'Product Name' },
            description: { type: 'string', example: 'Description' },
            category: { type: 'string', example: 'Category' },
            price: { type: 'string', example: 'Price' },
            defaultQuantity: { type: 'string', example: 'Quantity' },
            vatCategory: { type: 'string', example: 'VAT' },
          },
        },
        defaultValues: {
          type: 'object',
          properties: {
            category: { type: 'string', enum: Object.values(ProductCategory) },
            vatCategory: { type: 'string', enum: Object.values(VatCategory) },
            defaultQuantity: { type: 'number', example: 1 },
          },
        },
        batchSize: { type: 'number', example: 100 },
      },
    },
  })
  @UseInterceptors(FileInterceptor('file'))
  async startBulkUpload(
    @UploadedFile() file: Express.Multer.File,
    @Body() config: BulkUploadConfigDto,
    @Req() req: Request & { user: RequestContext['user'] },
  ) {
    this.logger.debug(
      `Starting bulk upload for company: ${req.user.company.id}`,
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
  @ApiOperation({ summary: 'Get bulk upload job status' })
  @ApiResponse({ status: 200, description: 'Returns job status' })
  async getJobStatus(@Param('jobId') jobId: string) {
    this.logger.debug(`Fetching status for job: ${jobId}`);
    return this.bulkUploadService.getJobStatus(jobId);
  }

  @Get(':jobId/errors')
  @ApiOperation({ summary: 'Get bulk upload job errors' })
  @ApiResponse({ status: 200, description: 'Returns job errors' })
  async getJobErrors(@Param('jobId') jobId: string) {
    this.logger.debug(`Fetching errors for job: ${jobId}`);
    return this.bulkUploadService.getJobErrors(jobId);
  }
}
