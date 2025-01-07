import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { User } from './user.entity';
import { Company } from '../company/company.entity';
import { SurveyResponse } from '../survey-response/survey-response.entity';
import { ActivityModule } from '../activity/activity.module';
import { ConfigModule } from '@nestjs/config';
import { StorageModule } from '../storage/storage.module';
@Module({
  imports: [
    TypeOrmModule.forFeature([User, Company, SurveyResponse]),
    ActivityModule,
    StorageModule,
    ConfigModule,
  ],
  providers: [UserService],
  controllers: [UserController],
  exports: [UserService],
})
export class UserModule {}
