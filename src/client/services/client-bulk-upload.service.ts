import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { BulkClientUploadJob } from '../entities/bulk-client-upload-job.entity';
import { BulkClientUploadItem } from '../entities/bulk-client-upload-item.entity';
import { Client } from '../client.entity';
import { ClientFileProcessingService } from './client-file-processing.service';
import { BulkClientUploadStatus } from '../entities/bulk-client-upload-job.entity';
import { BulkClientUploadItemStatus } from '../entities/bulk-client-upload-item.entity';

@Injectable()
export class ClientBulkUploadService {
  private readonly logger = new Logger(ClientBulkUploadService.name);

  constructor(
    @InjectRepository(BulkClientUploadJob)
    private bulkUploadJobRepository: Repository<BulkClientUploadJob>,
    @InjectRepository(BulkClientUploadItem)
    private bulkUploadItemRepository: Repository<BulkClientUploadItem>,
    @InjectRepository(Client)
    private clientRepository: Repository<Client>,
    private fileProcessingService: ClientFileProcessingService,
    private dataSource: DataSource,
  ) {}

  async validateFile(file: Express.Multer.File) {
    return this.fileProcessingService.validateAndParseFile(file);
  }

  async createBulkUploadJob(
    file: Express.Multer.File,
    config: any,
    companyId: number,
  ): Promise<BulkClientUploadJob> {
    const { totalRows } = await this.validateFile(file);

    const job = this.bulkUploadJobRepository.create({
      companyId,
      status: BulkClientUploadStatus.PENDING,
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

    job.status = BulkClientUploadStatus.PROCESSING;
    await this.bulkUploadJobRepository.save(job);

    try {
      const batchSize = job.config.batchSize || 100;
      for (let i = 0; i < job.totalRows; i += batchSize) {
        await this.processBatch(job, i, Math.min(i + batchSize, job.totalRows));
      }

      job.status = BulkClientUploadStatus.COMPLETED;
      job.completedAt = new Date();
    } catch (error) {
      job.status = BulkClientUploadStatus.FAILED;
      job.errorLog = [
        ...(job.errorLog || []),
        { row: 0, message: error.message, data: {} },
      ];
    }

    await this.bulkUploadJobRepository.save(job);
  }

  private async processBatch(
    job: BulkClientUploadJob,
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
      let batchSuccessful = true;

      for (const row of batchRows) {
        try {
          if (row.error) {
            await this.createFailedBulkUploadItem(queryRunner, job, row);
            job.errorCount++;
            continue;
          }

          const client = this.clientRepository.create({
            firstName: row.firstName,
            lastName: row.lastName,
            email: row.email,
            phoneNumber: row.phoneNumber,
            address: row.address,
            companyId: job.companyId,
          });

          const savedClient = await queryRunner.manager.save(Client, client);

          await this.createSuccessfulBulkUploadItem(
            queryRunner,
            job,
            row,
            savedClient,
          );
          job.successCount++;
        } catch (error) {
          batchSuccessful = false;
          this.logger.error(
            `Error processing row ${row.rowNumber}`,
            error?.stack || 'No stack trace',
            'processBatch',
          );
          await this.createFailedBulkUploadItem(
            queryRunner,
            job,
            row,
            error.message,
          );
          job.errorCount++;
        }
      }

      job.processedRows += batchRows.length;
      await queryRunner.manager.save(job);

      if (batchSuccessful) {
        await queryRunner.commitTransaction();
      } else {
        await queryRunner.rollbackTransaction();
      }
    } catch (error) {
      this.logger.error(
        `Batch processing failed for job ${job.id}`,
        error?.stack || 'No stack trace',
        'processBatch',
      );
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  private async createSuccessfulBulkUploadItem(
    queryRunner: any,
    job: BulkClientUploadJob,
    row: any,
    client: Client,
  ): Promise<void> {
    const bulkItem = this.bulkUploadItemRepository.create({
      jobId: job.id,
      rowNumber: row.rowNumber,
      status: BulkClientUploadItemStatus.SUCCESS,
      rawData: row.rawData,
      processedData: client,
    });
    await queryRunner.manager.save(BulkClientUploadItem, bulkItem);
  }

  private async createFailedBulkUploadItem(
    queryRunner: any,
    job: BulkClientUploadJob,
    row: any,
    errorMessage?: string,
  ): Promise<void> {
    const bulkItem = this.bulkUploadItemRepository.create({
      jobId: job.id,
      rowNumber: row.rowNumber,
      status: BulkClientUploadItemStatus.FAILED,
      errorMessage: errorMessage || row.error,
      rawData: row.rawData,
    });
    await queryRunner.manager.save(BulkClientUploadItem, bulkItem);
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
    const failedItems = await this.bulkUploadItemRepository.find({
      where: {
        jobId,
        status: BulkClientUploadItemStatus.FAILED,
      },
      order: {
        rowNumber: 'ASC',
      },
    });

    return failedItems.map((item) => ({
      rowNumber: item.rowNumber,
      error: item.errorMessage,
      rawData: item.rawData,
    }));
  }
}
