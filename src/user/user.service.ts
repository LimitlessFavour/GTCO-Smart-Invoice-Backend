/* eslint-disable @typescript-eslint/no-unused-vars */
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
import { ActivityType } from 'src/activity/activity.entity';

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
      this.logger.debug(`Attempting to find user with ID: ${id}`);
      const user = await this.userRepository.findOne({
        where: { id },
        relations: ['company'],
      });

      if (!user) {
        this.logger.error(`No user found with ID: ${id}`);
        throw new NotFoundException({
          message: 'User not found',
          statusCode: 404,
        });
      }

      this.logger.debug(`Found user: ${JSON.stringify(user)}`);
      // Remove sensitive data
      delete user.password;
      return user;
    } catch (error) {
      this.logger.error(
        `Error finding user with ID ${id}: ${error.message}`,
        error?.stack,
      );
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
        type: ActivityType.USER_UPDATED,
        entityType: 'USER',
        entityId: id,
        companyId: user.company.id.toString(),
        metadata: {
          updatedFields: Object.keys(updateUserDto),
        },
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
        try {
          logoUrl = await this.storageService.uploadFile(
            logo,
            'company-logos',
            userId,
          );
        } catch (uploadError) {
          this.logger.error(
            `Failed to upload company logo for user ${userId}`,
            uploadError?.stack || 'No stack trace',
            'onboardCompany',
          );
          throw new BadRequestException({
            message: 'Failed to upload company logo: ' + uploadError.message,
            statusCode: 400,
          });
        }
      }

      const company = this.companyRepository.create({
        name: onboardCompanyDto.companyName,
        description: onboardCompanyDto.description,
        logo: logoUrl,
        userId: userId,
      });

      // Add debug logging
      this.logger.debug(
        `Creating company with data: ${JSON.stringify({
          name: onboardCompanyDto.companyName,
          description: onboardCompanyDto.description,
          logo: logoUrl,
          userId: userId,
        })}`,
      );

      try {
        await this.companyRepository.save(company);
      } catch (dbError) {
        this.logger.error(
          `Failed to save company for user ${userId}. Error: ${dbError.message}`,
          dbError?.stack,
          'onboardCompany',
        );
        throw new BadRequestException({
          message: 'Failed to create company: ' + dbError.message,
          statusCode: 400,
        });
      }

      // Then update the user
      try {
        user.onboardingStep = 2;
        user.onboardingCompleted = true;
        user.company = company;
        await this.userRepository.save(user);
      } catch (userUpdateError) {
        // Rollback company creation if user update fails
        await this.companyRepository.remove(company);
        throw new BadRequestException({
          message: 'Failed to update user onboarding status',
          statusCode: 400,
        });
      }

      // Log activity
      try {
        // Log activity
        await this.activityService.create({
          type: ActivityType.USER_ONBOARDED,
          entityType: 'USER',
          entityId: user.id,
          companyId: user.company.id.toString(),
          metadata: {
            step: user.onboardingStep,
          },
        });

        await this.activityService.create({
          type: ActivityType.COMPANY_CREATED,
          entityType: 'COMPANY',
          entityId: company.id.toString(),
          companyId: company.id.toString(),
          metadata: {
            name: company.name,
            description: company.description,
          },
        });
      } catch (activityError) {
        this.logger.error(
          `Failed to log activity for user ${userId}`,
          activityError?.stack || 'No stack trace',
          'onboardCompany',
        );
        // Don't throw here as activity logging is non-critical
      }

      return company;
    } catch (error) {
      this.logger.error(
        `Company onboarding failed for user ${userId}`,
        error?.stack || 'No stack trace',
        'onboardCompany',
      );

      if (error instanceof BadRequestException) {
        throw error;
      }
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException({
        message: 'Failed to complete company onboarding: ' + error.message,
        statusCode: 400,
      });
    }
  }

  async submitSurvey(
    userId: string,
    surveyResponseDto: SurveyResponseDto,
  ): Promise<SurveyResponse> {
    try {
      const user = await this.findById(userId);

      // Check if user already has a survey response
      const existingSurvey = await this.surveyRepository.findOne({
        where: { userId: user.id },
      });

      this.logger.debug(
        `${existingSurvey ? 'Updating' : 'Creating'} survey response for user ${userId} with data: ${JSON.stringify(
          surveyResponseDto,
        )}`,
      );

      let surveyResponse: SurveyResponse;

      if (existingSurvey) {
        // Update existing survey
        existingSurvey.source = surveyResponseDto.source;
        surveyResponse = existingSurvey;
      } else {
        // Create new survey
        surveyResponse = this.surveyRepository.create({
          userId: user.id,
          source: surveyResponseDto.source,
        });
      }

      try {
        await this.surveyRepository.save(surveyResponse);
        this.logger.debug(
          `Successfully ${existingSurvey ? 'updated' : 'saved'} survey response for user ${userId}`,
        );
      } catch (dbError) {
        this.logger.error(
          `Failed to ${existingSurvey ? 'update' : 'save'} survey response for user ${userId}`,
          dbError?.stack || 'No stack trace',
          'submitSurvey',
        );
        throw new BadRequestException({
          message: `Failed to ${existingSurvey ? 'update' : 'save'} survey response: ${dbError.message}`,
          statusCode: 400,
        });
      }

      // Log activity
      try {
        await this.activityService.create({
          type: existingSurvey
            ? ActivityType.SURVEY_UPDATED
            : ActivityType.SURVEY_CREATED,
          entityType: 'SURVEY',
          entityId: surveyResponse.id.toString(),
          companyId: user.company.id.toString(),
          metadata: {
            source: surveyResponse.source,
          },
        });
      } catch (activityError) {
        this.logger.error(
          `Failed to log activity for survey ${existingSurvey ? 'update' : 'submission'} - user ${userId}`,
          activityError?.stack || 'No stack trace',
          'submitSurvey',
        );
        // Don't throw here as activity logging is non-critical
      }

      return surveyResponse;
    } catch (error) {
      this.logger.error(
        `Survey ${error instanceof BadRequestException ? 'update' : 'submission'} failed for user ${userId}`,
        error?.stack || 'No stack trace',
        'submitSurvey',
      );

      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      throw new BadRequestException({
        message: 'Failed to process survey response: ' + error.message,
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
