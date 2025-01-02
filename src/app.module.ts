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

@Module({
  imports: [
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
