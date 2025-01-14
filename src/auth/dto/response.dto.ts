import { ApiProperty } from '@nestjs/swagger';

class CompanyDto {
  @ApiProperty({
    example: 3,
    description: 'Company ID',
  })
  id: number;

  @ApiProperty({
    example: 'Bee Merchandise',
    description: 'Company name',
  })
  name: string;

  @ApiProperty({
    example: 'Some hair selling business',
    description: 'Company description',
  })
  description: string;

  @ApiProperty({
    example: 'https://example.com/logo.jpeg',
    description: 'Company logo URL',
  })
  logo: string;

  @ApiProperty({
    example: 'user-uuid',
    description: 'User ID who owns the company',
  })
  userId: string;

  @ApiProperty({
    example: '0.00',
    description: 'Total revenue',
  })
  totalRevenue: string;

  @ApiProperty({
    example: '0.00',
    description: 'Withdrawable revenue',
  })
  withdrawableRevenue: string;

  @ApiProperty({
    example: '2025-01-07T15:08:30.940Z',
    description: 'Company creation date',
  })
  createdAt: string;

  @ApiProperty({
    example: '2025-01-07T15:08:30.940Z',
    description: 'Company last update date',
  })
  updatedAt: string;
}

class UserDto {
  @ApiProperty({
    example: '741fcee2-a4cb-4ce8-ae14-7dea32c32ea9',
    description: 'Unique identifier of the user',
  })
  id: string;

  @ApiProperty({
    example: 'Tolulope',
    description: 'First name of the user',
  })
  firstName: string;

  @ApiProperty({
    example: 'Oke',
    description: 'Last name of the user',
  })
  lastName: string;

  @ApiProperty({
    example: 'oketolulope3@gmail.com',
    description: 'Email address of the user',
  })
  email: string;

  @ApiProperty({
    example: '08091226233',
    description: 'Phone number of the user',
  })
  phoneNumber: string;

  @ApiProperty({
    example: 'Nigeria',
    description: 'Location of the user',
  })
  location: string;

  @ApiProperty({
    example: 2,
    description: 'Current onboarding step',
  })
  onboardingStep: number;

  @ApiProperty({
    example: true,
    description: 'Whether onboarding is completed',
  })
  onboardingCompleted: boolean;

  @ApiProperty({
    example: '2025-01-07T14:19:08.440Z',
    description: 'User creation date',
  })
  createdAt: Date;

  @ApiProperty({
    example: '2025-01-13T05:46:34.690Z',
    description: 'User last update date',
  })
  updatedAt: Date;

  @ApiProperty({
    type: CompanyDto,
    description: 'Company information',
  })
  company: CompanyDto;
}

export class LoginResponseDto {
  @ApiProperty({
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    description: 'JWT access token',
  })
  access_token: string;

  @ApiProperty({
    example: 'uuid-v4-refresh-token',
    description: 'Refresh token for obtaining new access tokens',
  })
  refresh_token: string;

  @ApiProperty({
    type: UserDto,
    description: 'Complete user information including company details',
  })
  user: UserDto;
}

export class SignupResponseDto {
  @ApiProperty({
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    description: 'JWT access token',
  })
  access_token: string;

  @ApiProperty({
    type: UserDto,
    description: 'User information',
  })
  user: UserDto;

  @ApiProperty({
    example: 'Please check your email for verification instructions',
    description: 'Success message',
  })
  message: string;
}

export class ValidateTokenResponseDto {
  @ApiProperty({
    description: 'User details including roles and company',
    example: {
      id: '741fcee2-a4cb-4ce8-ae14-7dea32c32ea9',
      email: 'user@example.com',
      roles: ['user'],
      company: CompanyDto,
    },
  })
  user: {
    id: string;
    email: string;
    roles: string[];
    company?: CompanyDto;
  };

  @ApiProperty({
    example: 'Token is valid',
    description: 'Success message',
  })
  message: string;
}

export class OAuthResponseDto {
  @ApiProperty({
    example: 'https://accounts.google.com/o/oauth2/auth?...',
    description: 'OAuth URL',
  })
  url: string;

  @ApiProperty({
    example: 'Google OAuth URL generated successfully',
    description: 'Success message',
  })
  message: string;
}

export class ForgotPasswordResponseDto {
  @ApiProperty({
    example: 'Password reset instructions sent to your email',
    description: 'Success message',
  })
  message: string;

  @ApiProperty({
    example: 200,
    description: 'HTTP status code',
  })
  statusCode: number;
}

export class RefreshTokenResponseDto {
  @ApiProperty({
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    description: 'New JWT access token',
  })
  access_token: string;

  @ApiProperty({
    example: 'uuid-v4-token',
    description: 'New refresh token',
  })
  refresh_token: string;

  @ApiProperty({
    example: {
      id: 'user_id',
      email: 'user@example.com',
    },
    description: 'User information',
  })
  user: Record<string, any>;
}

export class LogoutResponseDto {
  @ApiProperty({
    example: 'Logged out successfully',
    description: 'Success message',
  })
  message: string;

  @ApiProperty({
    example: 200,
    description: 'Status code',
  })
  statusCode: number;
}

export class EmailVerificationResponseDto {
  @ApiProperty({
    example: 'Email verified successfully',
    description: 'Success message',
  })
  message: string;

  @ApiProperty({
    example: 200,
    description: 'Status code',
  })
  statusCode: number;
}

export class OAuthCallbackResponseDto {
  @ApiProperty({
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    description: 'JWT access token',
  })
  access_token: string;

  @ApiProperty({
    example: 'uuid-v4-refresh-token',
    description: 'Refresh token for obtaining new access tokens',
  })
  refresh_token: string;

  @ApiProperty({
    type: UserDto,
    description: 'User information',
  })
  user: UserDto;
}

export class AppleOAuthResponseDto extends OAuthResponseDto {
  @ApiProperty({
    example: 'apple',
    description: 'OAuth provider',
  })
  provider: string;
}

export class GoogleOAuthResponseDto extends OAuthResponseDto {
  @ApiProperty({
    example: 'google',
    description: 'OAuth provider',
  })
  provider: string;
}

export class ErrorResponseDto {
  @ApiProperty({
    example: 'Invalid credentials',
    description: 'Error message',
  })
  message: string;

  @ApiProperty({
    example: 400,
    description: 'HTTP status code',
  })
  statusCode: number;
}
