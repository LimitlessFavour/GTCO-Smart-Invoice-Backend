import { Test, TestingModule } from '@nestjs/testing';
import { SurveyResponseService } from './survey-response.service';

describe('SurveyResponseService', () => {
  let service: SurveyResponseService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SurveyResponseService],
    }).compile();

    service = module.get<SurveyResponseService>(SurveyResponseService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
