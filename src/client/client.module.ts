import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClientController } from './client.controller';
import { ClientService } from './client.service';
import { Client } from './client.entity';
import { BulkClientUploadJob } from './entities/bulk-client-upload-job.entity';
import { BulkClientUploadItem } from './entities/bulk-client-upload-item.entity';
import { ClientBulkUploadController } from './controllers/client-bulk-upload.controller';
import { ClientBulkUploadService } from './services/client-bulk-upload.service';
import { ClientFileProcessingService } from './services/client-file-processing.service';
import { CompanyModule } from '../company/company.module';
import { Company } from '../company/company.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Client,
      BulkClientUploadJob,
      BulkClientUploadItem,
      Company,
    ]),
    CompanyModule,
  ],
  controllers: [ClientController, ClientBulkUploadController],
  providers: [
    ClientService,
    ClientBulkUploadService,
    ClientFileProcessingService,
  ],
  exports: [ClientService],
})
export class ClientModule {}
