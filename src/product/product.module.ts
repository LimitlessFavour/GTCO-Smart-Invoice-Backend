import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductController } from './controllers/product.controller';
import { ProductService } from './services/product.service';
import { Product } from './entities/product.entity';
import { BulkUploadJob } from './entities/bulk-upload-job.entity';
import { BulkUploadProduct } from './entities/bulk-upload-product.entity';
import { BulkUploadController } from './controllers/bulk-upload.controller';
import { BulkUploadService } from './services/bulk-upload.service';
import { FileProcessingService } from './services/file-processing.service';
import { StorageModule } from '../storage/storage.module';
import { ActivityModule } from '../activity/activity.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Product, BulkUploadJob, BulkUploadProduct]),
    StorageModule,
    ActivityModule,
  ],
  controllers: [ProductController, BulkUploadController],
  providers: [ProductService, BulkUploadService, FileProcessingService],
  exports: [ProductService],
})
export class ProductModule {}
