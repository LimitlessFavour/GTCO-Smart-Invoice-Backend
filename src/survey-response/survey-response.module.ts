import { Module } from '@nestjs/common';
import { SurveyResponseService } from './survey-response.service';
import { SurveyResponseController } from './survey-response.controller';

@Module({
  providers: [SurveyResponseService],
  controllers: [SurveyResponseController],
})
export class SurveyResponseModule {}
