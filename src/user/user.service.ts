import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { User } from './user.entity';
import { Company } from '../company/company.entity';
import { UpdateUserDto } from './dto/update-user.dto';
import { OnboardUserDto } from './dto/onboard-user.dto';
import { OnboardCompanyDto } from './dto/onboard-company.dto';
import { SurveyResponseDto } from './dto/survey-response.dto';
import { ActivityService } from '../activity/activity.service';
import { StorageService } from '../storage/storage.service';
import { SurveyResponse } from 'src/survey-response/survey-response.entity';

@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Company)
    private readonly companyRepository: Repository<Company>,
    @InjectRepository(SurveyResponse)
    private readonly surveyRepository: Repository<SurveyResponse>,
    private readonly activityService: ActivityService,
    private readonly storageService: StorageService,
    private readonly configService: ConfigService,
  ) {}

  async findById(id: string): Promise<User> {
    try {
      const user = await this.userRepository.findOne({
        where: { id },
        relations: ['company'],
      });

      if (!user) {
        throw new NotFoundException({
          message: 'User not found',
          statusCode: 404,
        });
      }

      // Remove sensitive data
      delete user.password;
      return user;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException({
        message: 'Error fetching user profile',
        statusCode: 500,
      });
    }
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<User> {
    try {
      const user = await this.findById(id);

      // Update user fields
      Object.assign(user, updateUserDto);

      await this.userRepository.save(user);

      // Log activity
      await this.activityService.create({
        userId: id,
        action: 'updated_profile',
        relatedEntity: 'user',
        relatedEntityId: id,
      });

      delete user.password;
      return user;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException({
        message: 'Failed to update user profile',
        statusCode: 400,
      });
    }
  }

  async onboardUser(id: string, onboardUserDto: OnboardUserDto): Promise<User> {
    try {
      const user = await this.findById(id);

      if (user.onboardingCompleted) {
        throw new ConflictException({
          message: 'User has already completed onboarding',
          statusCode: 409,
        });
      }

      // Update user with onboarding information
      Object.assign(user, {
        ...onboardUserDto,
        onboardingStep: 1,
      });

      await this.userRepository.save(user);

      // Log activity
      await this.activityService.create({
        userId: id,
        action: 'completed_user_onboarding',
        relatedEntity: 'user',
        relatedEntityId: id,
      });

      delete user.password;
      return user;
    } catch (error) {
      this.logger.error(
        `Failed to complete user onboarding for user ${id}`,
        error?.stack || 'No stack trace',
        'onboardUser',
      );

      if (
        error instanceof ConflictException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }
      throw new BadRequestException({
        message: 'Failed to complete user onboarding: ' + error.message,
        statusCode: 400,
      });
    }
  }

  async onboardCompany(
    userId: string,
    onboardCompanyDto: OnboardCompanyDto,
    logo?: Express.Multer.File,
  ): Promise<Company> {
    try {
      const user = await this.findById(userId);

      if (user.onboardingStep !== 1) {
        throw new BadRequestException({
          message: 'Please complete user onboarding first',
          statusCode: 400,
        });
      }

      let logoUrl: string | undefined;
      if (logo) {
        logoUrl = await this.storageService.uploadFile(
          logo,
          'company-logos',
          userId,
        );
      }

      const company = this.companyRepository.create({
        name: onboardCompanyDto.companyName,
        description: onboardCompanyDto.description,
        logo: logoUrl,
        userId: userId,
      });

      await this.companyRepository.save(company);

      // Update user onboarding status
      user.onboardingStep = 2;
      user.onboardingCompleted = true;
      await this.userRepository.save(user);

      // Log activity
      await this.activityService.create({
        userId,
        action: 'completed_company_onboarding',
        relatedEntity: 'company',
        relatedEntityId: company.id.toString(),
      });

      return company;
    } catch (error) {
      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }
      throw new InternalServerErrorException({
        message: 'Failed to complete company onboarding',
        statusCode: 500,
      });
    }
  }

  async submitSurvey(
    userId: string,
    surveyResponseDto: SurveyResponseDto,
  ): Promise<SurveyResponse> {
    try {
      const user = await this.findById(userId);

      const surveyResponse = this.surveyRepository.create({
        userId: user.id,
        source: surveyResponseDto.source,
      });

      await this.surveyRepository.save(surveyResponse);

      // Log activity
      await this.activityService.create({
        userId,
        action: 'submitted_survey',
        relatedEntity: 'survey',
        relatedEntityId: surveyResponse.id.toString(),
      });

      return surveyResponse;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException({
        message: 'Failed to submit survey response',
        statusCode: 400,
      });
    }
  }

  async getCompanyDetails(userId: string): Promise<Company> {
    try {
      const company = await this.companyRepository.findOne({
        where: { userId },
      });

      if (!company) {
        throw new NotFoundException({
          message: 'Company not found',
          statusCode: 404,
        });
      }

      return company;
    } catch (error: any) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException({
        message: 'Error fetching company details',
        statusCode: 500,
      });
    }
  }

  async getOnboardingStatus(userId: string): Promise<{
    step: number;
    completed: boolean;
  }> {
    try {
      const user = await this.findById(userId);

      return {
        step: user.onboardingStep,
        completed: user.onboardingCompleted,
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException({
        message: 'Error fetching onboarding status',
        statusCode: 500,
      });
    }
  }
}
