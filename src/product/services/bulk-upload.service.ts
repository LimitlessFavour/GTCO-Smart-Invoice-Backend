/* eslint-disable @typescript-eslint/no-unused-vars */
import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { BulkUploadJob } from '../entities/bulk-upload-job.entity';
import { BulkUploadProduct } from '../entities/bulk-upload-product.entity';
import { Product } from '../entities/product.entity';
import { FileProcessingService } from './file-processing.service';
import { BulkUploadStatus } from '../entities/bulk-upload-job.entity';
import { BulkUploadProductStatus } from '../entities/bulk-upload-product.entity';

@Injectable()
export class BulkUploadService {
  private readonly logger = new Logger(BulkUploadService.name);

  constructor(
    @InjectRepository(BulkUploadJob)
    private bulkUploadJobRepository: Repository<BulkUploadJob>,
    @InjectRepository(BulkUploadProduct)
    private bulkUploadProductRepository: Repository<BulkUploadProduct>,
    @InjectRepository(Product)
    private productRepository: Repository<Product>,
    private fileProcessingService: FileProcessingService,
    private dataSource: DataSource,
  ) {}

  async validateFile(file: Express.Multer.File) {
    return this.fileProcessingService.validateAndParseFile(file);
  }

  async createBulkUploadJob(
    file: Express.Multer.File,
    config: any,
    companyId: number,
  ): Promise<BulkUploadJob> {
    const { totalRows } = await this.validateFile(file);

    const job = this.bulkUploadJobRepository.create({
      companyId,
      status: BulkUploadStatus.PENDING,
      totalRows,
      config,
      file: file.buffer,
    });

    return this.bulkUploadJobRepository.save(job);
  }

  async processJob(jobId: string): Promise<void> {
    const job = await this.bulkUploadJobRepository.findOne({
      where: { id: jobId },
    });

    if (!job) {
      throw new Error('Job not found');
    }

    job.status = BulkUploadStatus.PROCESSING;
    await this.bulkUploadJobRepository.save(job);

    try {
      // Process in batches
      const batchSize = job.config.batchSize || 100;
      for (let i = 0; i < job.totalRows; i += batchSize) {
        await this.processBatch(job, i, Math.min(i + batchSize, job.totalRows));
      }

      job.status = BulkUploadStatus.COMPLETED;
      job.completedAt = new Date();
    } catch (error) {
      job.status = BulkUploadStatus.FAILED;
      job.errorLog = [
        ...(job.errorLog || []),
        { row: 0, message: error.message, data: {} },
      ];
    }

    await this.bulkUploadJobRepository.save(job);
  }

  private async processBatch(
    job: BulkUploadJob,
    start: number,
    end: number,
  ): Promise<void> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      if (!job.file) {
        throw new Error('File buffer not found in job');
      }

      const processedRows = await this.fileProcessingService.processFileData(
        job.file,
        job.config.columnMapping,
        job.config.defaultValues,
      );

      const batchRows = processedRows.slice(start, end);

      for (const row of batchRows) {
        try {
          if (row.error) {
            await this.createFailedBulkUploadProduct(queryRunner, job, row);
            job.errorCount++;
            continue;
          }

          // Check for existing product
          const existingProduct = await queryRunner.manager.findOne(Product, {
            where: {
              productName: row.productName,
              companyId: job.companyId,
            },
          });

          if (existingProduct) {
            // Create successful upload record pointing to existing product
            await this.createSuccessfulBulkUploadProduct(
              queryRunner,
              job,
              row,
              existingProduct,
            );
            job.successCount++;
            continue;
          }

          // Continue with normal creation for new products
          const sku = await this.generateSKU(
            row.productName,
            job.companyId,
            queryRunner,
          );

          const product = this.productRepository.create({
            productName: row.productName,
            description: row.description,
            category: row.category,
            price: row.price,
            defaultQuantity: row.defaultQuantity,
            vatCategory: row.vatCategory,
            sku,
            companyId: job.companyId,
          });

          const savedProduct = await queryRunner.manager
            .getRepository(Product)
            .save(product);

          await this.createSuccessfulBulkUploadProduct(
            queryRunner,
            job,
            row,
            savedProduct,
          );
          job.successCount++;
        } catch (error) {
          this.logger.error(
            `Error processing row ${row.rowNumber}`,
            error?.stack || 'No stack trace',
            'processBatch',
          );
          await this.createFailedBulkUploadProduct(
            queryRunner,
            job,
            row,
            error.message,
          );
          job.errorCount++;
        }
      }

      // Update job counts
      await queryRunner.manager.save(job);
      await queryRunner.commitTransaction();
    } catch (error) {
      this.logger.error(
        `Batch processing failed for job ${job.id}`,
        error?.stack || 'No stack trace',
        'processBatch',
      );
      try {
        await queryRunner.rollbackTransaction();
      } catch (rollbackError) {
        this.logger.error(
          `Rollback failed for job ${job.id}`,
          rollbackError?.stack || 'No stack trace',
          'processBatch',
        );
      }
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  private async createSuccessfulBulkUploadProduct(
    queryRunner: any,
    job: BulkUploadJob,
    row: any,
    product: Product,
  ): Promise<void> {
    const bulkProduct = this.bulkUploadProductRepository.create({
      jobId: job.id,
      rowNumber: row.rowNumber,
      status: BulkUploadProductStatus.SUCCESS,
      rawData: row.rawData,
      processedData: product,
    });
    await queryRunner.manager.save(BulkUploadProduct, bulkProduct);
  }

  private async createFailedBulkUploadProduct(
    queryRunner: any,
    job: BulkUploadJob,
    row: any,
    errorMessage?: string,
  ): Promise<void> {
    const bulkProduct = this.bulkUploadProductRepository.create({
      jobId: job.id,
      rowNumber: row.rowNumber,
      status: BulkUploadProductStatus.FAILED,
      errorMessage: errorMessage || row.error,
      rawData: row.rawData,
    });
    await queryRunner.manager.save(BulkUploadProduct, bulkProduct);
  }

  private async generateSKU(
    productName: string,
    companyId: number,
    queryRunner: any,
  ): Promise<string> {
    const timestamp = Date.now().toString().slice(-4);
    const namePrefix = productName.slice(0, 3).toUpperCase();
    const sku = `${namePrefix}-${companyId}-${timestamp}`;

    // Check if SKU exists
    const existing = await queryRunner.manager.findOne(Product, {
      where: { sku, companyId },
    });

    if (existing) {
      // If exists, recursively try again with a new timestamp
      return this.generateSKU(productName, companyId, queryRunner);
    }

    return sku;
  }

  async getJobStatus(jobId: string) {
    const job = await this.bulkUploadJobRepository.findOne({
      where: { id: jobId },
    });

    if (!job) {
      throw new NotFoundException('Job not found');
    }

    return {
      id: job.id,
      status: job.status,
      totalRows: job.totalRows,
      processedRows: job.processedRows,
      successCount: job.successCount,
      errorCount: job.errorCount,
      createdAt: job.createdAt,
      completedAt: job.completedAt,
    };
  }

  async getJobErrors(jobId: string) {
    const failedProducts = await this.bulkUploadProductRepository.find({
      where: {
        jobId,
        status: BulkUploadProductStatus.FAILED,
      },
      order: {
        rowNumber: 'ASC',
      },
    });

    return failedProducts.map((product) => ({
      rowNumber: product.rowNumber,
      error: product.errorMessage,
      rawData: product.rawData,
    }));
  }
}
