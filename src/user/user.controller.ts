/* eslint-disable @typescript-eslint/no-unused-vars */
import {
  Body,
  Controller,
  Get,
  Post,
  Put,
  UploadedFile,
  UseGuards,
  UseInterceptors,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { OnboardCompanyDto } from '../user/dto/onboard-company.dto';
import { OnboardUserDto } from '../user/dto/onboard-user.dto';
import { SurveyResponseDto } from '../user/dto/survey-response.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserService } from './user.service';
import { UserResponseDto } from '../user/dto/user-response.dto';
import { CompanyResponseDto } from '../user/dto/company-response.dto';
import { OnboardingStatusResponseDto } from '../user/dto/onboarding-status-response.dto';
import { SurveyResponseOutputDto } from '../user/dto/survey-response-output.dto';

@ApiTags('User')
@Controller('user')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
export class UserController {
  private readonly logger = new Logger(UserController.name);

  constructor(private readonly userService: UserService) {}

  @Get('profile')
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiResponse({
    status: 200,
    description: 'Returns the user profile',
    type: UserResponseDto,
  })
  async getProfile(@GetUser() user: any): Promise<UserResponseDto> {
    return this.userService.findById(user.sub);
  }

  @Put('profile')
  @ApiOperation({ summary: 'Update user profile' })
  @ApiResponse({
    status: 200,
    description: 'Profile updated successfully',
    type: UserResponseDto,
  })
  async updateProfile(
    @GetUser() user: any,
    @Body() updateUserDto: UpdateUserDto,
  ): Promise<UserResponseDto> {
    return this.userService.update(user.sub, updateUserDto);
  }

  @Post('onboard/user')
  @ApiOperation({ summary: 'Complete user onboarding' })
  @ApiResponse({
    status: 201,
    description: 'User onboarding completed',
    type: UserResponseDto,
  })
  async onboardUser(
    @GetUser() user: any,
    @Body() onboardUserDto: OnboardUserDto,
  ): Promise<UserResponseDto> {
    this.logger.debug(`User object from token: ${JSON.stringify(user)}`);
    if (!user?.sub) {
      this.logger.error(`Invalid user object: ${JSON.stringify(user)}`);
      throw new BadRequestException({
        message: 'Invalid user ID in token',
        statusCode: 400,
      });
    }

    this.logger.debug(`Attempting to onboard user with ID: ${user.sub}`);
    return this.userService.onboardUser(user.sub, onboardUserDto);
  }

  @Post('onboard/company')
  @ApiOperation({ summary: 'Complete company onboarding' })
  @ApiResponse({ status: 201, description: 'Company onboarding completed' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        companyName: { type: 'string' },
        description: { type: 'string' },
        logo: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @UseInterceptors(FileInterceptor('logo'))
  async onboardCompany(
    @GetUser() user: any,
    @Body() onboardCompanyDto: OnboardCompanyDto,
    @UploadedFile() logo: Express.Multer.File,
  ) {
    return this.userService.onboardCompany(user.sub, onboardCompanyDto, logo);
  }

  @Post('survey')
  @ApiOperation({ summary: 'Submit survey response' })
  @ApiResponse({
    status: 201,
    description: 'Survey response recorded',
    type: SurveyResponseOutputDto,
  })
  async submitSurvey(
    @GetUser() user: any,
    @Body() surveyResponseDto: SurveyResponseDto,
  ): Promise<SurveyResponseOutputDto> {
    return this.userService.submitSurvey(user.sub, surveyResponseDto);
  }

  @Get('company')
  @ApiOperation({ summary: 'Get user company details' })
  @ApiResponse({
    status: 200,
    description: 'Returns the company details',
    type: CompanyResponseDto,
  })
  async getCompany(@GetUser() user: any): Promise<CompanyResponseDto> {
    return this.userService.getCompanyDetails(user.sub);
  }

  @Get('onboarding-status')
  @ApiOperation({ summary: 'Get user onboarding status' })
  @ApiResponse({
    status: 200,
    description: 'Returns the onboarding status',
    type: OnboardingStatusResponseDto,
  })
  async getOnboardingStatus(
    @GetUser() user: any,
  ): Promise<OnboardingStatusResponseDto> {
    return this.userService.getOnboardingStatus(user.sub);
  }
}
