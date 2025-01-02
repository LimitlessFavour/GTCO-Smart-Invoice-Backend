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
