import {
  Controller,
  Post,
  Body,
  UseGuards,
  Req,
  Res,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { SignupDto } from './dto/signup.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import {
  LoginResponseDto,
  SignupResponseDto,
  ValidateTokenResponseDto,
  OAuthResponseDto,
  ForgotPasswordResponseDto,
} from './dto/response.dto';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('login')
  @ApiOperation({ summary: 'Login a user' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'User logged in successfully',
    type: LoginResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Invalid credentials',
  })
  @ApiBody({ type: LoginDto })
  async login(@Body() loginDto: LoginDto) {
    const access_token = await this.authService.login(loginDto);
    return { access_token, message: 'Login successful' };
  }

  @Post('signup')
  @ApiOperation({ summary: 'Register a new user' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'User registered successfully',
    type: SignupResponseDto,
  })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Invalid input' })
  @ApiBody({ type: SignupDto })
  async signup(@Body() signupDto: SignupDto) {
    const access_token = await this.authService.signup(signupDto);
    return { access_token, message: 'User registered successfully' };
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
  @ApiOperation({ summary: 'Sign in with Apple' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Apple OAuth URL generated successfully',
    type: OAuthResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid request',
  })
  async signInWithApple(@Req() req: any, @Res() res: any) {
    const data = await this.authService.signInWithApple();
    res.redirect(data.url);
  }

  @Post('forgot-password')
  @ApiOperation({ summary: 'Request a password reset' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Password reset email sent successfully',
    type: ForgotPasswordResponseDto,
  })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Invalid email' })
  async forgotPassword(@Body('email') email: string) {
    await this.authService.forgotPassword(email);
    return { message: 'Password reset email sent successfully' };
  }
}
