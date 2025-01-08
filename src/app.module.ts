import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ClientModule } from './client/client.module';
import { UserModule } from './user/user.module';
import { CompanyModule } from './company/company.module';
import { ProductModule } from './product/product.module';
import { InvoiceModule } from './invoice/invoice.module';
import { TransactionModule } from './transaction/transaction.module';
import { ActivityModule } from './activity/activity.module';
import { SurveyResponseModule } from './survey-response/survey-response.module';
import { AuthModule } from './auth/auth.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Invoice } from './invoice/invoice.entity';
import { InvoiceItem } from './invoice/invoice-item.entity';
import { Product } from './product/entities/product.entity';
import { Company } from './company/company.entity';
import { Client } from './client/client.entity';
import { User } from './user/user.entity';
import { Activity } from './activity/activity.entity';
import { SurveyResponse } from './survey-response/survey-response.entity';
import { ConfigModule } from '@nestjs/config';
import { BulkUploadJob } from './product/entities/bulk-upload-job.entity';
import { BulkUploadProduct } from './product/entities/bulk-upload-product.entity';
import { BulkClientUploadJob } from './client/entities/bulk-client-upload-job.entity';
import { BulkClientUploadItem } from './client/entities/bulk-client-upload-item.entity';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: 'localhost',
      port: 5432,
      username: 'postgres',
      password: 'postgres',
      database: 'smartinvoice',
      entities: [
        Invoice,
        InvoiceItem,
        Product,
        Company,
        Client,
        User,
        Activity,
        SurveyResponse,
        BulkUploadJob,
        BulkUploadProduct,
        BulkClientUploadJob,
        BulkClientUploadItem,
      ],
      synchronize: true,
      autoLoadEntities: true,
    }),
    ClientModule,
    UserModule,
    CompanyModule,
    ProductModule,
    InvoiceModule,
    TransactionModule,
    ActivityModule,
    SurveyResponseModule,
    AuthModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
