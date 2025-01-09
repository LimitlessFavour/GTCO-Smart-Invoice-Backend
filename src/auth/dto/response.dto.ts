import { ApiProperty } from '@nestjs/swagger';

export class LoginResponseDto {
  @ApiProperty({
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    description: 'JWT access token',
  })
  access_token: string;

  @ApiProperty({ example: 'Login successful', description: 'Success message' })
  message: string;
}

export class SignupResponseDto {
  @ApiProperty({
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    description: 'JWT access token',
  })
  access_token: string;

  @ApiProperty({
    example: 'User registered successfully',
    description: 'Success message',
  })
  message: string;
}

export class ValidateTokenResponseDto {
  @ApiProperty({
    example: { id: 1, email: 'user@example.com', roles: ['user'] },
    description: 'User details',
  })
  user: any;

  @ApiProperty({ example: 'Token is valid', description: 'Success message' })
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
    example: 'Password reset email sent successfully',
    description: 'Success message',
  })
  message: string;
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
    example: 'uuid-v4-token',
    description: 'Refresh token',
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
