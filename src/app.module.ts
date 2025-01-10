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
import { AnalyticsModule } from './analytics/analytics.module';
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
import { WebhookModule } from './webhooks/webhook.module';
import { HealthModule } from './health/health.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath:
        process.env.NODE_ENV === 'production' ? '.env.production' : '.env',
    }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      url: process.env.DATABASE_URL,
      host: process.env.DB_HOST,
      port: parseInt(process.env.DB_PORT, 10),
      username: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_DATABASE,
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
      ssl:
        process.env.NODE_ENV === 'production'
          ? { rejectUnauthorized: false }
          : false,
      synchronize: process.env.NODE_ENV !== 'production',
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
    WebhookModule,
    AnalyticsModule,
    HealthModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
