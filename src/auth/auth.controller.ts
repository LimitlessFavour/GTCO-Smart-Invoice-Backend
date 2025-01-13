import {
  Controller,
  Post,
  Body,
  UseGuards,
  Req,
  Res,
  HttpStatus,
  Get,
  Query,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { SignupDto } from './dto/signup.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import {
  //   LoginResponseDto,
  SignupResponseDto,
  ValidateTokenResponseDto,
  OAuthResponseDto,
  ForgotPasswordResponseDto,
  RefreshTokenResponseDto,
  LogoutResponseDto,
  EmailVerificationResponseDto,
  OAuthCallbackResponseDto,
  AppleOAuthResponseDto,
  LoginResponseDto,
  ErrorResponseDto,
} from './dto/response.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('login')
  @ApiOperation({
    summary: 'Login user',
    description: 'Authenticate user with email and password',
  })
  @ApiBody({ type: LoginDto })
  @ApiResponse({
    status: 200,
    description: 'Login successful',
    type: LoginResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Invalid credentials',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error',
    type: ErrorResponseDto,
  })
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @Post('signup')
  @ApiOperation({
    summary: 'Register a new user',
    description: 'Create a new user account with email and password',
  })
  @ApiBody({
    type: SignupDto,
    description: 'User registration details',
    examples: {
      example1: {
        value: {
          email: 'user@example.com',
          password: 'password123',
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'User registered successfully',
    type: SignupResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid input or password requirements not met',
  })
  @ApiResponse({
    status: 409,
    description: 'User already exists',
  })
  async signup(@Body() signupDto: SignupDto) {
    return this.authService.signup(signupDto);
  }

  @Post('validate')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Validate JWT token' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Token is valid',
    type: ValidateTokenResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Invalid token',
  })
  async validateToken(@Req() req: any) {
    return { user: req.user, message: 'Token is valid' };
  }

  @Post('google')
  @ApiOperation({ summary: 'Sign in with Google' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Google OAuth URL generated successfully',
    type: OAuthResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid request',
  })
  async signInWithGoogle(@Req() req: any, @Res() res: any) {
    const data = await this.authService.signInWithGoogle();
    res.redirect(data.url);
  }

  @Post('apple')
  @ApiOperation({
    summary: 'Sign in with Apple',
    description: 'Initiate Apple OAuth authentication flow',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Apple OAuth URL generated successfully',
    type: AppleOAuthResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Failed to generate Apple OAuth URL',
  })
  async signInWithApple(@Req() req: any, @Res() res: any) {
    const data = await this.authService.signInWithApple();
    res.redirect(data.url);
  }

  @Post('forgot-password')
  @ApiOperation({
    summary: 'Request password reset',
    description: 'Send password reset instructions to user email',
  })
  @ApiBody({
    type: ForgotPasswordDto,
    description: 'User email',
    examples: {
      example1: {
        value: {
          email: 'user@example.com',
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Password reset email sent successfully',
    type: ForgotPasswordResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid email or email not found',
  })
  async forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto) {
    return this.authService.forgotPassword(forgotPasswordDto.email);
  }

  @Get('verify')
  @ApiOperation({
    summary: 'Verify email address',
    description: 'Verify user email using the token from verification email',
  })
  @ApiQuery({
    name: 'token',
    type: String,
    description: 'Email verification token',
    required: true,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Email verified successfully',
    type: EmailVerificationResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid or expired verification token',
  })
  async verifyEmail(@Query('token') token: string) {
    return this.authService.verifyEmail(token);
  }

  @Post('refresh')
  @ApiOperation({
    summary: 'Refresh access token',
    description: 'Get a new access token using a valid refresh token',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        refresh_token: {
          type: 'string',
          example: 'uuid-v4-refresh-token',
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'New access token generated successfully',
    type: RefreshTokenResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Invalid or expired refresh token',
  })
  async refreshToken(@Body('refresh_token') refreshToken: string) {
    return this.authService.refreshAccessToken(refreshToken);
  }

  @Get('google/callback')
  @ApiOperation({
    summary: 'Google OAuth callback',
    description: 'Handle the Google OAuth authentication callback',
  })
  @ApiQuery({
    name: 'code',
    type: String,
    description: 'OAuth authorization code',
    required: true,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Google authentication successful',
    type: OAuthCallbackResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid OAuth code or authentication failed',
  })
  async handleGoogleCallback(@Query('code') code: string) {
    return this.authService.handleOAuthCallback('google', code);
  }

  @Get('apple/callback')
  @ApiOperation({
    summary: 'Apple OAuth callback',
    description: 'Handle the Apple OAuth authentication callback',
  })
  @ApiQuery({
    name: 'code',
    type: String,
    description: 'OAuth authorization code',
    required: true,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Apple authentication successful',
    type: OAuthCallbackResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid OAuth code or authentication failed',
  })
  async handleAppleCallback(@Query('code') code: string) {
    return this.authService.handleOAuthCallback('apple', code);
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Logout user',
    description: 'Revoke refresh token and invalidate current session',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        refresh_token: {
          type: 'string',
          example: 'uuid-v4-refresh-token',
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Logged out successfully',
    type: LogoutResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Invalid token or unauthorized',
  })
  async logout(@Body('refresh_token') refreshToken: string) {
    return this.authService.logout(refreshToken);
  }
}
